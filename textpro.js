const axios = require('axios');

module.exports = {
  name: 'textpro',
  version: '1.0.0',
  description: 'Generate text with various effects',
  author: 'Plugin Developer',
  commands: ['textpro', 'texteffect'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/textpro <effect> <text>`\n\n' +
        '*Available Effects:*\n' +
        '• neon\n' +
        '• thunder\n' +
        '• 3d\n' +
        '• chrome\n' +
        '• glitch\n\n' +
        '*Example:*\n' +
        '`/textpro neon BetaBotz`\n' +
        '`/textpro thunder Hello World`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const effect = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    
    if (!text) {
      return bot.sendMessage(chatId, '❌ Please provide text after the effect!');
    }
    
    if (text.length > 50) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 50 characters.');
    }
    
    const validEffects = ['neon', 'thunder', '3d', 'chrome', 'glitch'];
    if (!validEffects.includes(effect)) {
      return bot.sendMessage(chatId, 
        `❌ Invalid effect! Choose from: ${validEffects.join(', ')}`
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, `🎨 Generating ${effect} text effect...`);
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/textpro/${effect}?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *TextPro - ${effect.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('TextPro error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to generate text effect!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
