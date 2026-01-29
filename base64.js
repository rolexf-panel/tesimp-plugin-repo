module.exports = {
  name: 'base64',
  version: '1.0.0',
  description: 'Encode and decode Base64 strings',
  author: 'Bot Developer',
  commands: ['base64', 'b64encode', 'b64decode'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/base64 encode <text>` - Encode to Base64\n' +
        '`/base64 decode <base64>` - Decode from Base64\n' +
        '`/b64encode <text>` - Quick encode\n' +
        '`/b64decode <base64>` - Quick decode\n\n' +
        '*Examples:*\n' +
        '`/base64 encode Hello World`\n' +
        '`/base64 decode SGVsbG8gV29ybGQ=`\n' +
        '`/b64encode Secret Message`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      let mode, text;
      
      // Determine mode and text
      if (command === 'b64encode') {
        mode = 'encode';
        text = args.join(' ');
      } else if (command === 'b64decode') {
        mode = 'decode';
        text = args.join(' ');
      } else {
        mode = args[0].toLowerCase();
        text = args.slice(1).join(' ');
        
        if (!['encode', 'decode'].includes(mode)) {
          return bot.sendMessage(chatId, '❌ Mode must be either "encode" or "decode"!');
        }
      }
      
      if (!text) {
        return bot.sendMessage(chatId, '❌ Please provide text to process!');
      }
      
      let result, message;
      
      if (mode === 'encode') {
        // Encode to Base64
        result = Buffer.from(text, 'utf-8').toString('base64');
        
        message = `🔐 *Base64 Encoder*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📝 *Original:*\n\`${text}\`\n\n`;
        message += `🔒 *Encoded:*\n\`${result}\`\n\n`;
        message += `📊 *Stats:*\n`;
        message += `• Original length: ${text.length} chars\n`;
        message += `• Encoded length: ${result.length} chars`;
        
      } else {
        // Decode from Base64
        try {
          result = Buffer.from(text, 'base64').toString('utf-8');
          
          message = `🔓 *Base64 Decoder*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
          message += `🔒 *Encoded:*\n\`${text}\`\n\n`;
          message += `📝 *Decoded:*\n\`${result}\`\n\n`;
          message += `📊 *Stats:*\n`;
          message += `• Encoded length: ${text.length} chars\n`;
          message += `• Decoded length: ${result.length} chars`;
          
        } catch (decodeError) {
          return bot.sendMessage(chatId, '❌ Invalid Base64 string! Please check your input.');
        }
      }
      
      // If result is too long, send as file
      if (result.length > 3000) {
        const filename = mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
        
        await bot.sendDocument(chatId, Buffer.from(result), {}, {
          filename: filename,
          caption: `✅ Result is too long. Sent as file.\n\nMode: ${mode}`
        });
      } else {
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });
      }
      
    } catch (error) {
      console.error('Base64 error:', error);
      await bot.sendMessage(chatId,
        '❌ An error occurred!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
