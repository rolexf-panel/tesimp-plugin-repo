const axios = require('axios');

module.exports = {
  name: 'sticker-search',
  version: '2.0.0',
  description: 'Search and get stickers/GIF (Tenor)',
  author: 'Upgraded Plugin',
  commands: ['sticker', 'stiker', 's'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/sticker <query>`\n' +
        '`/stiker <search>`\n\n' +
        '*Example:*\n' +
        '`/sticker happy`\n' +
        '`/stiker sad cat`\n' +
        '`/s love`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const query = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Searching for stickers...');
      
      const apiKey = process.env.TENOR_API_KEY;
      if (!apiKey) {
        return bot.editMessageText(
          '⚠️ TENOR_API_KEY belum diset di environment.\n' +
          'Set dulu lalu restart bot.',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id
          }
        );
      }

      const response = await axios.get('https://tenor.googleapis.com/v2/search', {
        params: {
          key: apiKey,
          q: query,
          limit: 10,
          media_filter: 'minimal',
          contentfilter: 'high'
        }
      });

      const results = response.data?.results || [];
      
      if (results.length > 0) {
        
        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        const limit = Math.min(results.length, 5);
        
        for (let i = 0; i < limit; i++) {
          const item = results[i];
          const stickerUrl =
            item.media_formats?.gif?.url ||
            item.media_formats?.mediumgif?.url ||
            item.media_formats?.tinygif?.url;
          
          try {
            await bot.sendSticker(chatId, stickerUrl);
          } catch (err) {
            // If not a sticker, try as photo
            try {
              await bot.sendPhoto(chatId, stickerUrl);
            } catch (photoErr) {
              console.error(`Failed to send sticker ${i}:`, photoErr.message);
            }
          }
        }
        
        if (stickers.length > limit) {
          await bot.sendMessage(chatId,
            `📦 Showing ${limit} of ${stickers.length} stickers found.\n` +
            `Search for: *${query}*`,
            { parse_mode: 'Markdown' }
          );
        }
        
      } else {
        await bot.editMessageText(
          `❌ No stickers found for: *${query}*\n\n` +
          'Try different keywords!',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
      
    } catch (error) {
      console.error('Sticker search error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to search stickers!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
