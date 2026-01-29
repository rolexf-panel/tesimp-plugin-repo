const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'updater',
  version: '1.2.0',
  description: 'Reload dan update semua plugin secara otomatis',
  commands: ['update', 'reload'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Pastikan hanya owner yang bisa menggunakan perintah ini (opsional)
    // if (userId !== Number(process.env.OWNER_ID)) return;

    const waitMsg = await bot.sendMessage(chatId, '🔄 *Memproses pembaruan plugin...*', { parse_mode: 'Markdown' });

    try {
      const pluginsPath = path.join(__dirname); // Lokasi folder plugins
      const pluginFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js') && file !== 'updater.js');

      // Reset daftar perintah di instance bot
      botInstance.commands = new Map();
      
      let updateDetails = '';
      const now = Date.now();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

      // Loop untuk reload setiap file
      for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);
        
        // Mengambil data statistik file
        const stats = fs.statSync(filePath);
        const mTimeMs = stats.mtime.getTime();
        
        // Logika penentuan teks waktu
        let timeDisplay;
        if (now - mTimeMs < threeDaysInMs) {
          timeDisplay = 'Last Hour';
        } else {
          timeDisplay = stats.mtime.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
        }

        // HAPUS CACHE: Ini bagian terpenting agar script baru terbaca
        delete require.cache[require.resolve(filePath)];

        try {
          const newPlugin = require(filePath);
          
          if (newPlugin.commands && Array.isArray(newPlugin.commands)) {
            newPlugin.commands.forEach(cmd => {
              botInstance.commands.set(cmd, newPlugin);
            });
            // Tambahkan ke teks detail update
            updateDetails += `• *${newPlugin.name}* (\`${timeDisplay}\`)\n`;
          }
        } catch (err) {
          console.error(`Gagal memuat plugin ${file}:`, err);
        }
      }

      await bot.editMessageText(`✅ *Update Berhasil!*\n\nTotal *${pluginFiles.length}* plugin telah diperbarui.\n\n*Status Update:*\n${updateDetails}`, {
        chat_id: chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Updater Error:', error);
      await bot.editMessageText('❌ *Gagal melakukan update.* Cek log konsol untuk detailnya.', {
        chat_id: chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown'
      });
    }
  }
};
