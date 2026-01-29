let counter = 0;
const reminders = new Map(); // id -> timeout

module.exports = {
  name: 'remindme',
  version: '1.0.0',
  description: 'Set reminder sederhana dengan menit/detik',
  commands: ['remind', 'remindme'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (args.length < 2) {
      return bot.sendMessage(
        chatId,
        '⏰ *Usage:*\n' +
        '`/remind <waktu> <pesan>`\n\n' +
        'Contoh:\n' +
        '`/remind 10m minum air`\n' +
        '`/remind 30s cek mie`',
        { parse_mode: 'Markdown' }
      );
    }

    const timeStr = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    const match = timeStr.match(/^(\d+)(s|m|h)$/);
    if (!match) {
      return bot.sendMessage(chatId, '❌ Format waktu tidak valid. Contoh: 30s, 10m, 1h');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    let ms = value * 1000;
    if (unit === 'm') ms = value * 60 * 1000;
    if (unit === 'h') ms = value * 60 * 60 * 1000;

    if (ms < 1000 || ms > 24 * 60 * 60 * 1000) {
      return bot.sendMessage(chatId, '⚠️ Waktu minimal 1 detik dan maksimal 24 jam.');
    }

    const id = ++counter;
    const when = new Date(Date.now() + ms);

    const timeout = setTimeout(() => {
      reminders.delete(id);
      bot.sendMessage(
        chatId,
        `⏰ *Reminder!*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${text}\n\n` +
        `🕒 Set: ${new Date().toLocaleTimeString('id-ID')}`,
        { parse_mode: 'Markdown' }
      );
    }, ms);

    reminders.set(id, timeout);

    await bot.sendMessage(
      chatId,
      `✅ Reminder diset dalam *${timeStr}*.\n` +
      `ID: \`${id}\`\n` +
      `Waktu kira-kira: *${when.toLocaleTimeString('id-ID')}*`,
      { parse_mode: 'Markdown' }
    );
  }
};

