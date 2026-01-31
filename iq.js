const axios = require('axios');

module.exports = {
  name: 'iq',
  version: '2.0.0',
  description: 'Generate iPhone-style quote images',
  author: 'Plugin Developer',
  commands: ['iq', 'iphonequote', 'quote-img'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Support for reply to message
    let text = args.join(' ');
    let authorName = msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : '');
    
    if (msg.reply_to_message && msg.reply_to_message.text) {
      text = msg.reply_to_message.text;
      authorName = msg.reply_to_message.from.first_name + 
                   (msg.reply_to_message.from.last_name ? ' ' + msg.reply_to_message.from.last_name : '');
    }
    
    if (!text) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/iq <text>`\n' +
        'Or reply to a message with `/iq`\n\n' +
        '*Example:*\n' +
        '`/iq Stay humble, work hard`\n' +
        '`/iq The only way out is through`',
        { parse_mode: 'Markdown' }
      );
    }
    
    if (text.length > 500) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 500 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📱 Generating iPhone quote...');
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/maker/iphonequote?text=${encodeURIComponent(text)}&name=${encodeURIComponent(authorName)}&apikey=${apiKey}`;
      
      // Download image
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `📱 *iPhone Quote*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `👤 ${authorName}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('iPhone quote generation error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to generate quote image!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
