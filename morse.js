module.exports = {
  name: 'morse',
  version: '1.0.0',
  description: 'Translate text to Morse code and vice versa',
  author: 'Bot Developer',
  commands: ['morse', 'morsecode'],
  
  morseCode: {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
  },
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/morse encode <text>` - Text to Morse\n' +
        '`/morse decode <morse>` - Morse to text\n\n' +
        '*Examples:*\n' +
        '`/morse encode SOS`\n' +
        '`/morse decode ... --- ...`\n' +
        '`/morse encode Hello World`\n\n' +
        '*Morse Code:*\n' +
        '• Dot: `.`\n' +
        '• Dash: `-`\n' +
        '• Letter space: ` ` (space)\n' +
        '• Word space: `/`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const mode = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    
    if (!['encode', 'decode'].includes(mode)) {
      return bot.sendMessage(chatId, '❌ Mode must be either "encode" or "decode"!');
    }
    
    if (!text) {
      return bot.sendMessage(chatId, '❌ Please provide text to process!');
    }
    
    try {
      let result, message;
      
      if (mode === 'encode') {
        // Text to Morse
        result = this.textToMorse(text);
        
        message = `📡 *Morse Code Encoder*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📝 *Original:*\n\`${text}\`\n\n`;
        message += `📡 *Morse Code:*\n\`${result}\`\n\n`;
        message += `📊 *Stats:*\n`;
        message += `• Characters: ${text.length}\n`;
        message += `• Morse length: ${result.length}`;
        
      } else {
        // Morse to Text
        result = this.morseToText(text);
        
        message = `📡 *Morse Code Decoder*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📡 *Morse Code:*\n\`${text}\`\n\n`;
        message += `📝 *Decoded:*\n\`${result}\`\n\n`;
        message += `📊 *Stats:*\n`;
        message += `• Morse length: ${text.length}\n`;
        message += `• Characters: ${result.length}`;
      }
      
      const keyboard = [
        [
          { text: mode === 'encode' ? '📡 Decode' : '📝 Encode', 
            callback_data: `morse_${mode === 'encode' ? 'decode' : 'encode'}:${Buffer.from(result).toString('base64')}` }
        ]
      ];
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Morse code error:', error);
      await bot.sendMessage(chatId,
        '❌ An error occurred!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  textToMorse(text) {
    return text.toUpperCase()
      .split('')
      .map(char => this.morseCode[char] || char)
      .join(' ');
  },
  
  morseToText(morse) {
    const reverseMorse = Object.fromEntries(
      Object.entries(this.morseCode).map(([k, v]) => [v, k])
    );
    
    return morse.split(' ')
      .map(code => reverseMorse[code] || code)
      .join('');
  }
};
