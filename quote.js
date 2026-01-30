const axios = require('axios');

module.exports = {
  name: 'quotes',
  version: '2.0.0',
  description: 'Get random inspirational quotes',
  author: 'Upgraded Plugin',
  commands: ['quote', 'quotes', 'motivasi', 'inspire'],
  
  async execute(bot, msg) {
    const chatId = msg.chat.id;
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '💭 Getting quote...');
      
      const apiUrl = 'https://api.quotable.io/random';
      const response = await axios.get(apiUrl);
      
      const quote = response.data || {};
      const text = quote.content || quote.quote || quote.text || 'No quote.';
      const author = quote.author || 'Unknown';
      
      let message = `💭 *Inspirational Quote*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `"${text}"\n\n`;
      message += `— *${author}*`;
      
      const keyboard = [
        [{ text: '🔄 Get Another Quote', callback_data: 'quote_random' }]
      ];
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Quote error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get quote!\n\n' +
        'Please try again later.'
      );
    }
  },
  
  async handleCallback(bot, query) {
    if (query.data !== 'quote_random') return;
    
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '💭 Getting new quote...' });
      
      const apiUrl = 'https://api.quotable.io/random';
      const response = await axios.get(apiUrl);
      
      const quote = response.data || {};
      const text = quote.content || quote.quote || quote.text || 'No quote.';
      const author = quote.author || 'Unknown';
      
      let message = `💭 *Inspirational Quote*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `"${text}"\n\n`;
      message += `— *${author}*`;
      
      const keyboard = [
        [{ text: '🔄 Get Another Quote', callback_data: 'quote_random' }]
      ];
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error('Quote callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to get quote',
        show_alert: true
      });
    }
  }
};