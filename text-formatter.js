module.exports = {
  name: 'text-formatter',
  version: '1.0.0',
  description: 'Format and manipulate text in various ways',
  author: 'Bot Developer',
  commands: ['format', 'text', 'textformat'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length < 2) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/format <type> <text>`\n\n' +
        '*Available Formats:*\n' +
        '• `upper` - UPPERCASE\n' +
        '• `lower` - lowercase\n' +
        '• `title` - Title Case\n' +
        '• `reverse` - esreveR\n' +
        '• `scramble` - Scramble letters\n' +
        '• `count` - Count words/chars\n' +
        '• `remove-space` - RemoveSpaces\n' +
        '• `kebab` - kebab-case\n' +
        '• `snake` - snake_case\n' +
        '• `camel` - camelCase\n' +
        '• `pascal` - PascalCase\n' +
        '• `alternate` - AlTeRnAtE\n' +
        '• `leetspeak` - L33t Sp34k\n\n' +
        '*Examples:*\n' +
        '`/format upper hello world`\n' +
        '`/format reverse Hello World`\n' +
        '`/format title this is a test`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const type = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    
    try {
      let result;
      let description;
      
      switch (type) {
        case 'upper':
        case 'uppercase':
          result = text.toUpperCase();
          description = 'Converted to UPPERCASE';
          break;
          
        case 'lower':
        case 'lowercase':
          result = text.toLowerCase();
          description = 'Converted to lowercase';
          break;
          
        case 'title':
        case 'titlecase':
          result = this.toTitleCase(text);
          description = 'Converted to Title Case';
          break;
          
        case 'reverse':
          result = text.split('').reverse().join('');
          description = 'Text reversed';
          break;
          
        case 'scramble':
          result = this.scrambleText(text);
          description = 'Letters scrambled randomly';
          break;
          
        case 'count':
          result = this.countText(text);
          description = 'Text analysis';
          break;
          
        case 'remove-space':
        case 'removespace':
          result = text.replace(/\s+/g, '');
          description = 'Spaces removed';
          break;
          
        case 'kebab':
        case 'kebab-case':
          result = text.toLowerCase().replace(/\s+/g, '-');
          description = 'Converted to kebab-case';
          break;
          
        case 'snake':
        case 'snake-case':
        case 'snake_case':
          result = text.toLowerCase().replace(/\s+/g, '_');
          description = 'Converted to snake_case';
          break;
          
        case 'camel':
        case 'camelcase':
          result = this.toCamelCase(text);
          description = 'Converted to camelCase';
          break;
          
        case 'pascal':
        case 'pascalcase':
          result = this.toPascalCase(text);
          description = 'Converted to PascalCase';
          break;
          
        case 'alternate':
        case 'alternating':
          result = this.alternateCase(text);
          description = 'AlTeRnAtInG case';
          break;
          
        case 'leet':
        case 'leetspeak':
        case '1337':
          result = this.toLeetSpeak(text);
          description = 'Converted to L33t Sp34k';
          break;
          
        default:
          return bot.sendMessage(chatId, 
            `❌ Unknown format type: ${type}\n\n` +
            'Use `/format` without arguments to see available formats.'
          );
      }
      
      let message;
      
      if (type === 'count') {
        message = result; // Already formatted
      } else {
        message = `📝 *Text Formatter*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🔧 *Format:* ${description}\n\n`;
        message += `📄 *Original:*\n\`${text}\`\n\n`;
        message += `✨ *Result:*\n\`${result}\``;
      }
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Text formatter error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to format text!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  toTitleCase(text) {
    return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  },
  
  toCamelCase(text) {
    return text
      .toLowerCase()
      .replace(/\s(.)/g, (_, char) => char.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, char => char.toLowerCase());
  },
  
  toPascalCase(text) {
    return text
      .toLowerCase()
      .replace(/\s(.)/g, (_, char) => char.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, char => char.toUpperCase());
  },
  
  alternateCase(text) {
    return text
      .split('')
      .map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())
      .join('');
  },
  
  scrambleText(text) {
    return text
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  },
  
  toLeetSpeak(text) {
    const leetMap = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0',
      's': '5', 't': '7', 'l': '1', 'g': '9'
    };
    
    return text
      .toLowerCase()
      .split('')
      .map(char => leetMap[char] || char)
      .join('');
  },
  
  countText(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    let message = `📊 *Text Analysis*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📝 *Statistics:*\n`;
    message += `• Words: ${words.length}\n`;
    message += `• Characters: ${chars}\n`;
    message += `• Characters (no spaces): ${charsNoSpace}\n`;
    message += `• Lines: ${lines}\n`;
    message += `• Sentences: ${sentences}\n`;
    message += `• Average word length: ${(charsNoSpace / words.length).toFixed(2)}\n\n`;
    message += `📄 *Text:*\n\`${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\``;
    
    return message;
  }
};
