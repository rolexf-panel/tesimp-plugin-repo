const { createCanvas } = require('canvas');

module.exports = {
  name: 'brat',
  version: '1.0.0',
  description: 'Generate brat-style text images with green background',
  author: 'Plugin Developer',
  commands: ['brat'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/brat <text>`\n\n' +
        '*Example:*\n' +
        '`/brat summer`\n' +
        '`/brat charli xcx`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎨 Generating brat image...');
      
      // Create canvas
      const width = 800;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Brat green background (#8ACE00 or similar)
      ctx.fillStyle = '#8ACE00';
      ctx.fillRect(0, 0, width, height);
      
      // Set text style (Arial Black or similar bold font)
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate font size based on text length
      let fontSize = 120;
      if (text.length > 10) fontSize = 100;
      if (text.length > 20) fontSize = 80;
      if (text.length > 30) fontSize = 60;
      
      ctx.font = `bold ${fontSize}px Arial`;
      
      // Draw text in center (lowercase for brat style)
      ctx.fillText(text.toLowerCase(), width / 2, height / 2);
      
      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *BRAT Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Brat generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate brat image!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
