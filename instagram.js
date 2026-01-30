const axios = require('axios');

module.exports = {
  name: 'instagram-downloader',
  version: '2.0.0',
  description: 'Download Instagram photos, videos, reels, and stories (configurable API)',
  author: 'Upgraded Plugin',
  commands: ['instagram', 'ig', 'igdl', 'reels'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/instagram <url>`\n\n' +
        '*Example:*\n' +
        '`/ig https://www.instagram.com/p/xxx`\n' +
        '`/reels https://www.instagram.com/reel/xxx`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const url = args[0];
    
    // Validate Instagram URL
    if (!url.includes('instagram.com')) {
      return bot.sendMessage(chatId, '❌ Invalid Instagram URL!');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '⏳ Downloading Instagram media...');
      
      const base = process.env.IG_DL_API_BASE;
      if (!base) {
        return bot.editMessageText(
          '⚠️ IG_DL_API_BASE is not set in environment.\n' +
          'Set it to your Instagram downloader API endpoint.\n' +
          'Expected response example: { status: true, result: { media: [ { url,type }, ... ] } }',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id
          }
        );
      }

      const apiUrl = `${base.replace(/\/$/, '')}?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const resultWrapper = response.data || {};
      const result = resultWrapper.result || resultWrapper;
      
      if (result) {
        
        let caption = `📸 *Instagram Media*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (result.username) caption += `👤 *User:* @${result.username}\n`;
        if (result.caption) caption += `📝 *Caption:* ${result.caption.substring(0, 200)}${result.caption.length > 200 ? '...' : ''}\n`;
        if (result.likes) caption += `❤️ *Likes:* ${result.likes}\n`;
        if (result.comments) caption += `💬 *Comments:* ${result.comments}\n`;
        
        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        // Check if multiple media (carousel)
        if (result.media && Array.isArray(result.media) && result.media.length > 1) {
          caption += `\n📦 *Total:* ${result.media.length} items`;
          
          for (let i = 0; i < result.media.length && i < 10; i++) {
            const media = result.media[i];
            try {
              if (media.type === 'video' || media.url.includes('.mp4')) {
                await bot.sendVideo(chatId, media.url, {
                  caption: `${caption}\n\n📍 Item ${i + 1}/${result.media.length}`,
                  parse_mode: 'Markdown'
                });
              } else {
                await bot.sendPhoto(chatId, media.url, {
                  caption: `${caption}\n\n📍 Item ${i + 1}/${result.media.length}`,
                  parse_mode: 'Markdown'
                });
              }
            } catch (err) {
              console.error(`Failed to send media ${i}:`, err.message);
            }
          }
        } else {
          // Single media
          const mediaUrl = result.url || result.video || result.image || (result.media && result.media[0]?.url);
          
          if (!mediaUrl) {
            throw new Error('Media URL not found');
          }
          
          if (mediaUrl.includes('.mp4') || result.type === 'video') {
            await bot.sendVideo(chatId, mediaUrl, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          } else {
            await bot.sendPhoto(chatId, mediaUrl, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          }
        }
        
      } else {
        throw new Error(response.data.message || 'Failed to download media');
      }
      
    } catch (error) {
      console.error('Instagram download error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to download Instagram media!\n\n' +
        `Error: ${error.message}\n\n` +
        'Please make sure:\n' +
        '• URL is valid\n' +
        '• Post/Reel is public\n' +
        '• Account is not private'
      );
    }
  }
};
