const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  name: 'updater',
  version: '1.2.0',
  description: 'Reload dan update semua plugin secara otomatis',
  commands: ['update', 'reload'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Optional: batasi hanya owner
    // if (userId !== Number(process.env.OWNER_ID)) return;

    const waitMsg = await bot.sendMessage(chatId, '🔄 *Memproses pembaruan plugin...*', { parse_mode: 'Markdown' });

    try {
      const pluginsPath = __dirname; // folder plugins (satu folder dengan file ini)
      const updaterFilename = path.basename(__filename);
      // Ambil semua .js kecuali updater ini sendiri
      const pluginFiles = fs.readdirSync(pluginsPath)
        .filter(file => file.endsWith('.js') && file !== updaterFilename);

      // Reset daftar perintah di instance bot
      botInstance.commands = new Map();

      const now = Date.now();

      // Helper: format waktu relatif (detik/menit/jam/hari)
      function formatRelativeTime(tsMs) {
        const diff = Math.max(0, now - tsMs);
        const sec = Math.floor(diff / 1000);
        if (sec < 5) return 'baru saja';
        if (sec < 60) return `${sec} detik yang lalu`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min} menit yang lalu`;
        const hour = Math.floor(min / 60);
        if (hour < 24) return `${hour} jam yang lalu`;
        const day = Math.floor(hour / 24);
        if (day < 7) return `${day} hari yang lalu`;
        // lebih tua: tampilkan tanggal dd-mm-yyyy
        const d = new Date(tsMs);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      }

      let updateLines = [];

      for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);

        let timeDisplay = '';
        try {
          // Preferensi: gunakan waktu commit git terakhir jika repo git ada
          let tsMs;
          try {
            // Perintah ini mengembalikan epoch seconds dari terakhir commit yang menyentuh file
            const gitOut = execSync(`git log -1 --format=%ct -- "${filePath}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
              .toString().trim();
            if (gitOut && /^\d+$/.test(gitOut)) {
              tsMs = Number(gitOut) * 1000;
            }
          } catch (gitErr) {
            // git tidak tersedia atau file belum di-track, fallback ke mtime
            tsMs = undefined;
          }

          if (!tsMs) {
            const stats = fs.statSync(filePath);
            tsMs = stats.mtime.getTime();
          }

          timeDisplay = formatRelativeTime(tsMs);
        } catch (timeErr) {
          // Jika ada yang aneh, gunakan -unknown-
          timeDisplay = 'waktu tidak diketahui';
          console.error('Error mendapatkan waktu untuk', file, timeErr);
        }

        // Hapus cache require agar module di-require ulang
        try {
          const resolved = require.resolve(filePath);
          if (require.cache[resolved]) delete require.cache[resolved];
        } catch (e) {
          // jika require.resolve gagal, lanjut saja
        }

        // Coba load plugin
        try {
          const newPlugin = require(filePath);

          if (newPlugin && Array.isArray(newPlugin.commands)) {
            newPlugin.commands.forEach(cmd => {
              // Pastikan key string
              const key = typeof cmd === 'string' ? cmd : JSON.stringify(cmd);
              botInstance.commands.set(key, newPlugin);
            });
            const pluginName = newPlugin.name || path.basename(file, '.js');
            updateLines.push(`• *${pluginName}* (${timeDisplay})`);
          } else {
            // Plugin tidak memiliki struktur commands yg diharapkan
            const pluginName = (newPlugin && newPlugin.name) ? newPlugin.name : path.basename(file, '.js');
            updateLines.push(`• *${pluginName}* (${timeDisplay}) — _tidak ada perintah terdaftar_`);
          }
        } catch (err) {
          console.error('Gagal memuat plugin', file, err);
          updateLines.push(`• ❌ *${path.basename(file, '.js')}* (${timeDisplay}) — gagal dimuat`);
          // jangan throw; lanjut ke plugin berikutnya
        }
      }

      const updateDetails = updateLines.length ? updateLines.join('\n') : '_Tidak ada plugin ditemukan_';

      const finalText = `✅ *Update Berhasil!*\n\nTotal *${pluginFiles.length}* plugin telah diperbarui.\n\n*Status Update:*\n${updateDetails}`;

      await bot.editMessageText(finalText, {
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

