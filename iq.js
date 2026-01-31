const { createCanvas, loadImage } = require('canvas');

module.exports = {
  name: 'iq',
  version: '1.0.0',
  description: 'Generate iPhone-style quote images',
  author: 'Plugin Developer',
  commands: ['iq', 'iphonequote', 'quote-img'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Support for reply to message
    let text = args.join(' ');
    let authorName = msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : '');
    
    if (msg.reply_to_message && msg.reply_to_message.text) {
      text = msg.reply_to_message.text;
      authorName = msg.reply_to_message.from.first_name + 
                   (msg.reply_to_message.from.last_name ? ' ' + msg.reply_to_message.from.last_name : '');
    }
    
    if (!text) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/iq <text>`\n' +
        'Or reply to a message with `/iq`\n\n' +
        '*Example:*\n' +
        '`/iq Stay humble, work hard`\n' +
        '`/iq The only way out is through`',
        { parse_mode: 'Markdown' }
      );
    }
    
    if (text.length > 500) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 500 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📱 Generating iPhone quote...');
      
      // Canvas dimensions
      const width = 600;
      const padding = 40;
      const lineHeight = 35;
      
      // Create temporary canvas to measure text
      const tempCanvas = createCanvas(width, 100);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.font = '24px Arial';
      
      // Word wrap function
      const wrapText = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + ' ' + word;
          const metrics = tempCtx.measureText(testLine);
          
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        return lines;
      };
      
      const lines = wrapText(text, width - padding * 2);
      const textHeight = lines.length * lineHeight;
      const height = textHeight + padding * 3 + 100; // Extra space for header and footer
      
      // Create actual canvas
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Dark gradient background (iPhone message style)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Message bubble
      const bubbleY = 60;
      const bubbleHeight = height - 120;
      
      // Rounded rectangle for message bubble
      const radius = 20;
      ctx.fillStyle = '#0a84ff';
      ctx.beginPath();
      ctx.moveTo(padding + radius, bubbleY);
      ctx.lineTo(width - padding - radius, bubbleY);
      ctx.quadraticCurveTo(width - padding, bubbleY, width - padding, bubbleY + radius);
      ctx.lineTo(width - padding, bubbleY + bubbleHeight - radius);
      ctx.quadraticCurveTo(width - padding, bubbleY + bubbleHeight, width - padding - radius, bubbleY + bubbleHeight);
      ctx.lineTo(padding + radius, bubbleY + bubbleHeight);
      ctx.quadraticCurveTo(padding, bubbleY + bubbleHeight, padding, bubbleY + bubbleHeight - radius);
      ctx.lineTo(padding, bubbleY + radius);
      ctx.quadraticCurveTo(padding, bubbleY, padding + radius, bubbleY);
      ctx.closePath();
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      
      let textY = bubbleY + padding + 10;
      lines.forEach(line => {
        ctx.fillText(line, padding + 20, textY);
        textY += lineHeight;
      });
      
      // Author name at bottom
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(`— ${authorName}`, width - padding - 20, bubbleY + bubbleHeight - 20);
      
      // Time stamp (optional)
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      ctx.font = '14px Arial';
      ctx.fillStyle = '#8e8e93';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, width / 2, height - 20);
      
      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `📱 *iPhone Quote*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `👤 ${authorName}`;
      
      await bot.sendPhoto(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('iPhone quote generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate quote image!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
