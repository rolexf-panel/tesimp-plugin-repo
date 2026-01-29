const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, '../database/pixeldrain.json');

// Helper Database
const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);
    return fs.readJsonSync(dbPath);
};

const writeDB = (data) => fs.writeJsonSync(dbPath, data, { spaces: 2 });

module.exports = {
    name: 'pixeldrain',
    version: '1.0.0',
    description: 'Upload file ke Pixeldrain via reply/send',
    commands: ['pixeldrain', 'pd', 'pdlist'],

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const command = args[0]?.toLowerCase();

        // Fitur 1: Lihat riwayat upload (/pdlist)
        if (msg.text.includes('pdlist')) {
            const db = readDB();
            const userFiles = db.filter(f => f.userId === userId);
            
            if (userFiles.length === 0) return bot.sendMessage(chatId, '📭 Kamu belum pernah mengupload file.');

            let list = `📁 *Riwayat Upload Pixeldrain*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            userFiles.slice(-10).forEach((f, i) => {
                list += `${i + 1}. [${f.fileName}](https://pixeldrain.com/u/${f.fileId})\n`;
            });
            return bot.sendMessage(chatId, list, { parse_mode: 'Markdown', disable_web_page_preview: true });
        }

        // Fitur 2: Upload via Reply atau kirim file dengan caption /pd
        const targetMsg = msg.reply_to_message || msg;
        const fileObj = targetMsg.document || targetMsg.photo?.slice(-1)[0] || targetMsg.video || targetMsg.audio;

        if (!fileObj) {
            return bot.sendMessage(chatId, '❌ *Gagal!* Kirim file dengan caption `/pd` atau balas (reply) file dengan `/pd`.', { parse_mode: 'Markdown' });
        }

        const waitMsg = await bot.sendMessage(chatId, '⏳ *Sedang mengupload ke Pixeldrain...*', { parse_mode: 'Markdown' });

        try {
            // Dapatkan link file dari Telegram
            const fileId = fileObj.file_id;
            const fileInfo = await bot.getFile(fileId);
            const fileName = fileObj.file_name || `upload_${Date.now()}.${fileInfo.file_path.split('.').pop()}`;
            const fileUrl = `https://api.telegram.org/file/bot${botInstance.config.token}/${fileInfo.file_path}`;

            // Download file secara stream
            const response = await axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream'
            });

            // Persiapkan form data untuk Pixeldrain
            const form = new FormData();
            form.append('file', response.data, fileName);

            const uploadReq = await axios.post('https://pixeldrain.com/api/file', form, {
                headers: { ...form.getHeaders() }
            });

            if (uploadReq.data.success) {
                const pdId = uploadReq.data.id;
                const pdLink = `https://pixeldrain.com/u/${pdId}`;

                // Simpan ke histori
                const db = readDB();
                db.push({
                    userId,
                    username: msg.from.username || msg.from.first_name,
                    fileId: pdId,
                    fileName,
                    date: new Date().toLocaleString('id-ID')
                });
                writeDB(db);

                await bot.deleteMessage(chatId, waitMsg.message_id);
                return bot.sendMessage(chatId, `✅ *Berhasil diupload!*\n\n📄 *Nama:* \`${fileName}\`\n🔗 *Link:* ${pdLink}`, { 
                    parse_mode: 'Markdown' 
                });
            }

        } catch (error) {
            console.error('Pixeldrain Error:', error.message);
            await bot.editMessageText('❌ *Gagal mengupload file.* Pastikan ukuran file tidak terlalu besar.', { 
                chat_id: chatId, 
                message_id: waitMsg.message_id, 
                parse_mode: 'Markdown' 
            });
        }
    }
};
