const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// --- KONFIGURASI ---
const GH_OWNER = process.env.GH_OWNER || 'rolexf-panel';
const GH_REPO = process.env.GH_REPO || 'TeSimp-Telegram-Bot';
const GH_TOKEN = process.env.GH_PAT; // PAT dari GitHub

// PENTING: Masukkan ID Numerik Akun Userbot kamu di file .env
// Contoh: USERBOT_ID=123456789
const USERBOT_ID = parseInt(process.env.USERBOT_ID);

const dbPath = path.join(__dirname, '../database/pixeldrain.json');

// --- DATABASE HELPER ---
const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);
    return fs.readJsonSync(dbPath);
};

const writeDB = (data) => fs.writeJsonSync(dbPath, data, { spaces: 2 });

// --- TRACKER JOB (Untuk Cancel) ---
// Format: { "CHATID_MESSAGEID": "GITHUB_RUN_ID" }
const jobTracker = {};

// --- GITHUB ACTIONS HELPERS ---

async function triggerWorkflow(forwardedMsgId, fileName, chatId, messageId) {
    try {
        await axios.post(
            `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
            {
                event_type: 'start-upload',
                client_payload: {
                    forwarded_msg_id: forwardedMsgId, // ID pesan di chat Userbot
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
        console.error('[Pixeldrain] Gagal trigger workflow:', error.response?.data || error.message);
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
        console.error('[Pixeldrain] Gagal ambil run ID:', e.response?.data || e.message);
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
        console.error('[Pixeldrain] Gagal cancel:', error.response?.data || error.message);
        return false;
    }
}

// --- MAIN PLUGIN ---

module.exports = {
    name: 'pixeldrain',
    version: '3.0.0',
    description: 'Upload file via Userbot & GitHub Actions',
    author: 'TeSimp',
    commands: ['pixeldrain', 'pd', 'pdlist'],

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const userId = String(msg.from.id);

        // 1. Fitur /pdlist (Riwayat)
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

        // 2. Deteksi File
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

        const fileName = fileObj.file_name || `upload_${Date.now()}.bin`;

        // Cek apakah USERBOT_ID sudah diset
        if (!USERBOT_ID) {
            return bot.sendMessage(chatId, '❌ *Konfigurasi Error!* \n\n`USERBOT_ID` belum diset di environment (.env). Bot tidak bisa melakukan forward ke Userbot.');
        }

        // 3. Kirim Pesan Loading Awal
        const sentMsg = await bot.sendMessage(
            chatId,
            `⏳ *Menyiapkan Worker...*\n\n` +
                `📄 Nama: \`${fileName}\`\n` +
                `🔄 Memforward ke Userbot...`,
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

        // 4. Forward File ke Userbot
        // Langkah ini WAJIB agar Userbot (GitHub Actions) bisa melihat filenya
        try {
            // Forward pesan asli ke Userbot
            const forwardRes = await bot.forwardMessage(USERBOT_ID, chatId, targetMsg.message_id);
            
            // ID pesan yang baru saja masuk ke Userbot (Saved Messages / Private Chat)
            const forwardedMsgId = forwardRes.message_id;

            console.log(`[Pixeldrain] File diforward. Msg ID di Userbot: ${forwardedMsgId}`);

            // Update pesan loading
            await bot.editMessageText(
                `⏳ *Menghubungi GitHub Actions...*\n\n` +
                    `📄 Nama: \`${fileName}\`\n` +
                    `🔄 Status: Queueing...`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                }
            );

            // 5. Trigger GitHub Actions
            const ok = await triggerWorkflow(forwardedMsgId, fileName, chatId, messageId);

            if (!ok) {
                return bot.editMessageText(
                    chatId,
                    messageId,
                    '❌ Gagal memicu GitHub Actions. Cek log server / konfigurasi GH_PAT.'
                );
            }

            // Update tombol Cancel dengan data yang benar
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

            // 6. Ambil Run ID untuk fitur Cancel
            // Delay dikit karena GitHub butuh waktu memproses dispatch event
            setTimeout(async () => {
                const runId = await getLatestRunId();
                if (runId) {
                    jobTracker[`${chatId}_${messageId}`] = runId;
                    console.log(`[Pixeldrain] Tracking Job: ${chatId}_${messageId} -> Run ${runId}`);
                }
            }, 4000);

        } catch (err) {
            console.error('[Pixeldrain] Error forwarding:', err);
            await bot.editMessageText(
                chatId,
                messageId,
                `❌ *Gagal Forward ke Userbot*\n\nPastikan bot dan userbot saling mengikuti (start) atau Userbot tidak memblokir bot.\n\nError: \`${err.message}\``,
                { parse_mode: 'Markdown' }
            );
        }
    },

    async handleCallback(bot, query, botInstance) {
        const data = query.data || '';
        const msg = query.message;
        const chatId = msg.chat.id;
        const messageId = msg.message_id;

        if (!data.startsWith('pd_cancel_')) return;

        // Format: pd_cancel_CHATID_MESSAGEID
        const parts = data.split('_');
        
        // Handle case 'wait' (user klik terlalu cepat sebelum ID diset)
        if (parts[2] === 'wait') {
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
                text: '⚠️ Job tidak ditemukan / mungkin sudah selesai.',
                show_alert: false,
            });
        }

        // Jawab callback
        await bot.answerCallbackQuery(query.id, {
            text: '🚫 Mencoba membatalkan...',
            show_alert: false,
        });

        // Coba cancel di GitHub
        const cancelled = await cancelWorkflow(runId);

        if (cancelled) {
            await bot.editMessageText(
                `🚫 *Proses Dibatalkan*\n\n` +
                    `📄 Pesan ID: ${targetMsgId}\n` +
                    `GitHub Actions Run: ${runId}\n` +
                    `Userbot berhenti mendownload/uploading.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                }
            );
            // Hapus dari memori
            delete jobTracker[key];
        } else {
            await bot.answerCallbackQuery(query.id, {
                text: '⚠️ Gagal membatalkan job (mungkin sudah selesai).',
                show_alert: true,
            });
        }
    },
};
