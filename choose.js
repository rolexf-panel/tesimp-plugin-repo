// choose.js
module.exports = {
  name: 'choose',
  version: '1.0.0',
  description: 'Randomly choose between multiple options (separate with "or")',
  commands: ['choose', 'pick'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    if (args.length === 0) {
      return bot.sendMessage(chatId, '❌ Please provide options!\nExample: `/choose tea or coffee or milk`', { parse_mode: 'Markdown' });
    }

    const input = args.join(' ');
    const options = input.split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);

    if (options.length < 2) {
      return bot.sendMessage(chatId, '❌ Provide at least 2 options separated by "or"!\nExample: `/choose apple or banana`', { parse_mode: 'Markdown' });
    }

    const sentMsg = await bot.sendMessage(chatId, '🤔 *Thinking hard...*', { parse_mode: 'Markdown' });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const chosen = options[Math.floor(Math.random() * options.length)];

    const escapedChosen = chosen.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

    const text = `
🤔 *Decision Made!*

I choose: **${escapedChosen}**
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
