module.exports = {
  name: 'lorem',
  version: '1.0.0',
  description: 'Generate Lorem Ipsum placeholder text',
  author: 'Bot Developer',
  commands: ['lorem', 'lipsum', 'placeholder'],
  
  loremWords: [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/lorem <count> <type>`\n\n' +
        '*Types:*\n' +
        '• `words` - Generate words\n' +
        '• `sentences` - Generate sentences\n' +
        '• `paragraphs` - Generate paragraphs\n\n' +
        '*Examples:*\n' +
        '`/lorem 50 words`\n' +
        '`/lorem 3 sentences`\n' +
        '`/lorem 2 paragraphs`\n' +
        '`/lipsum 100 words`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      const count = parseInt(args[0]) || 1;
      const type = args[1]?.toLowerCase() || 'paragraphs';
      
      // Validate
      if (count < 1 || count > 100) {
        return bot.sendMessage(chatId, '❌ Count must be between 1 and 100!');
      }
      
      let result;
      let typeDisplay;
      
      switch (type) {
        case 'word':
        case 'words':
          result = this.generateWords(count);
          typeDisplay = count === 1 ? 'Word' : 'Words';
          break;
          
        case 'sentence':
        case 'sentences':
          result = this.generateSentences(count);
          typeDisplay = count === 1 ? 'Sentence' : 'Sentences';
          break;
          
        case 'paragraph':
        case 'paragraphs':
        case 'para':
        case 'paras':
          result = this.generateParagraphs(count);
          typeDisplay = count === 1 ? 'Paragraph' : 'Paragraphs';
          break;
          
        default:
          return bot.sendMessage(chatId, 
            '❌ Invalid type! Use: words, sentences, or paragraphs'
          );
      }
      
      // Count stats
      const wordCount = result.split(/\s+/).length;
      const charCount = result.length;
      
      let message = `📝 *Lorem Ipsum Generator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📊 *Generated:* ${count} ${typeDisplay}\n`;
      message += `📏 *Stats:* ${wordCount} words, ${charCount} characters\n\n`;
      message += `📄 *Text:*\n${result}`;
      
      // If text is too long, send as file
      if (message.length > 4000) {
        await bot.sendDocument(chatId, 
          Buffer.from(result), 
          {}, 
          {
            filename: 'lorem-ipsum.txt',
            caption: `📝 Lorem Ipsum\n${count} ${typeDisplay}\n${wordCount} words, ${charCount} characters`
          }
        );
      } else {
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });
      }
      
    } catch (error) {
      console.error('Lorem generator error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to generate text!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  generateWords(count) {
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(this.loremWords[i % this.loremWords.length]);
    }
    return words.join(' ');
  },
  
  generateSentences(count) {
    const sentences = [];
    for (let i = 0; i < count; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 5; // 5-15 words
      const words = [];
      
      for (let j = 0; j < wordCount; j++) {
        words.push(this.loremWords[Math.floor(Math.random() * this.loremWords.length)]);
      }
      
      // Capitalize first letter
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      
      sentences.push(words.join(' ') + '.');
    }
    
    return sentences.join(' ');
  },
  
  generateParagraphs(count) {
    const paragraphs = [];
    
    for (let i = 0; i < count; i++) {
      const sentenceCount = Math.floor(Math.random() * 4) + 3; // 3-7 sentences
      const sentences = this.generateSentences(sentenceCount);
      paragraphs.push(sentences);
    }
    
    return paragraphs.join('\n\n');
  }
};
