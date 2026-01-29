const crypto = require('crypto');

module.exports = {
  name: 'password-generator',
  version: '1.0.0',
  description: 'Generate strong random passwords',
  author: 'Bot Developer',
  commands: ['password', 'genpass', 'pwd'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    // Default settings
    let length = 16;
    let includeNumbers = true;
    let includeSymbols = true;
    let includeUppercase = true;
    let includeLowercase = true;
    
    // Parse arguments
    if (args.length > 0) {
      const lengthArg = parseInt(args[0]);
      if (!isNaN(lengthArg) && lengthArg >= 4 && lengthArg <= 128) {
        length = lengthArg;
      } else if (isNaN(lengthArg) && args[0] !== 'help') {
        return bot.sendMessage(chatId, '❌ Length must be a number between 4 and 128!');
      }
    }
    
    // Parse flags
    const flags = args.join(' ').toLowerCase();
    if (flags.includes('--no-numbers')) includeNumbers = false;
    if (flags.includes('--no-symbols')) includeSymbols = false;
    if (flags.includes('--no-upper')) includeUppercase = false;
    if (flags.includes('--no-lower')) includeLowercase = false;
    
    // Help message
    if (args[0] === 'help') {
      return bot.sendMessage(chatId,
        '🔐 *Password Generator*\n\n' +
        '*Usage:*\n' +
        '`/password [length] [flags]`\n\n' +
        '*Examples:*\n' +
        '`/password` - Default 16 chars\n' +
        '`/password 20` - 20 chars password\n' +
        '`/password 12 --no-symbols` - No symbols\n' +
        '`/password 16 --no-numbers` - No numbers\n\n' +
        '*Flags:*\n' +
        '• `--no-numbers` - Exclude numbers\n' +
        '• `--no-symbols` - Exclude symbols\n' +
        '• `--no-upper` - Exclude uppercase\n' +
        '• `--no-lower` - Exclude lowercase\n\n' +
        '*Default:* 16 characters with all types',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      // Character sets
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      let charset = '';
      if (includeLowercase) charset += lowercase;
      if (includeUppercase) charset += uppercase;
      if (includeNumbers) charset += numbers;
      if (includeSymbols) charset += symbols;
      
      if (charset.length === 0) {
        return bot.sendMessage(chatId, '❌ You must include at least one character type!');
      }
      
      // Generate password using crypto for better randomness
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
      }
      
      // Calculate entropy
      const entropy = (Math.log2(charset.length) * length).toFixed(2);
      
      // Password strength
      let strength = 'Weak';
      let strengthEmoji = '🔴';
      if (entropy > 50 && entropy <= 75) {
        strength = 'Medium';
        strengthEmoji = '🟡';
      } else if (entropy > 75 && entropy <= 100) {
        strength = 'Strong';
        strengthEmoji = '🟢';
      } else if (entropy > 100) {
        strength = 'Very Strong';
        strengthEmoji = '🟢🟢';
      }
      
      let message = `🔐 *Password Generated*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🔑 *Password:*\n\`${password}\`\n\n`;
      message += `📊 *Statistics:*\n`;
      message += `• Length: ${length} characters\n`;
      message += `• Charset size: ${charset.length}\n`;
      message += `• Entropy: ${entropy} bits\n`;
      message += `• Strength: ${strengthEmoji} ${strength}\n\n`;
      message += `✅ *Includes:*\n`;
      if (includeLowercase) message += `• Lowercase letters\n`;
      if (includeUppercase) message += `• Uppercase letters\n`;
      if (includeNumbers) message += `• Numbers\n`;
      if (includeSymbols) message += `• Symbols\n`;
      message += `\n⚠️ _Copy and save this password securely!_`;
      
      const keyboard = [
        [
          { text: '🔄 Generate New', callback_data: `genpass_new:${length}` }
        ]
      ];
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Password generator error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate password!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('genpass_new:')) return;
    
    const chatId = query.message.chat.id;
    const length = parseInt(query.data.split(':')[1]) || 16;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🔐 Generating new password...' });
      
      // Generate new password
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const charset = lowercase + uppercase + numbers + symbols;
      
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
      }
      
      const entropy = (Math.log2(charset.length) * length).toFixed(2);
      
      let strength = 'Weak';
      let strengthEmoji = '🔴';
      if (entropy > 50 && entropy <= 75) {
        strength = 'Medium';
        strengthEmoji = '🟡';
      } else if (entropy > 75 && entropy <= 100) {
        strength = 'Strong';
        strengthEmoji = '🟢';
      } else if (entropy > 100) {
        strength = 'Very Strong';
        strengthEmoji = '🟢🟢';
      }
      
      let message = `🔐 *Password Generated*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🔑 *Password:*\n\`${password}\`\n\n`;
      message += `📊 *Statistics:*\n`;
      message += `• Length: ${length} characters\n`;
      message += `• Charset size: ${charset.length}\n`;
      message += `• Entropy: ${entropy} bits\n`;
      message += `• Strength: ${strengthEmoji} ${strength}\n\n`;
      message += `⚠️ _Copy and save this password securely!_`;
      
      const keyboard = [
        [
          { text: '🔄 Generate New', callback_data: `genpass_new:${length}` }
        ]
      ];
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Password callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to generate password',
        show_alert: true
      });
    }
  }
};
