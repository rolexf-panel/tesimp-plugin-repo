const axios = require('axios');

module.exports = {
  name: 'bratvid',
  version: '2.0.0',
  description: 'Generate brat-style animated video',
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
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/maker/bratvideo?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      // Download video
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎬 *BRAT Video*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendVideo(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Brat video generation error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to generate brat video!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
