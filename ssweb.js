const axios = require('axios');

module.exports = {
  name: 'ssweb',
  version: '1.0.0',
  description: 'Take screenshot of any website',
  author: 'Plugin Developer',
  commands: ['ssweb', 'screenshot', 'ss'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/ssweb <url>`\n\n' +
        '*Example:*\n' +
        '`/ssweb https://google.com`\n' +
        '`/ss https://github.com`',
        { parse_mode: 'Markdown' }
      );
    }
    
    let url = args[0];
    
    // Add https if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📸 Taking screenshot...');
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/tools/ssweb?url=${encodeURIComponent(url)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `📸 *Website Screenshot*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `🔗 URL: ${url}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Screenshot error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to take screenshot!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure:\n' +
        '• URL is valid and accessible\n' +
        '• BETABOTZ_API is set in .env file'
      );
    }
  }
};
