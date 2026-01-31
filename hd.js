const axios = require('axios');

module.exports = {
  name: 'hd',
  version: '1.0.0',
  description: 'Upscale images to HD quality',
  author: 'Plugin Developer',
  commands: ['hd', 'remini', 'enhance', 'upscale'],
  
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
        'Send an image with caption `/hd`\n' +
        'Or reply to an image with `/hd`\n\n' +
        '*Example:*\n' +
        'Send photo → add caption `/hd`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '✨ Enhancing image to HD...');
      
      // Get file
      const fileLink = await bot.getFileLink(photo.file_id);
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/tools/remini?url=${encodeURIComponent(fileLink)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `✨ *HD Enhanced*\n━━━━━━━━━━━━━━━━━━━━`;
      
      await bot.sendDocument(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      }, {
        filename: 'hd_image.png',
        contentType: 'image/png'
      });
      
    } catch (error) {
      console.error('HD enhance error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to enhance image!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
