const axios = require('axios');

module.exports = {
  name: 'text-to-speech',
  version: '2.0.0',
  description: 'Convert text to speech audio (Google TTS)',
  author: 'Upgraded Plugin',
  commands: ['tts', 'speak', 'voice'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/tts <text>`\n' +
        '`/speak <text>`\n\n' +
        '*Example:*\n' +
        '`/tts Hello, how are you today?`\n' +
        '`/speak This is a test message`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 200) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 200 characters (Google TTS).');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎤 Converting text to speech...');
      
      const lang = (process.env.TTS_LANG || 'id').toLowerCase();
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      await bot.sendVoice(chatId, ttsUrl, {
        caption: `🎤 *Text to Speech*\n\n📝 "${text}"`,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('TTS error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to convert text to speech!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};