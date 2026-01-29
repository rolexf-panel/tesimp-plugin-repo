const axios = require('axios');

module.exports = {
  name: 'pinterest',
  version: '2.0.0',
  description: 'Cari gambar aesthetic (via Unsplash)',
  commands: ['pin', 'pinterest'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (!args[0]) return bot.sendMessage(chatId, '🔍 Mau cari gambar apa?');
    
    try {
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return bot.sendMessage(
          chatId,
          '⚠️ UNSPLASH_ACCESS_KEY belum diset di environment.\n' +
          'Set dulu lalu restart bot.'
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
        return bot.sendMessage(chatId, '❌ Gambar tidak ditemukan.');
      }

      const random = images[Math.floor(Math.random() * images.length)];
      const url = random.urls?.regular || random.urls?.full || random.urls?.small;

      await bot.sendPhoto(chatId, url, {
        caption: `🔎 Hasil pencarian: *${query}*`,
        parse_mode: 'Markdown'
      });
    } catch (e) {
      console.error('Pinterest search error:', e.response?.data || e.message);
      bot.sendMessage(chatId, '❌ Terjadi error saat mengambil gambar.');
    }
  }
};
