const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'removebg',
  version: '1.0.0',
  description: 'Remove background from images',
  author: 'Plugin Developer',
  commands: ['removebg', 'rembg', 'nobg'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Get photo from message or reply
    let photo = null;
    
    if (msg.photo && msg.photo.length > 0) {
      photo = msg.photo[msg.photo.length - 1];
    } else if (msg.reply_to_message && msg.reply_to_message.photo && msg.reply_to_message.photo.length > 0) {
      photo = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1];
    }
    
    if (!photo) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        'Send an image with caption `/removebg`\n' +
        'Or reply to an image with `/removebg`\n\n' +
        '*Example:*\n' +
        'Send photo → add caption `/removebg`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🖼️ Removing background...');
      
      // Get file
      const fileLink = await bot.getFileLink(photo.file_id);
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/tools/removebg?url=${encodeURIComponent(fileLink)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🖼️ *Background Removed*\n━━━━━━━━━━━━━━━━━━━━`;
      
      await bot.sendDocument(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      }, {
        filename: 'nobg.png',
        contentType: 'image/png'
      });
      
    } catch (error) {
      console.error('Remove background error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to remove background!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
