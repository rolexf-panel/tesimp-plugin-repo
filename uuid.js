const crypto = require('crypto');

module.exports = {
  name: 'uuid',
  version: '1.0.0',
  description: 'Generate UUID/GUID (Universally Unique Identifier)',
  author: 'Bot Developer',
  commands: ['uuid', 'guid', 'generateid'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    // Parse arguments
    let count = 1;
    let version = 4;
    
    if (args.length > 0) {
      const firstArg = parseInt(args[0]);
      if (!isNaN(firstArg) && firstArg >= 1 && firstArg <= 10) {
        count = firstArg;
      }
    }
    
    try {
      const uuids = [];
      
      for (let i = 0; i < count; i++) {
        uuids.push(this.generateUUIDv4());
      }
      
      let message = `🔑 *UUID Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📋 *Version:* UUID v${version}\n`;
      message += `🔢 *Count:* ${count}\n\n`;
      
      if (count === 1) {
        message += `🆔 *UUID:*\n\`${uuids[0]}\`\n\n`;
        message += `📊 *Format:*\n`;
        message += `• Length: 36 characters\n`;
        message += `• Pattern: 8-4-4-4-12\n`;
        message += `• Variant: RFC 4122`;
      } else {
        message += `🆔 *UUIDs:*\n`;
        uuids.forEach((uuid, index) => {
          message += `${index + 1}. \`${uuid}\`\n`;
        });
      }
      
      const keyboard = [
        [
          { text: '🔄 Generate New', callback_data: `uuid_generate:${count}` }
        ]
      ];
      
      if (count === 1) {
        keyboard.push([
          { text: '📋 Generate 5', callback_data: 'uuid_generate:5' },
          { text: '📋 Generate 10', callback_data: 'uuid_generate:10' }
        ]);
      }
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('UUID generator error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate UUID!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  generateUUIDv4() {
    // Generate random bytes
    const bytes = crypto.randomBytes(16);
    
    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    // Convert to hex string with dashes
    const hex = bytes.toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('uuid_generate:')) return;
    
    const chatId = query.message.chat.id;
    const count = parseInt(query.data.split(':')[1]) || 1;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🔑 Generating UUIDs...' });
      
      const uuids = [];
      
      for (let i = 0; i < count; i++) {
        uuids.push(this.generateUUIDv4());
      }
      
      let message = `🔑 *UUID Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📋 *Version:* UUID v4\n`;
      message += `🔢 *Count:* ${count}\n\n`;
      
      if (count === 1) {
        message += `🆔 *UUID:*\n\`${uuids[0]}\`\n\n`;
        message += `📊 *Format:*\n`;
        message += `• Length: 36 characters\n`;
        message += `• Pattern: 8-4-4-4-12\n`;
        message += `• Variant: RFC 4122`;
      } else {
        message += `🆔 *UUIDs:*\n`;
        uuids.forEach((uuid, index) => {
          message += `${index + 1}. \`${uuid}\`\n`;
        });
      }
      
      const keyboard = [
        [
          { text: '🔄 Generate New', callback_data: `uuid_generate:${count}` }
        ]
      ];
      
      if (count === 1) {
        keyboard.push([
          { text: '📋 Generate 5', callback_data: 'uuid_generate:5' },
          { text: '📋 Generate 10', callback_data: 'uuid_generate:10' }
        ]);
      }
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('UUID callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to generate UUID',
        show_alert: true
      });
    }
  }
};
