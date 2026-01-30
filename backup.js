const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'backup',
  version: '1.0.0',
  description: 'Mencadangkan seluruh script bot ke file ZIP',
  commands: ['backup'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const backupFileName = `backup_${Date.now()}.zip`;
    const backupPath = path.join(__dirname, `../${backupFileName}`);
    
    const waitMsg = await bot.sendMessage(chatId, '📦 *Sedang memproses archive...*\n_Menyusun file dan mengompresi..._', { parse_mode: 'Markdown' });

    try {
      // 1. Proses Pembuatan ZIP
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = fs.statSync(backupPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        await bot.editMessageText(`📤 *Archive Selesai (${fileSizeMB} MB)*\nSedang mengupload ke Telegram & Cloud...`, {
          chat_id: chatId,
          message_id: waitMsg.message_id,
          parse_mode: 'Markdown'
        });

        // 2. Kirim Langsung ke Telegram
        try {
          await bot.sendDocument(chatId, backupPath, {
            caption: `✅ *Bot Backup Success*\n📅 Date: \`${new Date().toLocaleString('id-ID')}\`\n⚖️ Size: \`${fileSizeMB} MB\``,
            parse_mode: 'Markdown'
          });
        } catch (err) {
          console.error('Tele Upload Error:', err.message);
        }

        // 3. Upload ke Pixeldrain (Sebagai Mirror Gratis Tanpa Key)
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(backupPath));

          const pdUpload = await axios.post('https://pixeldrain.com/api/file', form, {
            headers: { ...form.getHeaders() }
          });

          if (pdUpload.data.success) {
            await bot.sendMessage(chatId, `🔗 *Mirror Link (Pixeldrain):*\nhttps://pixeldrain.com/u/${pdUpload.data.id}`, { 
              parse_mode: 'Markdown',
              disable_web_page_preview: true 
            });
          }
        } catch (err) {
          console.error('Pixeldrain Backup Error:', err.message);
        }

        // 4. Hapus file ZIP dari VPS setelah selesai agar tidak penuh
        fs.unlinkSync(backupPath);
      });

      archive.on('error', (err) => { throw err; });
      archive.pipe(output);

      // Mengambil seluruh folder bot kecuali folder sampah/besar
      archive.glob('**/*', {
        cwd: path.join(__dirname, '../'),
        ignore: [
          'node_modules/**', 
          '.git/**', 
          '.npm/**',
          '*.zip', // Hindari zip di dalam zip
          '*.log',
          '.aider.*'
        ]
      });

      await archive.finalize();

    } catch (error) {
      console.error('Backup Plugin Error:', error);
      await bot.sendMessage(chatId, `❌ *Gagal melakukan backup:*\n\`${error.message}\``, { parse_mode: 'Markdown' });
      if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    }
  }
};
