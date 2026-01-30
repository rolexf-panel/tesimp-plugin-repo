const axios = require('axios');

const EMOJI_URL = 'https://raw.githubusercontent.com/rolexf-panel/tesimp-plugin-repo/main/data/emojis.json';

module.exports = {
  name: 'random-emoji',
  version: '1.1.0',
  description: 'Send random emoji from remote list',
  commands: ['emoji'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;

    try {
      const { data } = await axios.get(EMOJI_URL, { timeout: 5000 });

      const list = data.default;
      if (!Array.isArray(list) || !list.length) {
        return bot.sendMessage(chatId, '❌ Emoji list is empty.');
      }

      const emoji = list[Math.floor(Math.random() * list.length)];
      bot.sendMessage(chatId, emoji);
    } catch (err) {
      console.error('Emoji fetch error:', err.message);
      bot.sendMessage(chatId, '❌ Failed to load emojis.');
    }
  }
};
