const answers = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes – definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

module.exports = {
  name: 'eightball',
  version: '1.0.0',
  description: 'Ask the Magic 8-Ball a yes/no question and get a random answer',
  commands: ['8ball', 'eightball', 'magic8ball'],
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    if (!args || args.length === 0) {
      return bot.sendMessage(chatId, '❌ Please ask a yes/no question!\nExample: `/8ball Will it rain today?`', { parse_mode: 'Markdown' });
    }

    const question = args.join(' ');

    const sentMsg = await bot.sendMessage(chatId, '🎱 *Shaking the Magic 8-Ball...*', { parse_mode: 'Markdown' });

    // Small delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const answer = answers[Math.floor(Math.random() * answers.length)];

    const text = `
🎱 *Magic 8-Ball*

*Question:* ${question.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}
*Answer:* _${answer}_
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
