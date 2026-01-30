const localMessages = [
  {
    message: 'Don\'t compare your progress with others. Everyone has their own timeline.',
    creator: 'Hazel'
  },
  {
    message: 'Don\'t be too hard on yourself. You\'re doing your best with what you have.',
    creator: 'Hazel'
  },
  {
    message: 'Don\'t stop just because you\'re tired. Stop when you\'ve achieved your goal.',
    creator: 'Hazel'
  },
  {
    message: 'Don\'t forget to rest. Productivity is important, but sanity is more important.',
    creator: 'Hazel'
  }
];

module.exports = {
  name: 'janganlah',
  version: '2.0.0',
  description: 'Get local words of wisdom (no API)',
  commands: ['janganlah', 'nasihat'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const loadingMsg = await bot.sendMessage(chatId, '💭 *Contemplating for a moment...*', { parse_mode: 'Markdown' });

    try {
      const random = localMessages[Math.floor(Math.random() * localMessages.length)];

      const text = `
📜 *WISE MESSAGE*
━━━━━━━━━━━━━━━━━━━━
"${random.message}"

— _${random.creator || 'Hazel'}_
      `.trim();

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error Janganlah Plugin:', error.message);
      await bot.editMessageText('⚠️ Failed to process wise message.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }
  }
};
