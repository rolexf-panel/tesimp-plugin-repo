const axios = require('axios');

module.exports = {
  name: 'shorturl',
  version: '2.0.0',
  description: 'Shorten long URLs (TinyURL)',
  author: 'Upgraded Plugin',
  commands: ['short', 'shorturl', 'tinyurl'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/short <url>`\n' +
        '`/shorturl <long_url>`\n\n' +
        '*Example:*\n' +
        '`/short https://www.example.com/very/long/url/path`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const url = args[0];
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return bot.sendMessage(chatId, '❌ Invalid URL! URL must start with http:// or https://');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔗 Shortening URL...');
      
      const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const shortUrl = response.data?.trim();
      
      if (!shortUrl) throw new Error('No short URL returned from TinyURL');
      
      let message = `🔗 *URL Shortened*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📎 *Original:*\n${url.substring(0, 100)}${url.length > 100 ? '...' : ''}\n\n`;
      message += `✂️ *Short URL:*\n${shortUrl}`;
      
      const keyboard = [
        [{ text: '📋 Open Short URL', url: shortUrl }]
      ];
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('URL shortener error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to shorten URL!\n\n' +
        `Error: ${error.message}\n\n` +
        'Please make sure the URL is valid and accessible.'
      );
    }
  }
};