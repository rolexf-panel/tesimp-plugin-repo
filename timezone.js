module.exports = {
  name: 'timezone',
  version: '1.0.0',
  description: 'Convert time between different timezones',
  author: 'Bot Developer',
  commands: ['timezone', 'tz', 'time'],
  
  // Popular timezones
  timezones: {
    'utc': { offset: 0, name: 'UTC' },
    'gmt': { offset: 0, name: 'GMT' },
    'est': { offset: -5, name: 'Eastern Time (US)' },
    'edt': { offset: -4, name: 'Eastern Daylight Time' },
    'cst': { offset: -6, name: 'Central Time (US)' },
    'cdt': { offset: -5, name: 'Central Daylight Time' },
    'mst': { offset: -7, name: 'Mountain Time (US)' },
    'mdt': { offset: -6, name: 'Mountain Daylight Time' },
    'pst': { offset: -8, name: 'Pacific Time (US)' },
    'pdt': { offset: -7, name: 'Pacific Daylight Time' },
    'wib': { offset: 7, name: 'Western Indonesia Time' },
    'wita': { offset: 8, name: 'Central Indonesia Time' },
    'wit': { offset: 9, name: 'Eastern Indonesia Time' },
    'jst': { offset: 9, name: 'Japan Standard Time' },
    'kst': { offset: 9, name: 'Korea Standard Time' },
    'cet': { offset: 1, name: 'Central European Time' },
    'ist': { offset: 5.5, name: 'India Standard Time' },
    'bst': { offset: 1, name: 'British Summer Time' },
    'aest': { offset: 10, name: 'Australian Eastern Standard Time' },
    'aedt': { offset: 11, name: 'Australian Eastern Daylight Time' }
  },
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/timezone <from> to <to>` - Convert time\n' +
        '`/timezone list` - Show available timezones\n' +
        '`/time now <timezone>` - Current time in timezone\n\n' +
        '*Examples:*\n' +
        '`/timezone wib to pst`\n' +
        '`/time now jst`\n' +
        '`/timezone 14:30 wib to est`\n' +
        '`/tz list`',
        { parse_mode: 'Markdown' }
      );
    }
    
    // List timezones
    if (args[0].toLowerCase() === 'list') {
      let message = `🌍 *Available Timezones*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      Object.entries(this.timezones).forEach(([code, data]) => {
        const offset = data.offset >= 0 ? `+${data.offset}` : data.offset;
        message += `• \`${code.toUpperCase()}\` - ${data.name} (UTC${offset})\n`;
      });
      
      return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    // Show current time in timezone
    if (args[0].toLowerCase() === 'now' && args.length === 2) {
      const tz = args[1].toLowerCase();
      
      if (!this.timezones[tz]) {
        return bot.sendMessage(chatId, 
          `❌ Unknown timezone: ${tz}\n\n` +
          'Use `/timezone list` to see available timezones.'
        );
      }
      
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const tzTime = new Date(utcTime + (this.timezones[tz].offset * 3600000));
      
      let message = `🕐 *Current Time*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📍 *Timezone:* ${this.timezones[tz].name}\n`;
      message += `🕐 *Time:* ${tzTime.toLocaleTimeString('en-US', { hour12: false })}\n`;
      message += `📅 *Date:* ${tzTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
      
      return bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id  
      });
    }
    
    try {
      // Parse conversion request
      let timeStr = null;
      let fromTz, toTz;
      
      // Check if time is specified (format: HH:MM)
      if (args[0].match(/^\d{1,2}:\d{2}$/)) {
        timeStr = args[0];
        fromTz = args[1]?.toLowerCase();
        toTz = args[3]?.toLowerCase();
      } else {
        fromTz = args[0].toLowerCase();
        toTz = args[2]?.toLowerCase();
      }
      
      if (!fromTz || !toTz) {
        return bot.sendMessage(chatId, 
          '❌ Invalid format!\n\n' +
          'Use: `/timezone <from> to <to>`\n' +
          'Or: `/timezone HH:MM <from> to <to>`'
        );
      }
      
      if (!this.timezones[fromTz]) {
        return bot.sendMessage(chatId, `❌ Unknown timezone: ${fromTz}`);
      }
      
      if (!this.timezones[toTz]) {
        return bot.sendMessage(chatId, `❌ Unknown timezone: ${toTz}`);
      }
      
      // Get base time
      let baseTime;
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        baseTime = new Date();
        baseTime.setHours(hours, minutes, 0, 0);
      } else {
        baseTime = new Date();
      }
      
      // Convert
      const utcTime = baseTime.getTime() + (baseTime.getTimezoneOffset() * 60000) - 
                      (this.timezones[fromTz].offset * 3600000);
      const convertedTime = new Date(utcTime + (this.timezones[toTz].offset * 3600000));
      
      let message = `🌍 *Timezone Converter*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📤 *From:* ${this.timezones[fromTz].name}\n`;
      message += `🕐 ${baseTime.toLocaleTimeString('en-US', { hour12: false })}\n`;
      message += `📅 ${baseTime.toLocaleDateString('en-US')}\n\n`;
      message += `📥 *To:* ${this.timezones[toTz].name}\n`;
      message += `🕐 ${convertedTime.toLocaleTimeString('en-US', { hour12: false })}\n`;
      message += `📅 ${convertedTime.toLocaleDateString('en-US')}\n\n`;
      
      const diffHours = this.timezones[toTz].offset - this.timezones[fromTz].offset;
      message += `⏱️ *Time Difference:* ${diffHours >= 0 ? '+' : ''}${diffHours} hours`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('Timezone error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to convert timezone!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};
