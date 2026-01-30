const os = require('os');

module.exports = {
  name: 'device-info',
  version: '1.0.0',
  description: 'Show detailed server device information',
  commands: ['device', 'hardware'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;

    const text = `
🖥 *Device Information*

• Hostname: \`${os.hostname()}\`
• OS: \`${os.type()} ${os.release()}\`
• CPU: \`${os.cpus()[0].model}\`
• Cores: \`${os.cpus().length}\`
• Architecture: \`${os.arch()}\`
• Uptime: \`${Math.floor(os.uptime() / 60)} minutes\`
    `.trim();

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
};
