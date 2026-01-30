const crypto = require('crypto');
const axios = require('axios');

module.exports = {
  name: 'password-check',
  version: '1.0.0',
  description: 'Check if a password has been leaked',
  commands: ['pwned', 'passwordcheck'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    if (!args.length) {
      return bot.sendMessage(chatId, '❌ Provide a password to check.');
    }

    const password = args.join(' ');
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    try {
      const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
      const found = res.data.includes(suffix);

      bot.sendMessage(
        chatId,
        found
          ? '🚨 This password has been leaked before!'
          : '✅ This password was NOT found in known breaches.'
      );
    } catch {
      bot.sendMessage(chatId, '❌ Error checking password.');
    }
  }
};
