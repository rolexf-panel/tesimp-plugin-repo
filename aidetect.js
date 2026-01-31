const axios = require('axios');

module.exports = {
  name: 'ai-detect',
  version: '1.0.0',
  description: 'Detect if text is AI-generated',
  author: 'Plugin Developer',
  commands: ['aidetect', 'detectai', 'isai'],
  
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
        '`/aidetect <text>`\n' +
        'Or reply to a message with `/aidetect`\n\n' +
        '*Example:*\n' +
        '`/aidetect This is a sample text to check`',
        { parse_mode: 'Markdown' }
      );
    }
    
    if (text.length > 2000) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 2000 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Analyzing text...');
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/tools/aidetector?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl);
      
      const data = response.data;
      
      let message = `🔍 *AI Detection Result*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (data.isAI !== undefined) {
        message += `🤖 *Is AI Generated:* ${data.isAI ? 'Yes ✅' : 'No ❌'}\n`;
      }
      
      if (data.confidence !== undefined) {
        message += `📊 *Confidence:* ${(data.confidence * 100).toFixed(2)}%\n`;
      }
      
      if (data.probability !== undefined) {
        message += `📈 *Probability:* ${(data.probability * 100).toFixed(2)}%\n`;
      }
      
      message += `\n📝 *Text Preview:*\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`;
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('AI detect error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to detect AI content!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
