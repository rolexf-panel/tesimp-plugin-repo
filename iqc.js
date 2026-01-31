const axios = require('axios');

module.exports = {
  name: 'iq',
  version: '1.0.0',
  description: 'Generate iPhone-style quote images',
  author: 'Plugin Developer',
  commands: ['iq', 'iphonequote', 'quote-img'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Support for reply to message
    let text = args.join(' ');
    
    if (msg.reply_to_message && msg.reply_to_message.text) {
      text = msg.reply_to_message.text;
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
    
    if (text.length > 300) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 300 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📱 Generating iPhone quote...');
      
      // Using quotly.netorare.codes API for iPhone-style quotes
      const response = await axios.post('https://quotly.netorare.codes/generate', {
        type: 'quote',
        format: 'png',
        backgroundColor: '#1b1429',
        width: 512,
        height: 768,
        scale: 2,
        messages: [
          {
            entities: [],
            avatar: true,
            from: {
              id: msg.from.id,
              name: msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : ''),
              photo: {
                small_file_id: ''
              }
            },
            text: text,
            replyMessage: {}
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.result || !response.data.result.image) {
        throw new Error('No image returned from API');
      }
      
      const imageBuffer = Buffer.from(response.data.result.image, 'base64');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `📱 *iPhone Quote*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `👤 ${msg.from.first_name}`;
      
      await bot.sendPhoto(chatId, imageBuffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('iPhone quote generation error:', error.response?.data || error.message);
      
      // Fallback to simple quote image API
      try {
        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        // Alternative: Use a simpler quote generator
        const simpleUrl = `https://dummyimage.com/800x600/1b1429/ffffff.png&text=${encodeURIComponent(text)}`;
        
        const caption = `📱 *Quote Image*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                       `📝 "${text}"`;
        
        await bot.sendPhoto(chatId, simpleUrl, {
          caption,
          parse_mode: 'Markdown'
        });
        
      } catch (fallbackError) {
        await bot.sendMessage(chatId,
          '❌ Failed to generate quote image!\n\n' +
          `Error: ${error.message}`
        );
      }
    }
  }
};
