const axios = require('axios');

module.exports = {
  name: 'toanime',
  version: '1.0.0',
  description: 'Convert images to anime style',
  author: 'Plugin Developer',
  commands: ['toanime', 'anime-ify', 'animefy'],
  
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
        'Send an image with caption `/toanime`\n' +
        'Or reply to an image with `/toanime`\n\n' +
        '*Example:*\n' +
        'Send photo → add caption `/toanime`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎨 Converting to anime style...');
      
      // Get file
      const fileLink = await bot.getFileLink(photo.file_id);
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/maker/jadianime?url=${encodeURIComponent(fileLink)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *Anime Style*\n━━━━━━━━━━━━━━━━━━━━`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('To anime error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to convert to anime!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
