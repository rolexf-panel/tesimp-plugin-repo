module.exports = {
  name: 'countdown',
  version: '1.0.0',
  description: 'Countdown to important dates and events',
  author: 'Bot Developer',
  commands: ['countdown', 'count', 'timer'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/countdown <DD-MM-YYYY> <event_name>`\n' +
        '`/countdown <YYYY-MM-DD> <event_name>`\n' +
        '`/countdown list` - Popular countdowns\n\n' +
        '*Examples:*\n' +
        '`/countdown 31-12-2025 New Year 2026`\n' +
        '`/countdown 2025-08-17 Independence Day`\n' +
        '`/count 25-12-2025 Christmas`',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Show popular countdowns
    if (args[0].toLowerCase() === 'list') {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const events = [
        { name: 'New Year', date: new Date(currentYear + 1, 0, 1) },
        { name: 'Valentine\'s Day', date: new Date(currentYear, 1, 14) },
        { name: 'Halloween', date: new Date(currentYear, 9, 31) },
        { name: 'Christmas', date: new Date(currentYear, 11, 25) },
        { name: 'Independence Day (ID)', date: new Date(currentYear, 7, 17) }
      ];
      
      // Adjust for past events
      events.forEach(event => {
        if (event.date < now) {
          event.date.setFullYear(currentYear + 1);
        }
      });
      
      let message = `📅 *Popular Countdowns*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      events.forEach(event => {
        const countdown = this.calculateCountdown(event.date);
        message += `🎯 *${event.name}*\n`;
        message += `   ${event.date.toLocaleDateString('en-US')}\n`;
        message += `   ${countdown.days} days remaining\n\n`;
      });
      
      return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    try {
      const input = args[0];
      const eventName = args.slice(1).join(' ') || 'Event';
      
      // Parse date
      let targetDate;
      
      if (input.includes('-')) {
        const parts = input.split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY
          targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else if (input.includes('/')) {
        const parts = input.split('/');
        targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        return bot.sendMessage(chatId, '❌ Invalid date format! Use DD-MM-YYYY or YYYY-MM-DD');
      }
      
      // Validate date
      if (isNaN(targetDate.getTime())) {
        return bot.sendMessage(chatId, '❌ Invalid date!');
      }
      
      const now = new Date();
      
      if (targetDate < now) {
        return bot.sendMessage(chatId, '❌ Date is in the past!');
      }
      
      // Calculate countdown
      const countdown = this.calculateCountdown(targetDate);
      
      // Get day of week
      const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      let message = `⏳ *Countdown Timer*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🎯 *Event:* ${eventName}\n\n`;
      message += `📅 *Target Date:*\n`;
      message += `${targetDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n\n`;
      
      message += `⏱️ *Time Remaining:*\n`;
      message += `• **${countdown.days} days**\n`;
      message += `• ${countdown.hours} hours\n`;
      message += `• ${countdown.minutes} minutes\n`;
      message += `• ${countdown.seconds} seconds\n\n`;
      
      message += `📊 *Breakdown:*\n`;
      message += `• ${countdown.weeks} weeks, ${countdown.days % 7} days\n`;
      message += `• ${countdown.totalHours.toLocaleString()} hours\n`;
      message += `• ${countdown.totalMinutes.toLocaleString()} minutes\n\n`;
      
      // Progress bar
      const oneYear = 365;
      const progress = Math.min(100, Math.round((countdown.days / oneYear) * 100));
      const progressBar = this.createProgressBar(100 - progress);
      
      message += `📈 *Progress:*\n${progressBar} ${100 - progress}%\n\n`;
      
      message += `💡 *Tip:* Bookmark this for ${eventName}!`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Countdown error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to calculate countdown!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  calculateCountdown(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    
    return {
      days: days,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      weeks: weeks,
      totalHours: hours,
      totalMinutes: minutes,
      totalSeconds: seconds
    };
  },
  
  createProgressBar(percent) {
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
};
