const axios = require('axios');

module.exports = {
  name: 'qrcode',
  version: '2.0.0',
  description: 'Generate QR codes from text or URL (Google Chart)',
  author: 'Upgraded Plugin',
  commands: ['qr', 'qrcode', 'qrgen'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/qr <text or url>`\n' +
        '`/qrcode <data>`\n\n' +
        '*Example:*\n' +
        '`/qr https://google.com`\n' +
        '`/qrcode Hello World!`\n' +
        '`/qr tel:+628123456789`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 500) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 500 characters.');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📱 Generating QR Code...');
      
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(text)}&choe=UTF-8`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `📱 *QR Code Generated*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 *Data:* ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
      
      await bot.sendPhoto(chatId, qrUrl, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('QR code generation error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate QR code!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};