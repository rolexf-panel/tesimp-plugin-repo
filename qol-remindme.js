let counter = 0;
const reminders = new Map(); // id -> timeout

module.exports = {
  name: 'remindme',
  version: '1.0.0',
  description: 'Set simple reminder with minutes/seconds',
  commands: ['remind', 'remindme'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (args.length < 2) {
      return bot.sendMessage(
        chatId,
        '⏰ *Usage:*\n' +
        '`/remind <time> <message>`\n\n' +
        'Example:\n' +
        '`/remind 10m drink water`\n' +
        '`/remind 30s check noodles`',
        { parse_mode: 'Markdown' }
      );
    }

    const timeStr = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    const match = timeStr.match(/^(\d+)(s|m|h)$/);
    if (!match) {
      return bot.sendMessage(chatId, '❌ Invalid time format. Example: 30s, 10m, 1h');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    let ms = value * 1000;
    if (unit === 'm') ms = value * 60 * 1000;
    if (unit === 'h') ms = value * 60 * 60 * 1000;

    if (ms < 1000 || ms > 24 * 60 * 60 * 1000) {
      return bot.sendMessage(chatId, '⚠️ Time minimum 1 second and maximum 24 hours.');
    }

    const id = ++counter;
    const when = new Date(Date.now() + ms);

    const timeout = setTimeout(() => {
      reminders.delete(id);
      bot.sendMessage(
        chatId,
        `⏰ *Reminder!*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${text}\n\n` +
        `🕒 Set: ${new Date().toLocaleTimeString('en-US')}`,
        { parse_mode: 'Markdown' }
      );
    }, ms);

    reminders.set(id, timeout);

    await bot.sendMessage(
      chatId,
      `✅ Reminder set in *${timeStr}*.\n` +
      `ID: \`${id}\`\n` +
      `Approximate time: *${when.toLocaleTimeString('en-US')}*`,
      { parse_mode: 'Markdown' }
    );
  }
};
