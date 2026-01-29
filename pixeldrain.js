const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, '../database/pixeldrain.json');

const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);
    return fs.readJsonSync(dbPath);
};

const writeDB = (data) => fs.writeJsonSync(dbPath, data, { spaces: 2 });

// Konfigurasi GitHub
const GH_OWNER = process.env.GH_OWNER || 'rolexf-panel';
const GH_REPO = process.env.GH_REPO || 'TeSimp-Telegram-Bot';
const GH_TOKEN = process.env.GH_PAT || ''; // isi dari .env

// Tracking run_id untuk cancel (di memori)
const jobTracker = {}; // { "chatId_messageId": runId }

async function triggerWorkflow(fileId, fileName, chatId, messageId) {
    try {
        await axios.post(
            `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
            {
                event_type: 'start-upload',
                client_payload: {
                    file_id: fileId,
                    file_name: fileName,
                    chat_id: String(chatId),
                    message_id: String(messageId),
                },
            },
            {
                headers: {
                    Authorization: `token ${GH_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );
        return true;
    } catch (error) {
        console.error('Gagal trigger workflow:', error.response?.data || error.message);
        return false;
    }
}

async function getLatestRunId() {
    try {
        const res = await axios.get(
            `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=1`,
            {
                headers: {
                    Authorization: `token ${GH_TOKEN}`,
                },
            }
        );
        if (res.data.workflow_runs && res.data.workflow_runs.length > 0) {
            return res.data.workflow_runs[0].id;
        }
    } catch (e) {
        console.error('Gagal ambil run ID:', e.response?.data || e.message);
    }
    return null;
}

async function cancelWorkflow(runId) {
    if (!runId) return false;
    try {
        await axios.post(
            `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}/cancel`,
            {},
            {
                headers: {
                    Authorization: `token ${GH_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );
        return true;
    } catch (error) {
        console.error('Gagal cancel:', error.response?.data || error.message);
        return false;
    }
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileType(filename) {
    const ext = getFileExtension(filename);
    if (['mp4', 'mkv', 'webm', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'file';
}

function formatSize(bytes) {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
}

module.exports = {
    name: 'pixeldrain',
    version: '2.0.0',
    description: 'Upload file besar ke Pixeldrain via GitHub Actions',
    author: 'You',
    commands: ['pixeldrain', 'pd', 'pdlist'],

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const userId = String(msg.from.id);

        // /pdlist
        if (msg.text && msg.text.includes('pdlist')) {
            const db = readDB();
            const userFiles = db.filter((f) => f.userId === userId);

            if (userFiles.length === 0) {
                return bot.sendMessage(chatId, '📭 Kamu belum pernah mengupload file.');
            }

            let list = `📁 *Riwayat Upload Pixeldrain*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            userFiles.slice(-10).forEach((f, i) => {
                list += `${i + 1}. [${f.fileName}](https://pixeldrain.com/u/${f.fileId})\n`;
            });
            return bot.sendMessage(chatId, list, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            });
        }

        // Deteksi file
        const targetMsg = msg.reply_to_message || msg;
        const fileObj =
            targetMsg.document ||
            (targetMsg.photo && targetMsg.photo[targetMsg.photo.length - 1]) ||
            targetMsg.video ||
            targetMsg.audio;

        if (!fileObj) {
            return bot.sendMessage(
                chatId,
                '❌ *Gagal!* Kirim file dengan caption `/pd` atau balas (reply) file dengan `/pd`.',
                { parse_mode: 'Markdown' }
            );
        }

        const fileId = fileObj.file_id;
        const fileName =
            fileObj.file_name || `upload_${Date.now()}.${getFileExtension('bin')}`;

        // Pesan awal dengan tombol cancel
        const sentMsg = await bot.sendMessage(
            chatId,
            `⏳ *Menyiapkan Worker GitHub...*\n\n` +
                `📄 Nama: \`${fileName}\`\n` +
                `🔄 Status: Menunggu antrian GitHub Actions`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '❌ Batalkan',
                                callback_data: `pd_cancel_wait_${chatId}`,
                            },
                        ],
                    ],
                },
            }
        );

        const messageId = sentMsg.message_id;

        // Perbaiki callback_data dengan message_id yang benar
        await bot.editMessageReplyMarkup(
            {
                inline_keyboard: [
                    [
                        {
                            text: '❌ Batalkan',
                            callback_data: `pd_cancel_${chatId}_${messageId}`,
                        },
                    ],
                ],
            },
            { chat_id: chatId, message_id: messageId }
        );

        // Trigger workflow
        const ok = await triggerWorkflow(fileId, fileName, chatId, messageId);
        if (!ok) {
            return bot.editMessageText(
                chatId,
                messageId,
                '❌ Gagal memicu GitHub Actions. Cek log server / konfigurasi GH_PAT.'
            );
        }

        // Tunggu sebentar lalu ambil run_id agar bisa di-cancel
        setTimeout(async () => {
            const runId = await getLatestRunId();
            if (runId) {
                jobTracker[`${chatId}_${messageId}`] = runId;
                console.log(`[pixeldrain] track job ${chatId}_${messageId} -> run ${runId}`);
            }
        }, 3000);
    },

    async handleCallback(bot, query, botInstance) {
        const data = query.data || '';
        const msg = query.message;
        const chatId = msg.chat.id;
        const messageId = msg.message_id;

        if (!data.startsWith('pd_cancel_')) return;

        // format: pd_cancel_CHATID_MESSAGEID atau pd_cancel_wait_CHATID
        const parts = data.split('_');
        if (parts[2] === 'wait') {
            // user klik cancel sebelum messageId fix
            return bot.answerCallbackQuery(query.id, {
                text: '⏳ Tunggu sebentar, job sedang disiapkan...',
                show_alert: false,
            });
        }

        const targetChatId = parts[2];
        const targetMsgId = parts[3];
        const key = `${targetChatId}_${targetMsgId}`;
        const runId = jobTracker[key];

        if (!runId) {
            return bot.answerCallbackQuery(query.id, {
                text: '⚠️ Job tidak ditemukan / sudah selesai.',
                show_alert: false,
            });
        }

        await bot.answerCallbackQuery(query.id, {
            text: '🚫 Mencoba membatalkan...',
            show_alert: false,
        });

        const cancelled = await cancelWorkflow(runId);
        if (cancelled) {
            await bot.editMessageText(
                `🚫 *Proses Dibatalkan*\n\n` +
                    `📄 Pesan ID: ${targetMsgId}\n` +
                    `GitHub Actions run: ${runId}`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                }
            );
            delete jobTracker[key];
        } else {
            await bot.answerCallbackQuery(query.id, {
                text: '⚠️ Gagal membatalkan job.',
                show_alert: true,
            });
        }
    },
};
