const axios = require('axios');

module.exports = {
  name: 'brat',
  version: '1.0.0',
  description: 'Generate brat-style text images with green background',
  author: 'Plugin Developer',
  commands: ['brat'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/brat <text>`\n\n' +
        '*Example:*\n' +
        '`/brat summer`\n' +
        '`/brat charli xcx`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎨 Generating brat image...');
      
      // Using brat generator API
      const imageUrl = `https://brat.caleb.cam/api?text=${encodeURIComponent(text)}`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *BRAT Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Brat generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate brat image!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
