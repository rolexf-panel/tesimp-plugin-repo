// plugins/reminder.js
module.exports = {
  name: 'reminder',
  version: '1.0.0',
  description: 'Set a quick reminder',
  commands: ['remind', 'ingatkan'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    // Format: /remind 10m beli kopi
    if (args.length < 2) {
      return bot.sendMessage(chatId, '❌ Format: `/remind <waktu><m/h> <pesan>`\nContoh: `/remind 5m angkat jemuran`', { parse_mode: 'Markdown' });
    }

    const timeStr = args[0];
    const task = args.slice(1).join(' ');
    const timeValue = parseInt(timeStr);
    const unit = timeStr.slice(-1).toLowerCase();

    let ms = 0;
    if (unit === 'm') ms = timeValue * 60000;
    else if (unit === 'h') ms = timeValue * 3600000;
    else return bot.sendMessage(chatId, '❌ Gunakan unit `m` untuk menit atau `h` untuk jam!');

    await bot.sendMessage(chatId, `✅ Oke! Aku akan ingatkan: *"${task}"* dalam ${timeValue} ${unit === 'm' ? 'menit' : 'jam'}.`, { parse_mode: 'Markdown' });

    setTimeout(async () => {
      await bot.sendMessage(chatId, `⏰ *PENGINGAT:* \n\n"${task}"`, { parse_mode: 'Markdown' });
    }, ms);
  }
};
