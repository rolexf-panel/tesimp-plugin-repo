module.exports = {
  name: 'age-calculator',
  version: '1.0.0',
  description: 'Calculate age from birthdate with detailed statistics',
  author: 'Bot Developer',
  commands: ['age', 'birthday', 'howold'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/age <DD-MM-YYYY>` or `/age <DD/MM/YYYY>`\n' +
        '`/age <YYYY-MM-DD>`\n\n' +
        '*Examples:*\n' +
        '`/age 15-08-1990`\n' +
        '`/age 1990-08-15`\n' +
        '`/age 15/08/1990`\n' +
        '`/birthday 01-01-2000`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const input = args[0];
    
    try {
      // Parse date
      let birthDate;
      
      if (input.includes('-')) {
        const parts = input.split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY
          birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else if (input.includes('/')) {
        const parts = input.split('/');
        // DD/MM/YYYY
        birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        return bot.sendMessage(chatId, '❌ Invalid date format! Use DD-MM-YYYY or YYYY-MM-DD');
      }
      
      // Validate date
      if (isNaN(birthDate.getTime())) {
        return bot.sendMessage(chatId, '❌ Invalid date!');
      }
      
      const now = new Date();
      
      if (birthDate > now) {
        return bot.sendMessage(chatId, '❌ Birthdate cannot be in the future!');
      }
      
      // Calculate age
      const ageData = this.calculateAge(birthDate, now);
      
      // Next birthday
      const nextBirthday = this.getNextBirthday(birthDate, now);
      const daysUntilBirthday = Math.floor((nextBirthday - now) / (1000 * 60 * 60 * 24));
      
      // Zodiac sign
      const zodiac = this.getZodiacSign(birthDate);
      
      let message = `🎂 *Age Calculator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📅 *Birthdate:* ${birthDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n\n`;
      
      message += `🎯 *Age:*\n`;
      message += `• **${ageData.years} years, ${ageData.months} months, ${ageData.days} days**\n`;
      message += `• ${ageData.totalMonths} months\n`;
      message += `• ${ageData.totalWeeks} weeks\n`;
      message += `• ${ageData.totalDays} days\n`;
      message += `• ${ageData.totalHours} hours\n`;
      message += `• ${ageData.totalMinutes.toLocaleString()} minutes\n\n`;
      
      message += `🎈 *Next Birthday:*\n`;
      message += `• ${nextBirthday.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n`;
      message += `• ${daysUntilBirthday} days remaining\n\n`;
      
      message += `${zodiac.emoji} *Zodiac Sign:* ${zodiac.sign}`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Age calculator error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to calculate age!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  calculateAge(birthDate, now) {
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    let days = now.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const totalDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    
    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      totalHours,
      totalMinutes
    };
  },
  
  getNextBirthday(birthDate, now) {
    const nextBirthday = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    
    return nextBirthday;
  },
  
  getZodiacSign(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const signs = [
      { name: 'Capricorn', emoji: '♑', start: [12, 22], end: [1, 19] },
      { name: 'Aquarius', emoji: '♒', start: [1, 20], end: [2, 18] },
      { name: 'Pisces', emoji: '♓', start: [2, 19], end: [3, 20] },
      { name: 'Aries', emoji: '♈', start: [3, 21], end: [4, 19] },
      { name: 'Taurus', emoji: '♉', start: [4, 20], end: [5, 20] },
      { name: 'Gemini', emoji: '♊', start: [5, 21], end: [6, 20] },
      { name: 'Cancer', emoji: '♋', start: [6, 21], end: [7, 22] },
      { name: 'Leo', emoji: '♌', start: [7, 23], end: [8, 22] },
      { name: 'Virgo', emoji: '♍', start: [8, 23], end: [9, 22] },
      { name: 'Libra', emoji: '♎', start: [9, 23], end: [10, 22] },
      { name: 'Scorpio', emoji: '♏', start: [10, 23], end: [11, 21] },
      { name: 'Sagittarius', emoji: '♐', start: [11, 22], end: [12, 21] }
    ];
    
    for (const sign of signs) {
      const [startMonth, startDay] = sign.start;
      const [endMonth, endDay] = sign.end;
      
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return { sign: sign.name, emoji: sign.emoji };
      }
    }
    
    return { sign: 'Unknown', emoji: '❓' };
  }
};
