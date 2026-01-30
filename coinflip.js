// coinflip.js
const sides = ['Heads 🦅', 'Tails 🪙'];

module.exports = {
  name: 'coinflip',
  version: '1.0.0',
  description: 'Flip a virtual coin and get Heads or Tails',
  commands: ['coin', 'flip', 'coinflip'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    const sentMsg = await bot.sendMessage(chatId, '🪙 *Flipping the coin...*', { parse_mode: 'Markdown' });

    // Delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = sides[Math.floor(Math.random() * sides.length)];

    const text = `
🪙 *Coin Flip Result*

_${result}_
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
