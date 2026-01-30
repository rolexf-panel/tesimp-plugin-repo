const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, '../database/gofile.json');

const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);
    return fs.readJsonSync(dbPath);
};
const writeDB = (data) => fs.writeJsonSync(dbPath, data, { spaces: 2 });

module.exports = {
    name: 'gofile',
    version: '1.0.0',
    description: 'Upload file to Gofile.io (unlimited size) via GitHub Actions',
    commands: ['gofile', 'gf', 'gflist', 'gfcancel'],
    activeUploads: new Map(),
    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const command = msg.text.split(' ')[0].substring(1).toLowerCase();

        if (command === 'gfcancel') return this.handleCancel(bot, chatId, userId);
        if (command === 'gflist') return this.handleList(bot, chatId, userId);

        return this.handleUpload(bot, msg, chatId, userId, botInstance);
    },
    async handleList(bot, chatId, userId) {
        const db = readDB();
        const userFiles = db.filter(f => f.userId === userId);

        if (userFiles.length === 0) {
            return bot.sendMessage(chatId, '📭 You have not uploaded any files to Gofile yet.\n(Note: Auto-history saving is not implemented yet)');
        }

        let list = `*Gofile Upload History*\n━━━━━━━━━━━━━━━━━━━━\n\nTotal: ${userFiles.length} files\n\n`;
        userFiles.slice(-15).reverse().forEach((f, i) => {
            list += `${i + 1}. *${f.fileName}*\n Size: ${f.fileSize ? botInstance.formatFileSize(f.fileSize) : 'Unknown'} | ${f.date}\n [Download](https://gofile.io/d/${f.code})\n\n`;
        });

        const keyboard = [[{ text: '🗑️ Clear History', callback_data: 'gf_clear_history' }]];
        return bot.sendMessage(chatId, list, { parse_mode: 'Markdown', disable_web_page_preview: true, reply_markup: { inline_keyboard: keyboard } });
    },
    async handleCancel(bot, chatId, userId) {
        const uploadId = `${userId}_${chatId}`;
        if (!this.activeUploads.has(uploadId)) return bot.sendMessage(chatId, '❌ No active upload running.');

        const upload = this.activeUploads.get(uploadId);
        upload.cancelled = true;

        try {
            await bot.editMessageText('🚫 *Upload Cancelled*\n\nFile: ${upload.fileName}\nStatus: Cancelled by user', {
                chat_id: chatId, message_id: upload.messageId, parse_mode: 'Markdown'
            });
        } catch (e) {}
        if (upload.workflowRunId && process.env.GITHUB_TOKEN) {
            try { await this.cancelGitHubWorkflow(upload.workflowRunId); } catch (e) {}
        }
        this.activeUploads.delete(uploadId);
        return bot.sendMessage(chatId, '✅ Upload cancelled successfully.');
    },
    async handleUpload(bot, msg, chatId, userId, botInstance) {
        const uploadId = `${userId}_${chatId}`;
        if (this.activeUploads.has(uploadId)) return bot.sendMessage(chatId, '⏳ You already have an active upload. Use /gfcancel to cancel it.');

        const files = this.extractFiles(msg);
        if (files.length === 0) {
            return bot.sendMessage(chatId, '❌ *Usage:*\n• Send file with caption `/gf`\n• Reply to file with `/gf`\n• Supports any size (unlimited)', { parse_mode: 'Markdown' });
        }

        return this.startUpload(bot, msg, chatId, userId, files[0], botInstance);
    },
    extractFiles(msg) {
        const files = [];
        const targetMsg = msg.reply_to_message || msg;
        const fileObj = targetMsg.document || targetMsg.video || targetMsg.audio || (targetMsg.photo ? targetMsg.photo[targetMsg.photo.length - 1] : null);
        if (fileObj) {
            files.push({
                fileId: fileObj.file_id,
                fileName: fileObj.file_name || `file_${Date.now()}.${this.getExtension(fileObj)}`,
                fileSize: fileObj.file_size || 0,
                mimeType: fileObj.mime_type || 'application/octet-stream'
            });
        }
        return files;
    },
    getExtension(fileObj) {
        return fileObj.mime_type ? fileObj.mime_type.split('/')[1] || 'bin' : 'bin';
    },
    async startUpload(bot, msg, chatId, userId, file, b
otInstance) {
        const uploadId = `${userId}_${chatId}`;
        const sourceMsg = msg.reply_to_message || msg;

        const initialMsg = await bot.sendMessage(chatId, '🚀 *Preparing Gofile Upload*\n\n📄 *File:* ${file.fileName}\n📦 *Size:* ${botInstance.formatFileSize ? botInstance.formatFileSize(file.fileSize) : 'Unknown'}\n\n⏳ Initializing...', { parse_mode: 'Markdown' });

        this.activeUploads.set(uploadId, {
            messageId: initialMsg.message_id,
            fileName: file.fileName,
            cancelled: false
        });

        try {
            const result = await this.triggerGitHubWorkflow({
                chat_id: chatId.toString(),
                user_id: userId,
                message_id: initialMsg.message_id.toString(),
                file_id: file.fileId,
                source_chat_id: sourceMsg.chat.id.toString(),
                source_message_id: sourceMsg.message_id.toString(),
                file_name: file.fileName,
                file_size: file.fileSize.toString(),
                mime_type: file.mimeType,
                bot_token: botInstance.config.token
            }, 'gofile-upload.yml');

            if (!result.success) throw new Error(result.error || 'Failed to trigger');

            const upload = this.activeUploads.get(uploadId);
            if (upload) upload.workflowRunId = result.runId;
        } catch (error) {
            this.activeUploads.delete(uploadId);
            await bot.editMessageText('❌ *Upload Failed to Start*\n\nError: ${error.message}', { chat_id: chatId, message_id: initialMsg.message_id, parse_mode: 'Markdown' });
        }
    },
    async triggerGitHubWorkflow(data, workflowFile) {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO;

        if (!GITHUB_TOKEN || !GITHUB_REPO) return { success: false, error: 'GitHub credentials not configured' };

        try {
            const [owner, repo] = GITHUB_REPO.split('/');
            await axios.post(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
                ref: 'main',
                inputs: data
            }, {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });

            await new Promise(r => setTimeout(r, 2000));
            const runs = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`, {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });
            const runId = runs.data.workflow_runs[0]?.id;
            return { success: true, runId };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },
    async cancelGitHubWorkflow(runId) {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO;
        if (!GITHUB_TOKEN || !GITHUB_REPO) return;
        const [owner, repo] = GITHUB_REPO.split('/');
        await axios.post(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
        });
    },
    async handleCallback(bot, query, botInstance) {
        if (query.data === 'gf_clear_history') {
            const userId = query.from.id.toString();
            writeDB(readDB().filter(f => f.userId !== userId));
            await bot.answerCallbackQuery(query.id, { text: '🗑️ History cleared!', show_alert: true });
            await bot.editMessageText('✅ *History Cleared*\n\nAll your Gofile history has been deleted.', {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });
        }
    }
};
