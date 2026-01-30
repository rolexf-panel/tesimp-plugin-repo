// plugins/reminder.js
module.exports = {
  name: 'reminder',
  version: '1.0.0',
  description: 'Set a quick reminder',
  commands: ['remind', 'ingatkan'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    // Format: /remind 10m buy coffee
    if (args.length < 2) {
      return bot.sendMessage(chatId, '❌ Format: `/remind <time><m/h> <message>`\nExample: `/remind 5m take laundry`', { parse_mode: 'Markdown' });
    }

    const timeStr = args[0];
    const task = args.slice(1).join(' ');
    const timeValue = parseInt(timeStr);
    const unit = timeStr.slice(-1).toLowerCase();

    let ms = 0;
    if (unit === 'm') ms = timeValue * 60000;
    else if (unit === 'h') ms = timeValue * 3600000;
    else return bot.sendMessage(chatId, '❌ Use unit `m` for minutes or `h` for hours!');

    await bot.sendMessage(chatId, `✅ Ok! I will remind you: *"${task}"* in ${timeValue} ${unit === 'm' ? 'minutes' : 'hours'}.`, { parse_mode: 'Markdown' });

    setTimeout(async () => {
      await bot.sendMessage(chatId, `⏰ *REMINDER:* \n\n"${task}"`, { parse_mode: 'Markdown' });
    }, ms);
  }
};
