const axios = require('axios');

module.exports = {
  name: 'facts',
  version: '2.0.0',
  description: 'Get random interesting facts',
  author: 'Upgraded Plugin',
  commands: ['fact', 'facts', 'funfact'],
  
  async execute(bot, msg) {
    const chatId = msg.chat.id;
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🧠 Getting fact...');
      
      const apiUrl = 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en';
      const response = await axios.get(apiUrl);
      
      const factData = response.data;
      const factText = factData.text || factData.fact || factData || 'No fact available.';

      let message = `🧠 *Fun Fact*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += factText;
      
      const keyboard = [
        [{ text: '🔄 Get Another Fact', callback_data: 'fact_random' }]
      ];
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Fact error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get fact!\n\n' +
        'Please try again later.'
      );
    }
  },
  
  async handleCallback(bot, query) {
    if (query.data !== 'fact_random') return;
    
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🧠 Getting new fact...' });
      
      const apiUrl = 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en';
      const response = await axios.get(apiUrl);
      
      const factData = response.data;
      const factText = factData.text || factData.fact || factData || 'No fact available.';

      let message = `🧠 *Fun Fact*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += factText;
      
      const keyboard = [
        [{ text: '🔄 Get Another Fact', callback_data: 'fact_random' }]
      ];
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error('Fact callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to get fact',
        show_alert: true
      });
    }
  }
};