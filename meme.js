const axios = require('axios');

module.exports = {
  name: 'meme',
  version: '2.0.0',
  description: 'Get random memes',
  author: 'Upgraded Plugin',
  commands: ['meme', 'memes', 'funny'],
  
  async execute(bot, msg) {
    const chatId = msg.chat.id;
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '😂 Getting meme...');
      
      const apiUrl = 'https://meme-api.com/gimme';
      const response = await axios.get(apiUrl);
      
      const meme = response.data || {};
      const imageUrl = meme.url;
      
      if (!imageUrl) throw new Error('No image URL in meme API response');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      let caption = `😂 *Random Meme*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (meme.title) caption += `📝 *${meme.title}*\n`;
      if (meme.subreddit) caption += `📎 r/${meme.subreddit}`;
      
      const keyboard = [
        [{ text: '🔄 Get Another Meme', callback_data: 'meme_random' }]
      ];
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Meme error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get meme!\n\n' +
        'Please try again later.'
      );
    }
  },
  
  async handleCallback(bot, query) {
    if (query.data !== 'meme_random') return;
    
    const chatId = query.message.chat.id;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '😂 Getting new meme...' });
      
      const apiUrl = 'https://meme-api.com/gimme';
      const response = await axios.get(apiUrl);
      
      const meme = response.data || {};
      const imageUrl = meme.url;
      if (!imageUrl) throw new Error('No image URL in meme API response');
      
      let caption = `😂 *Random Meme*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (meme.title) caption += `📝 *${meme.title}*\n`;
      if (meme.subreddit) caption += `📎 r/${meme.subreddit}`;
      
      const keyboard = [
        [{ text: '🔄 Get Another Meme', callback_data: 'meme_random' }]
      ];
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error('Meme callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to get meme',
        show_alert: true
      });
    }
  }
};