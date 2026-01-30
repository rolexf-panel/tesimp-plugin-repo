const axios = require('axios');

module.exports = {
  name: 'define',
  version: '1.0.0',
  description: 'Get word definitions from dictionary',
  commands: ['define', 'definition'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    if (!args.length) {
      return bot.sendMessage(chatId, '❌ Please provide a word.');
    }

    const word = args[0];

    try {
      const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const meaning = res.data[0].meanings[0].definitions[0].definition;

      bot.sendMessage(
        chatId,
        `📘 *Definition*\n\n*${word}*\n${meaning}`,
        { parse_mode: 'Markdown' }
      );
    } catch {
      bot.sendMessage(chatId, '❌ Word not found.');
    }
  }
};
