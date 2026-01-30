const choices = ['rock', 'paper', 'scissors'];

module.exports = {
  name: 'game-rps',
  version: '1.0.0',
  description: 'Play rock-paper-scissors with bot',
  commands: ['rps', 'suit'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (!args[0]) {
      return bot.sendMessage(
        chatId,
        '✊ ✋ ✌️ *Rock-Paper-Scissors*\n\n' +
        'How to play:\n' +
        '`/rps rock`\n' +
        '`/rps paper`\n' +
        '`/rps scissors`\n\n' +
        'Indonesian aliases:\n' +
        '`/suit batu` (rock)\n' +
        '`/suit kertas` (paper)\n' +
        '`/suit gunting` (scissors)',
        { parse_mode: 'Markdown' }
      );
    }

    const rawUser = args[0].toLowerCase();
    let userChoice;

    if (['rock', 'batu'].includes(rawUser)) userChoice = 'rock';
    else if (['paper', 'kertas'].includes(rawUser)) userChoice = 'paper';
    else if (['scissors', 'gunting'].includes(rawUser)) userChoice = 'scissors';

    if (!userChoice) {
      return bot.sendMessage(
        chatId,
        '❌ Unknown choice. Use: rock / paper / scissors (or batu / kertas / gunting).'
      );
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    const resultMatrix = {
      rock: { rock: 'draw', paper: 'lose', scissors: 'win' },
      paper: { rock: 'win', paper: 'draw', scissors: 'lose' },
      scissors: { rock: 'lose', paper: 'win', scissors: 'draw' }
    };

    const result = resultMatrix[userChoice][botChoice];

    const toEmoji = (c) => (c === 'rock' ? '✊' : c === 'paper' ? '✋' : '✌️');

    let text = '✊ ✋ ✌️ *Rock-Paper-Scissors*\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += `👤 You: ${toEmoji(userChoice)} *${userChoice}*\n`;
    text += `🤖 Bot: ${toEmoji(botChoice)} *${botChoice}*\n\n`;

    if (result === 'win') text += '🎉 *You win!* GG.';
    else if (result === 'lose') text += '😜 *You lose!* Try again.';
    else text += '🤝 *Draw!* We\'re even.';

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
};
