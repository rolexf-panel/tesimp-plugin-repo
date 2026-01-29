const axios = require('axios');

module.exports = {
  name: 'anime-search',
  version: '2.0.0',
  description: 'Search anime information (Jikan API)',
  author: 'Upgraded Plugin',
  commands: ['anime', 'animesearch'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/anime <title>`\n\n' +
        '*Example:*\n' +
        '`/anime Naruto`\n' +
        '`/anime One Piece`\n' +
        '`/anime Attack on Titan`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const query = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Searching anime...');
      
      const apiUrl = `https://api.jikan.moe/v4/anime`;
      const response = await axios.get(apiUrl, {
        params: { q: query, limit: 1 }
      });
      
      const list = response.data?.data || [];
      if (list.length === 0) {
        return bot.editMessageText(
          `❌ Anime not found: *${query}*\n\n` +
          'Try:\n' +
          '• Check spelling\n' +
          '• Use English title\n' +
          '• Try different keywords',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }

      const anime = list[0];
      
      let message = `📺 *${anime.title || query}*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (anime.title_english) message += `🔤 *English:* ${anime.title_english}\n`;
      if (anime.title_japanese) message += `🇯🇵 *Japanese:* ${anime.title_japanese}\n`;
      if (anime.type) message += `📌 *Type:* ${anime.type}\n`;
      if (anime.episodes) message += `📺 *Episodes:* ${anime.episodes}\n`;
      if (anime.status) message += `📊 *Status:* ${anime.status}\n`;
      if (anime.score) message += `⭐ *Score:* ${anime.score}/10\n`;
      if (anime.rating) message += `🔞 *Rating:* ${anime.rating}\n`;
      if (anime.genres && anime.genres.length > 0) {
        message += `🎭 *Genres:* ${anime.genres.map(g => g.name).join(', ')}\n`;
      }
      if (anime.aired && anime.aired.string) message += `📅 *Aired:* ${anime.aired.string}\n`;
      if (anime.studios && anime.studios.length > 0) {
        message += `🎬 *Studios:* ${anime.studios.map(s => s.name).join(', ')}\n`;
      }
      
      if (anime.synopsis) {
        const synopsis = anime.synopsis.length > 300 
          ? anime.synopsis.substring(0, 300) + '...' 
          : anime.synopsis;
        message += `\n📖 *Synopsis:*\n${synopsis}`;
      }
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const imageUrl = anime.images?.jpg?.image_url || anime.images?.webp?.image_url;
      if (imageUrl) {
        await bot.sendPhoto(chatId, imageUrl, {
          caption: message,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
    } catch (error) {
      console.error('Anime search error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to search anime!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};