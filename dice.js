// dice.js
const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; // 1 to 6

module.exports = {
  name: 'dice',
  version: '1.0.0',
  description: 'Roll a dice (default 6-sided, or specify sides like /dice 20)',
  commands: ['dice', 'roll'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    let sides = 6;
    if (args.length > 0 && !isNaN(args[0])) {
      sides = parseInt(args[0]);
      if (sides < 1 || sides > 1000) {
        return bot.sendMessage(chatId, '❌ Please choose a number between 1 and 1000!', { parse_mode: 'Markdown' });
      }
    }

    const sentMsg = await bot.sendMessage(chatId, '🎲 *Rolling the dice...*', { parse_mode: 'Markdown' });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = Math.floor(Math.random() * sides) + 1;
    const face = sides === 6 ? diceFaces[result - 1] : '';

    const text = `
🎲 *Dice Roll Result*

You rolled a **${result}** ${face} ${sides !== 6 ? `(1-${sides})` : ''}
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
