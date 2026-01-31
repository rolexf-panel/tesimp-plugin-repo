const axios = require('axios');

module.exports = {
  name: 'bratvid',
  version: '1.0.0',
  description: 'Generate brat-style animated video with green background',
  author: 'Plugin Developer',
  commands: ['bratvid', 'bratv'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/bratvid <text>`\n\n' +
        '*Example:*\n' +
        '`/bratvid club classics`\n' +
        '`/bratv brat summer`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎬 Generating brat video...');
      
      // Using brat video generator API
      const videoUrl = `https://brat.caleb.cam/api/video?text=${encodeURIComponent(text)}`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎬 *BRAT Video Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendVideo(chatId, videoUrl, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Brat video generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate brat video!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
