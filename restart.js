const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'restart',
  version: '1.1.0',
  description: 'Restart the bot process using PM2 and notify when back online (owner only)',
  commands: ['restart', 'reboot'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ownerId = process.env.OWNER_ID;

    if (!ownerId) {
      return bot.sendMessage(chatId, '❌ OWNER_ID is not configured in environment variables.', { parse_mode: 'Markdown' });
    }

    if (String(userId) !== String(String(ownerId))) {
      return bot.sendMessage(chatId, '❌ This command is restricted to the bot owner only.', { parse_mode: 'Markdown' });
    }

    // Kirim pesan "restarting" dan simpan detailnya
    const restartMsg = await bot.sendMessage(
      chatId,
      '♻️ *Restarting the bot...*\n\nPlease wait, the bot will be back online shortly.',
      { parse_mode: 'Markdown' }
    );

    const pendingFile = path.join(process.cwd(), '.restart_pending.json');
    const pending = {
      chat_id: chatId,
      message_id: restartMsg.message_id,
      timestamp: Date.now()
    };

    try {
      fs.writeFileSync(pendingFile, JSON.stringify(pending));
    } catch (err) {
      console.error('Failed to save restart pending file:', err);
    }

    // Trigger PM2 restart
    exec('pm2 restart tesimp-bot', (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('PM2 restart failed:', error || stderr);
        process.exit(1); // Fallback
      }
    });
  }
};
