const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'bratvid',
  version: '1.0.0',
  description: 'Generate brat-style animated GIF with green background',
  author: 'Plugin Developer',
  commands: ['bratvid', 'bratv'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/bratvid <text>`\n\n' +
        '*Example:*\n' +
        '`/bratvid club classics`\n' +
        '`/bratv brat summer`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎬 Generating brat animation...');
      
      const width = 800;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Create GIF encoder
      const encoder = new GIFEncoder(width, height);
      const tempFile = path.join('/tmp', `brat_${Date.now()}.gif`);
      const stream = fs.createWriteStream(tempFile);
      
      encoder.createReadStream().pipe(stream);
      encoder.start();
      encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
      encoder.setDelay(100);  // frame delay in ms
      encoder.setQuality(10); // image quality (1-20, 1=best)
      
      // Calculate font size based on text length
      let fontSize = 120;
      if (text.length > 10) fontSize = 100;
      if (text.length > 20) fontSize = 80;
      if (text.length > 30) fontSize = 60;
      
      // Generate frames with pulsing effect
      const frames = 20;
      for (let i = 0; i < frames; i++) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Pulsing green background
        const pulse = Math.sin((i / frames) * Math.PI * 2) * 0.1 + 1;
        const greenValue = Math.floor(206 * pulse); // 206 is CE in hex
        ctx.fillStyle = `#8A${greenValue.toString(16).padStart(2, '0')}00`;
        ctx.fillRect(0, 0, width, height);
        
        // Text style
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Slight scale effect
        const scale = 0.95 + (Math.sin((i / frames) * Math.PI * 2) * 0.05);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.fillText(text.toLowerCase(), 0, 0);
        ctx.restore();
        
        encoder.addFrame(ctx);
      }
      
      encoder.finish();
      
      // Wait for stream to finish
      await new Promise((resolve) => stream.on('finish', resolve));
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎬 *BRAT Animation*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 Text: ${text}`;
      
      await bot.sendAnimation(chatId, tempFile, {
        caption,
        parse_mode: 'Markdown'
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
    } catch (error) {
      console.error('Brat video generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate brat animation!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
