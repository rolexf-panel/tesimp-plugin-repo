const fs = require('fs');
const path = require('path');

setTimeout(() => {
  const pendingFile = path.join(process.cwd(), '.restart_pending.json');
  
  if (fs.existsSync(pendingFile)) {
    try {
      const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
      
      // Optional: hanya edit jika restart baru-baru ini (max 10 menit)
      if (Date.now() - pending.timestamp < 600000) {
        bot.editMessageText('♻️ *Bot restarted successfully!*\n\nThe bot is now back online and ready. 🚀', {
          chat_id: pending.chat_id,
          message_id: pending.message_id,
          parse_mode: 'Markdown'
        }).catch(err => {
          console.error('Failed to edit restart message (might be deleted):', err.message);
          // Fallback: kirim pesan baru jika edit gagal
          bot.sendMessage(pending.chat_id, '♻️ Bot is now back online! 🚀');
        });
      }
      
      fs.unlinkSync(pendingFile);
    } catch (err) {
      console.error('Error handling restart pending file:', err);
      if (fs.existsSync(pendingFile)) fs.unlinkSync(pendingFile);
    }
  }
}, 3000); // Delay 3 detik agar bot benar-benar ready
