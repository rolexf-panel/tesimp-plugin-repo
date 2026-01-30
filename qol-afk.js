const afkMap = new Map(); // userId -> { reason, since }

module.exports = {
  name: 'afk',
  version: '1.0.0',
  description: 'Set AFK status and auto-notice when back',
  commands: ['afk'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const reason = args.join(' ') || 'AFK';
    afkMap.set(userId, { reason, since: Date.now() });

    await bot.sendMessage(
      chatId,
      `😴 *${msg.from.first_name || 'You'}* are now AFK.\nReason: _${reason}_`,
      { parse_mode: 'Markdown' }
    );
  },

  // Optional: call this from global handler on('message') if core bot supports it
  async handleMessage(bot, msg) {
    if (!msg || !msg.from) return;
    const userId = msg.from.id;

    if (afkMap.has(userId)) {
      afkMap.delete(userId);
      await bot.sendMessage(
        msg.chat.id,
        `👋 Welcome back, *${msg.from.first_name || 'user'}*! Your AFK status has been removed.`,
        { parse_mode: 'Markdown' }
      );
    }
  }
};
