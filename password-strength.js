const zxcvbn = require('zxcvbn');

module.exports = {
  name: 'password-strength',
  version: '1.0.0',
  description: 'Analyze password strength',
  commands: ['passcheck', 'passwordstrength'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const password = args.join(' ');

    if (!password) {
      return bot.sendMessage(chatId, '❌ Provide a password to analyze.');
    }

    const result = zxcvbn(password);

    const text = `
🔐 *PASSWORD ANALYSIS*

• Score: \`${result.score}/4\`
• Crack Time: \`${result.crack_times_display.offline_fast_hashing_1e10_per_second}\`
• Warnings: \`${result.feedback.warning || 'None'}\`
    `.trim();

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
};
