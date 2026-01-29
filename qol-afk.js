const afkMap = new Map(); // userId -> { reason, since }

module.exports = {
  name: 'afk',
  version: '1.0.0',
  description: 'Set status AFK dan auto-notice ketika kembali',
  commands: ['afk'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const reason = args.join(' ') || 'AFK';
    afkMap.set(userId, { reason, since: Date.now() });

    await bot.sendMessage(
      chatId,
      `😴 *${msg.from.first_name || 'Kamu'}* sekarang AFK.\nAlasan: _${reason}_`,
      { parse_mode: 'Markdown' }
    );
  },

  // Opsional: panggil ini dari handler global on('message') kalau core bot mendukung
  async handleMessage(bot, msg) {
    if (!msg || !msg.from) return;
    const userId = msg.from.id;

    if (afkMap.has(userId)) {
      afkMap.delete(userId);
      await bot.sendMessage(
        msg.chat.id,
        `👋 Selamat datang kembali, *${msg.from.first_name || 'user'}*! Status AFK kamu dihapus.`,
        { parse_mode: 'Markdown' }
      );
    }
  }
};

