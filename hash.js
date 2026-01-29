const crypto = require('crypto');

module.exports = {
  name: 'hash',
  version: '1.0.0',
  description: 'Generate hash from text (MD5, SHA256, SHA512, etc)',
  author: 'Bot Developer',
  commands: ['hash', 'md5', 'sha256'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/hash <algorithm> <text>` - Generate hash\n' +
        '`/md5 <text>` - Quick MD5 hash\n' +
        '`/sha256 <text>` - Quick SHA256 hash\n\n' +
        '*Supported Algorithms:*\n' +
        '• md5\n' +
        '• sha1\n' +
        '• sha256\n' +
        '• sha512\n' +
        '• sha3-256\n' +
        '• sha3-512\n\n' +
        '*Examples:*\n' +
        '`/hash md5 Hello World`\n' +
        '`/md5 password123`\n' +
        '`/sha256 my secret text`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      let algorithm, text;
      
      // Determine algorithm and text
      if (command === 'md5') {
        algorithm = 'md5';
        text = args.join(' ');
      } else if (command === 'sha256') {
        algorithm = 'sha256';
        text = args.join(' ');
      } else {
        algorithm = args[0].toLowerCase();
        text = args.slice(1).join(' ');
        
        if (!text) {
          return bot.sendMessage(chatId, '❌ Please provide text to hash!');
        }
      }
      
      // Validate algorithm
      const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];
      if (!supportedAlgorithms.includes(algorithm)) {
        return bot.sendMessage(chatId, 
          `❌ Unsupported algorithm: ${algorithm}\n\n` +
          `Supported: ${supportedAlgorithms.join(', ')}`
        );
      }
      
      // Generate hash
      const hash = crypto.createHash(algorithm).update(text).digest('hex');
      
      // Also generate common variants
      const md5Hash = crypto.createHash('md5').update(text).digest('hex');
      const sha1Hash = crypto.createHash('sha1').update(text).digest('hex');
      const sha256Hash = crypto.createHash('sha256').update(text).digest('hex');
      
      let message = `🔐 *Hash Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📝 *Input:*\n\`${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\`\n\n`;
      message += `🎯 *${algorithm.toUpperCase()}:*\n\`${hash}\`\n\n`;
      
      // Show other common hashes if not already shown
      message += `📊 *Other Hashes:*\n`;
      if (algorithm !== 'md5') message += `• MD5: \`${md5Hash}\`\n`;
      if (algorithm !== 'sha1') message += `• SHA1: \`${sha1Hash}\`\n`;
      if (algorithm !== 'sha256') message += `• SHA256: \`${sha256Hash}\`\n`;
      
      message += `\n💡 *Info:*\n`;
      message += `• Hash length: ${hash.length} chars\n`;
      message += `• Input length: ${text.length} chars\n`;
      message += `• Algorithm: ${algorithm}`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Hash error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate hash!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
