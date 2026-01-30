module.exports = {
  name: 'restart',
  version: '1.0.0',
  description: 'Restart the bot process (owner only)',
  commands: ['restart'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const ownerId = process.env.OWNER_ID;

    if (!ownerId) {
      return bot.sendMessage(chatId, '❌ OWNER_ID is not configured.');
    }

    if (String(userId) !== String(ownerId)) {
      return bot.sendMessage(chatId, '❌ This command is restricted to the bot owner.');
    }

    await bot.sendMessage(
      chatId,
      '♻️ *Restarting bot...*\n\nBot will be back shortly.',
      { parse_mode: 'Markdown' }
    );

    // Give Telegram time to send the message
    setTimeout(() => {
      process.exit(0);
    }, 1500);
  }
};
