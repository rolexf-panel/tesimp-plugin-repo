// compliment.js
const compliments = [
  "You're absolutely amazing!",
  "You have the best smile I've ever seen.",
  "Your positive energy is contagious.",
  "You're incredibly talented at what you do.",
  "You make the world a better place just by being in it.",
  "Your kindness knows no bounds.",
  "You're one of a kind – in the best way!",
  "You always know how to brighten someone's day.",
  "Your creativity is off the charts.",
  "You're stronger than you think.",
  "You have a heart of gold.",
  "People love being around you.",
  "You're going to achieve great things!",
  "Your laugh is infectious.",
  "You're beautiful inside and out."
];

module.exports = {
  name: 'compliment',
  version: '1.0.0',
  description: 'Get a random compliment to brighten your day',
  commands: ['compliment', 'praise'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    const sentMsg = await bot.sendMessage(chatId, '💝 *Preparing a compliment...*', { parse_mode: 'Markdown' });

    await new Promise(resolve => setTimeout(resolve, 1200));

    const compliment = compliments[Math.floor(Math.random() * compliments.length)];

    const text = `
💝 *Here's your compliment:*

_${compliment}_
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
