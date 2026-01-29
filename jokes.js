const axios = require('axios');

module.exports = {
  name: 'jokes',
  version: '1.0.0',
  description: 'Get random jokes to brighten your day',
  author: 'Bot Developer',
  commands: ['joke', 'jokes', 'lucu'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '😄 Getting a joke...');
      
      // Using Official Joke API - free and no API key required
      const apiUrl = 'https://official-joke-api.appspot.com/random_joke';
      const response = await axios.get(apiUrl);
      
      if (response.data) {
        const joke = response.data;
        
        let message = `😂 *Random Joke*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `${joke.setup}\n\n`;
        message += `💡 ||${joke.punchline}||\n\n`;
        message += `🏷️ Category: _${joke.type}_`;
        
        const keyboard = [
          [
            { text: '🔄 Get Another Joke', callback_data: 'joke_random' }
          ]
        ];
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
        
      } else {
        throw new Error('Failed to get joke');
      }
      
    } catch (error) {
      console.error('Joke error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get joke!\n\n' +
        'Please try again later.'
      );
    }
  },
  
  async handleCallback(bot, query, botInstance) {
    if (query.data !== 'joke_random') return;
    
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '😄 Getting new joke...' });
      
      const apiUrl = 'https://official-joke-api.appspot.com/random_joke';
      const response = await axios.get(apiUrl);
      
      if (response.data) {
        const joke = response.data;
        
        let message = `😂 *Random Joke*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `${joke.setup}\n\n`;
        message += `💡 ||${joke.punchline}||\n\n`;
        message += `🏷️ Category: _${joke.type}_`;
        
        const keyboard = [
          [
            { text: '🔄 Get Another Joke', callback_data: 'joke_random' }
          ]
        ];
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
      
    } catch (error) {
      console.error('Joke callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to get joke',
        show_alert: true
      });
    }
  }
};
