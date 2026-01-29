const axios = require('axios');

module.exports = {
  name: 'lyrics',
  version: '2.0.0',
  description: 'Search song lyrics',
  author: 'Upgraded Plugin',
  commands: ['lyrics', 'lirik', 'lyric'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/lyrics <song name>`\n' +
        '`/lirik <judul lagu>`\n\n' +
        '*Example:*\n' +
        '`/lyrics Shape of You`\n' +
        '`/lirik Bohemian Rhapsody`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const query = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎵 Searching lyrics...');
      
      const apiUrl = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      
      if (!response.data || !response.data.lyrics) {
        return bot.editMessageText(
          `❌ Lyrics not found for: *${query}*`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }

      const result = response.data;
      
      let message = `🎵 *Song Lyrics*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (result.title) message += `🎵 *Title:* ${result.title}\n`;
      if (result.author) message += `👤 *Artist:* ${result.author}\n`;
      
      message += `\n📝 *Lyrics:*\n\n`;
      
      let lyrics = result.lyrics || '';
      const maxLength = 3500;
      
      if (lyrics.length > maxLength) {
        message += lyrics.substring(0, maxLength) + '\n\n_(continued...)_';
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        });
        
        let remaining = lyrics.substring(maxLength);
        while (remaining.length > 0) {
          const chunk = remaining.substring(0, 4000);
          remaining = remaining.substring(4000);
          
          await bot.sendMessage(chatId, chunk);
        }
      } else {
        message += lyrics;
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        });
      }
      
    } catch (error) {
      console.error('Lyrics search error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to search lyrics!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};