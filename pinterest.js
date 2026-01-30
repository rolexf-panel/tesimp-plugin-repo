const axios = require('axios');

module.exports = {
  name: 'pinterest',
  version: '2.0.0',
  description: 'Search for aesthetic images (via Unsplash)',
  commands: ['pin', 'pinterest'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (!args[0]) return bot.sendMessage(chatId, '🔍 What image do you want to search for?');
    
    try {
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return bot.sendMessage(
          chatId,
          '⚠️ UNSPLASH_ACCESS_KEY is not set in environment.\n' +
          'Please set it and restart the bot.'
        );
      }

      const query = args.join(' ');

      const res = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: 30,
          orientation: 'portrait'
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });

      const images = res.data?.results || [];
      if (!images.length) {
        return bot.sendMessage(chatId, '❌ Image not found.');
      }

      const random = images[Math.floor(Math.random() * images.length)];
      const url = random.urls?.regular || random.urls?.full || random.urls?.small;

      await bot.sendPhoto(chatId, url, {
        caption: `🔎 Search results for: *${query}*`,
        parse_mode: 'Markdown'
      });
    } catch (e) {
      console.error('Pinterest search error:', e.response?.data || e.message);
      bot.sendMessage(chatId, '❌ An error occurred while fetching the image.');
    }
  }
};
