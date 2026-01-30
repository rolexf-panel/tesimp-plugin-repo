const axios = require('axios');

const QUESTION_URL = 'https://raw.githubusercontent.com/rolexf-panel/tesimp-plugin-repo/main/data/questions.json';

module.exports = {
  name: 'random-question',
  version: '1.1.0',
  description: 'Ask random questions from dynamic list',
  commands: ['question', 'askme'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    try {
      const { data } = await axios.get(QUESTION_URL, { timeout: 5000 });

      let pool = [];

      if (args.length && data[args[0]]) {
        pool = data[args[0]];
      } else {
        for (const key in data) {
          pool = pool.concat(data[key]);
        }
      }

      if (!pool.length) {
        return bot.sendMessage(chatId, '❌ No questions available.');
      }

      const question = pool[Math.floor(Math.random() * pool.length)];
      bot.sendMessage(chatId, `❓ ${question}`);
    } catch (err) {
      console.error('Question fetch error:', err.message);
      bot.sendMessage(chatId, '❌ Failed to load questions.');
    }
  }
};
