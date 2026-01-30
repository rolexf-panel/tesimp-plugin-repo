const axios = require('axios');

module.exports = {
  name: 'server-uptime',
  version: '1.0.0',
  description: 'Check if a website is online',
  commands: ['uptimecheck', 'sitecheck'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const url = args[0];

    if (!url) {
      return bot.sendMessage(chatId, '❌ Usage: /sitecheck https://example.com');
    }

    try {
      const start = Date.now();
      const res = await axios.get(url, { timeout: 5000 });
      const latency = Date.now() - start;

      bot.sendMessage(
        chatId,
        `🟢 *SITE ONLINE*\n• Status: \`${res.status}\`\n• Response Time: \`${latency}ms\``,
        { parse_mode: 'Markdown' }
      );
    } catch {
      bot.sendMessage(chatId, '🔴 *SITE OFFLINE or TIMEOUT*', { parse_mode: 'Markdown' });
    }
  }
};
