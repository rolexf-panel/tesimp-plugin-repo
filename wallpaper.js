const axios = require('axios');

module.exports = {
  name: 'wallpaper',
  version: '2.0.0',
  description: 'Search and get HD wallpapers (Unsplash)',
  author: 'Upgraded Plugin',
  commands: ['wallpaper', 'wp', 'wall'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/wallpaper <query>`\n' +
        '`/wp <search>`\n\n' +
        '*Example:*\n' +
        '`/wallpaper nature`\n' +
        '`/wp anime`\n' +
        '`/wall space`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const query = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🖼️ Searching wallpapers...');
      
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return bot.editMessageText(
          '⚠️ UNSPLASH_ACCESS_KEY is not set in environment.\n' +
          'Please set it and restart the bot.',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id
          }
        );
      }

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: 10,
          orientation: 'portrait'
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });

      const wallpapers = response.data?.results || [];
      
      if (wallpapers.length > 0) {
        
        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        const limit = Math.min(wallpapers.length, 3);
        
        for (let i = 0; i < limit; i++) {
          const wallpaper = wallpapers[i];
          const imageUrl = wallpaper.urls?.regular || wallpaper.urls?.full || wallpaper.urls?.small;
          
          const caption = `🖼️ *Wallpaper ${i + 1}/${wallpapers.length}*\n` +
                         `━━━━━━━━━━━━━━━━━━━━\n\n` +
                         `🔍 Query: ${query}`;
          
          try {
            await bot.sendPhoto(chatId, imageUrl, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          } catch (err) {
            console.error(`Failed to send wallpaper ${i}:`, err.message);
          }
        }
        
        if (wallpapers.length > limit) {
          const keyboard = [
            [
              { text: '🔄 Get More', callback_data: `wp_more:${Buffer.from(query).toString('base64')}` }
            ]
          ];
          
          await bot.sendMessage(chatId,
            `📦 Showing ${limit} of ${wallpapers.length} wallpapers.\n` +
            `Want to see more?`,
            { reply_markup: { inline_keyboard: keyboard } }
          );
        }
        
      } else {
        await bot.editMessageText(
          `❌ No wallpapers found for: *${query}*\n\n` +
          'Try different keywords!',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
      
    } catch (error) {
      console.error('Wallpaper search error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to search wallpapers!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('wp_more:')) return;
    
    const chatId = query.message.chat.id;
    const searchQuery = Buffer.from(query.data.split(':')[1], 'base64').toString();
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🖼️ Loading more...' });
      
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return bot.answerCallbackQuery(query.id, {
          text: 'UNSPLASH_ACCESS_KEY is not set.',
          show_alert: true
        });
      }

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: searchQuery,
          per_page: 10,
          page: 1,
          orientation: 'portrait'
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      
      const wallpapers = response.data?.results || [];
      
      if (wallpapers.length > 3) {
        
        for (let i = 3; i < Math.min(wallpapers.length, 6); i++) {
          const wallpaper = wallpapers[i];
          const imageUrl = wallpaper.urls?.regular || wallpaper.urls?.full || wallpaper.urls?.small;
          
          const caption = `🖼️ *Wallpaper ${i + 1}/${wallpapers.length}*\n` +
                         `━━━━━━━━━━━━━━━━━━━━\n\n` +
                         `🔍 Query: ${searchQuery}`;
          
          try {
            await bot.sendPhoto(chatId, imageUrl, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          } catch (err) {
            console.error(`Failed to send wallpaper ${i}:`, err.message);
          }
        }
      }
      
    } catch (error) {
      console.error('Wallpaper callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to load more',
        show_alert: true
      });
    }
  }
};
