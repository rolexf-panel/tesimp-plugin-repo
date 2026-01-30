const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, '../database/pixeldrain.json');
const queuePath = path.join(__dirname, '../database/upload-queue.json');

// Helper Database
const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);
    return fs.readJsonSync(dbPath);
};

const writeDB = (data) => fs.writeJsonSync(dbPath, data, { spaces: 2 });

const readQueue = () => {
    if (!fs.existsSync(queuePath)) fs.writeJsonSync(queuePath, {});
    return fs.readJsonSync(queuePath);
};

const writeQueue = (data) => fs.writeJsonSync(queuePath, data, { spaces: 2 });

module.exports = {
    name: 'pixeldrain',
    version: '2.0.0',
    description: 'Upload file ke Pixeldrain (up to 2GB) via GitHub Actions',
    commands: ['pixeldrain', 'pd', 'pdlist', 'pdcancel'],

    // Storage untuk tracking upload yang sedang berjalan
    activeUploads: new Map(),

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const command = msg.text.split(' ')[0].substring(1).toLowerCase();

        // Command: /pdcancel - Cancel upload
        if (command === 'pdcancel') {
            return this.handleCancel(bot, chatId, userId);
        }

        // Command: /pdlist - Lihat riwayat
        if (command === 'pdlist') {
            return this.handleList(bot, chatId, userId);
        }

        // Command: /pd atau /pixeldrain - Upload file
        return this.handleUpload(bot, msg, chatId, userId, botInstance);
    },

    async handleList(bot, chatId, userId) {
        const db = readDB();
        const userFiles = db.filter(f => f.userId === userId);
        
        if (userFiles.length === 0) {
            return bot.sendMessage(chatId, '📭 Kamu belum pernah mengupload file.');
        }

        let list = `📁 *Riwayat Upload Pixeldrain*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        list += `Total: ${userFiles.length} files\n\n`;
        
        userFiles.slice(-15).reverse().forEach((f, i) => {
            const size = this.formatFileSize(f.fileSize || 0);
            list += `${i + 1}. *${f.fileName}*\n`;
            list += `   Size: ${size} | ${f.date}\n`;
            list += `   [Download](https://pixeldrain.com/u/${f.fileId})\n\n`;
        });

        const keyboard = [
            [{ text: '🗑️ Clear History', callback_data: 'pd_clear_history' }]
        ];

        return bot.sendMessage(chatId, list, { 
            parse_mode: 'Markdown', 
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard: keyboard }
        });
    },

    async handleCancel(bot, chatId, userId) {
        const uploadId = `${userId}_${chatId}`;
        
        if (!this.activeUploads.has(uploadId)) {
            return bot.sendMessage(chatId, '❌ Tidak ada upload yang sedang berjalan.');
        }

        const upload = this.activeUploads.get(uploadId);
        
        // Set cancel flag
        upload.cancelled = true;
        
        // Update message
        try {
            await bot.editMessageText(
                '🚫 *Upload Dibatalkan*\n\n' +
                `File: ${upload.fileName}\n` +
                `Status: Cancelled by user`,
                {
                    chat_id: chatId,
                    message_id: upload.messageId,
                    parse_mode: 'Markdown'
                }
            );
        } catch (e) {
            console.error('Failed to update cancel message:', e.message);
        }

        // Trigger GitHub Actions cancel via API
        if (upload.workflowRunId && process.env.GITHUB_TOKEN) {
            try {
                await this.cancelGitHubWorkflow(upload.workflowRunId);
            } catch (e) {
                console.error('Failed to cancel workflow:', e.message);
            }
        }

        this.activeUploads.delete(uploadId);
        
        return bot.sendMessage(chatId, '✅ Upload berhasil dibatalkan.');
    },

    async handleUpload(bot, msg, chatId, userId, botInstance) {
        const uploadId = `${userId}_${chatId}`;
        
        // Check if already uploading
        if (this.activeUploads.has(uploadId)) {
            return bot.sendMessage(chatId, 
                '⏳ Kamu masih memiliki upload yang sedang berjalan.\n\n' +
                'Gunakan /pdcancel untuk membatalkan upload sebelumnya.'
            );
        }

        // Get file from message
        const files = this.extractFiles(msg);
        
        if (files.length === 0) {
            return bot.sendMessage(chatId, 
                '❌ *Usage:*\n' +
                '• Kirim file dengan caption `/pd`\n' +
                '• Reply file dengan `/pd`\n' +
                '• Kirim multiple files (media group)\n\n' +
                '*Supported:* Documents, Photos, Videos, Audio\n' +
                '*Max Size:* 2GB per file',
                { parse_mode: 'Markdown' }
            );
        }

        // Start upload process
        return this.startUpload(bot, msg, chatId, userId, files, botInstance);
    },

    extractFiles(msg) {
        const files = [];
        const targetMsg = msg.reply_to_message || msg;

        // Single file
        const fileObj = targetMsg.document || 
                       targetMsg.video || 
                       targetMsg.audio ||
                       (targetMsg.photo ? targetMsg.photo[targetMsg.photo.length - 1] : null);

        if (fileObj) {
            files.push({
                fileId: fileObj.file_id,
                fileName: fileObj.file_name || `file_${Date.now()}.${this.getExtension(fileObj)}`,
                fileSize: fileObj.file_size || 0,
                fileType: this.getFileType(fileObj),
                mimeType: fileObj.mime_type || 'application/octet-stream'
            });
        }

        // TODO: Media group support (requires bot to track media groups)
        
        return files;
    },

    getExtension(fileObj) {
        if (fileObj.mime_type) {
            const ext = fileObj.mime_type.split('/')[1];
            if (ext) return ext;
        }
        return 'bin';
    },

    getFileType(fileObj) {
        if (fileObj.mime_type) {
            const type = fileObj.mime_type.split('/')[0];
            return type.charAt(0).toUpperCase() + type.slice(1);
        }
        return 'File';
    },

    async startUpload(bot, msg, chatId, userId, files, botInstance) {
        const uploadId = `${userId}_${chatId}`;
        const file = files[0]; // For now, handle single file

        // Create initial message
        const initialMsg = await bot.sendMessage(chatId, 
            '🚀 *Preparing Upload*\n━━━━━━━━━━━━━━━━━━━━\n\n' +
            `📄 *File:* ${file.fileName}\n` +
            `📦 *Size:* ${this.formatFileSize(file.fileSize)}\n` +
            `📋 *Type:* ${file.fileType}\n\n` +
            `⏳ Initializing...`,
            { parse_mode: 'Markdown' }
        );

        // Store upload state
        this.activeUploads.set(uploadId, {
            messageId: initialMsg.message_id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            startTime: Date.now(),
            cancelled: false
        });

        try {
            // Trigger GitHub Actions workflow
            const workflowResult = await this.triggerGitHubWorkflow({
                chatId: chatId,
                userId: userId,
                messageId: initialMsg.message_id,
                fileId: file.fileId,
                fileName: file.fileName,
                fileSize: file.fileSize,
                fileType: file.fileType,
                mimeType: file.mimeType,
                botToken: botInstance.config.token
            });

            if (!workflowResult.success) {
                throw new Error(workflowResult.error || 'Failed to trigger workflow');
            }

            // Update upload state with workflow info
            const upload = this.activeUploads.get(uploadId);
            if (upload) {
                upload.workflowRunId = workflowResult.runId;
            }

            // Workflow started successfully
            // Python script will handle progress updates and final result
            console.log(`Workflow triggered successfully for upload ${uploadId}`);
            console.log(`GitHub Actions will handle the upload and update Telegram directly`);

        } catch (error) {
            console.error('Upload start error:', error);
            
            this.activeUploads.delete(uploadId);
            
            await bot.editMessageText(
                '❌ *Upload Failed*\n\n' +
                `Error: ${error.message}\n\n` +
                'Please make sure GitHub Actions is configured correctly.',
                {
                    chat_id: chatId,
                    message_id: initialMsg.message_id,
                    parse_mode: 'Markdown'
                }
            );
        }
    },

    async triggerGitHubWorkflow(data) {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO; // format: owner/repo
        
        if (!GITHUB_TOKEN || !GITHUB_REPO) {
            return {
                success: false,
                error: 'GitHub credentials not configured. Set GITHUB_TOKEN and GITHUB_REPO in .env'
            };
        }

        try {
            const [owner, repo] = GITHUB_REPO.split('/');
            
            const response = await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/actions/workflows/pixeldrain-upload.yml/dispatches`,
                {
                    ref: 'main',
                    inputs: {
                        chat_id: data.chatId.toString(),
                        user_id: data.userId.toString(),
                        message_id: data.messageId.toString(),
                        file_id: data.fileId,
                        file_name: data.fileName,
                        file_size: data.fileSize.toString(),
                        file_type: data.fileType,
                        mime_type: data.mimeType,
                        bot_token: data.botToken
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            // Get the run ID (need to fetch recent runs)
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for workflow to start
            
            const runsResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            const runId = runsResponse.data.workflow_runs[0]?.id;

            return {
                success: true,
                runId: runId
            };

        } catch (error) {
            console.error('GitHub API error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    async monitorWorkflow(bot, chatId, userId, uploadId, runId) {
        // Simplified monitoring - just for cleanup
        // Python script handles all Telegram updates directly
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO;
        
        if (!GITHUB_TOKEN || !GITHUB_REPO || !runId) return;

        const [owner, repo] = GITHUB_REPO.split('/');
        
        const checkInterval = setInterval(async () => {
            try {
                const upload = this.activeUploads.get(uploadId);
                
                // Check if cancelled or removed
                if (!upload || upload.cancelled) {
                    clearInterval(checkInterval);
                    return;
                }

                // Get workflow status for cleanup only
                const response = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                const run = response.data;
                
                // Check for completion - just cleanup
                if (run.status === 'completed') {
                    clearInterval(checkInterval);
                    
                    // Clean up upload state
                    // Python script already sent the result to Telegram
                    this.activeUploads.delete(uploadId);
                    
                    console.log(`Workflow ${runId} completed. Upload ${uploadId} cleaned up.`);
                }

            } catch (error) {
                console.error('Monitor workflow error:', error.message);
            }
        }, 10000); // Check every 10 seconds (less frequent since we don't handle results)
    },

    async handleUploadSuccess(bot, chatId, userId, uploadId) {
        // This is now handled by Python script directly
        // Just clean up
        this.activeUploads.delete(uploadId);
    },

    async handleUploadFailure(bot, chatId, userId, uploadId, conclusion) {
        // This is now handled by Python script directly
        // Just clean up
        this.activeUploads.delete(uploadId);
    },

    async cancelGitHubWorkflow(runId) {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO;
        
        if (!GITHUB_TOKEN || !GITHUB_REPO) return;

        const [owner, repo] = GITHUB_REPO.split('/');

        await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async handleCallback(bot, query, botInstance) {
        if (query.data === 'pd_clear_history') {
            const userId = query.from.id.toString();
            const db = readDB();
            const filtered = db.filter(f => f.userId !== userId);
            writeDB(filtered);

            await bot.answerCallbackQuery(query.id, {
                text: '🗑️ History cleared!',
                show_alert: true
            });

            await bot.editMessageText(
                '✅ *History Cleared*\n\n' +
                'All your upload history has been deleted.',
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown'
                }
            );
        }
    }
};
