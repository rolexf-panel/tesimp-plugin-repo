const axios = require('axios');

const MOOD_URL = 'https://raw.githubusercontent.com/rolexf-panel/tesimp-plugin-repo/main/data/moods.json';

module.exports = {
  name: 'mood-check',
  version: '1.1.0',
  description: 'Check user mood using dynamic response list',
  commands: ['mood'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (!args.length) {
      return bot.sendMessage(
        chatId,
        '🙂 Please tell me your mood.\nExample:\n/mood happy\n/mood sad'
      );
    }

    try {
      const mood = args.join(' ').toLowerCase();
      const { data } = await axios.get(MOOD_URL, { timeout: 5000 });

      const list = data[mood];
      if (!Array.isArray(list) || !list.length) {
        return bot.sendMessage(chatId, '🤔 I don’t have responses for that mood yet.');
      }

      const reply = list[Math.floor(Math.random() * list.length)];
      bot.sendMessage(chatId, reply);
    } catch (err) {
      console.error('Mood fetch error:', err.message);
      bot.sendMessage(chatId, '❌ Failed to load mood responses.');
    }
  }
};
