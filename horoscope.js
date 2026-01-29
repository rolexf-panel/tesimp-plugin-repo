const axios = require('axios');

module.exports = {
  name: 'horoscope',
  version: '1.0.0',
  description: 'Get daily horoscope based on zodiac sign',
  author: 'Bot Developer',
  commands: ['horoscope', 'zodiac', 'ramalan'],
  
  zodiacSigns: {
    'aries': '♈ Aries (Mar 21 - Apr 19)',
    'taurus': '♉ Taurus (Apr 20 - May 20)',
    'gemini': '♊ Gemini (May 21 - Jun 20)',
    'cancer': '♋ Cancer (Jun 21 - Jul 22)',
    'leo': '♌ Leo (Jul 23 - Aug 22)',
    'virgo': '♍ Virgo (Aug 23 - Sep 22)',
    'libra': '♎ Libra (Sep 23 - Oct 22)',
    'scorpio': '♏ Scorpio (Oct 23 - Nov 21)',
    'sagittarius': '♐ Sagittarius (Nov 22 - Dec 21)',
    'capricorn': '♑ Capricorn (Dec 22 - Jan 19)',
    'aquarius': '♒ Aquarius (Jan 20 - Feb 18)',
    'pisces': '♓ Pisces (Feb 19 - Mar 20)'
  },
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      let message = '❌ *Usage:*\n';
      message += '`/horoscope <zodiac_sign>`\n\n';
      message += '*Available Zodiac Signs:*\n';
      
      Object.entries(this.zodiacSigns).forEach(([key, value]) => {
        message += `• \`${key}\` - ${value}\n`;
      });
      
      message += '\n*Example:*\n';
      message += '`/horoscope leo`\n';
      message += '`/zodiac pisces`';
      
      return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    const sign = args[0].toLowerCase();
    
    if (!this.zodiacSigns[sign]) {
      return bot.sendMessage(chatId, 
        '❌ Invalid zodiac sign!\n\n' +
        'Use one of: ' + Object.keys(this.zodiacSigns).join(', ')
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔮 Reading the stars...');
      
      // Using Aztro API for horoscope
      const apiUrl = `https://aztro.sameerkumar.website/?sign=${sign}&day=today`;
      const response = await axios.post(apiUrl);
      
      if (response.data) {
        const data = response.data;
        
        let message = `🔮 *Daily Horoscope*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `${this.zodiacSigns[sign]}\n\n`;
        message += `📅 *Date:* ${data.current_date}\n\n`;
        message += `💫 *Description:*\n${data.description}\n\n`;
        
        if (data.compatibility) message += `💕 *Compatibility:* ${data.compatibility}\n`;
        if (data.mood) message += `😊 *Mood:* ${data.mood}\n`;
        if (data.color) message += `🎨 *Lucky Color:* ${data.color}\n`;
        if (data.lucky_number) message += `🍀 *Lucky Number:* ${data.lucky_number}\n`;
        if (data.lucky_time) message += `⏰ *Lucky Time:* ${data.lucky_time}\n`;
        
        const keyboard = [
          [
            { text: '🔄 Get Tomorrow', callback_data: `horoscope_tomorrow:${sign}` }
          ]
        ];
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
        
      } else {
        throw new Error('Failed to get horoscope');
      }
      
    } catch (error) {
      console.error('Horoscope error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get horoscope!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('horoscope_tomorrow:')) return;
    
    const chatId = query.message.chat.id;
    const sign = query.data.split(':')[1];
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🔮 Getting tomorrow\'s horoscope...' });
      
      const apiUrl = `https://aztro.sameerkumar.website/?sign=${sign}&day=tomorrow`;
      const response = await axios.post(apiUrl);
      
      if (response.data) {
        const data = response.data;
        
        let message = `🔮 *Tomorrow's Horoscope*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `${this.zodiacSigns[sign]}\n\n`;
        message += `📅 *Date:* ${data.current_date}\n\n`;
        message += `💫 *Description:*\n${data.description}\n\n`;
        
        if (data.compatibility) message += `💕 *Compatibility:* ${data.compatibility}\n`;
        if (data.mood) message += `😊 *Mood:* ${data.mood}\n`;
        if (data.color) message += `🎨 *Lucky Color:* ${data.color}\n`;
        if (data.lucky_number) message += `🍀 *Lucky Number:* ${data.lucky_number}\n`;
        if (data.lucky_time) message += `⏰ *Lucky Time:* ${data.lucky_time}\n`;
        
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
    } catch (error) {
      console.error('Horoscope callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to get horoscope',
        show_alert: true
      });
    }
  }
};
