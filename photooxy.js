const axios = require('axios');

module.exports = {
  name: 'photooxy',
  version: '1.0.0',
  description: 'Generate photo effects and logos',
  author: 'Plugin Developer',
  commands: ['photooxy', 'photoeffect'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/photooxy <effect> <text>`\n\n' +
        '*Available Effects:*\n' +
        '• shadow\n' +
        '• cup\n' +
        '• coffee\n' +
        '• birthday\n' +
        '• love\n\n' +
        '*Example:*\n' +
        '`/photooxy shadow BetaBotz`\n' +
        '`/photooxy coffee Good Morning`',
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
    
    const validEffects = ['shadow', 'cup', 'coffee', 'birthday', 'love'];
    if (!validEffects.includes(effect)) {
      return bot.sendMessage(chatId, 
        `❌ Invalid effect! Choose from: ${validEffects.join(', ')}`
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, `🎨 Generating ${effect} effect...`);
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/photooxy/${effect}?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *PhotoOxy - ${effect.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('PhotoOxy error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to generate photo effect!\n\n' +
        `Error: ${error.message}\n\n` +
        'Make sure BETABOTZ_API is set in .env file'
      );
    }
  }
};
