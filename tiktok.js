const axios = require('axios');

module.exports = {
  name: 'tiktok-downloader',
  version: '2.0.0',
  description: 'Download TikTok videos without watermark (TiklyDown)',
  author: 'Upgraded Plugin',
  commands: ['tiktok', 'tt', 'ttdl'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/tiktok <url>`\n\n' +
        '*Example:*\n' +
        '`/tiktok https://vt.tiktok.com/xxx`\n' +
        '`/tt https://www.tiktok.com/@user/video/xxx`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const url = args[0];
    
    if (!url.includes('tiktok.com') && !url.includes('vt.tiktok')) {
      return bot.sendMessage(chatId, '❌ Invalid TikTok URL!');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '⏳ Downloading TikTok video...');
      
      const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
      const res = await axios.get(apiUrl);
      const data = res.data;
      
      const videoUrl = data.video?.noWatermark || data.url;
      if (!videoUrl) throw new Error('Video URL not found in API response');
      
      let caption = `🎬 *TikTok Video*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (data.title) caption += `📝 *Title:* ${data.title}\n`;
      if (data.author?.name) caption += `👤 *Author:* ${data.author.name}\n`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      await bot.sendVideo(chatId, videoUrl, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('TikTok download error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to download TikTok video!\n\n' +
        `Error: ${error.message}\n\n` +
        'Please make sure:\n' +
        '• URL is valid and public\n' +
        '• Video is not private\n' +
        '• Try again later'
      );
    }
  }
};