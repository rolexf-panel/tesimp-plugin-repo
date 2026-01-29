const choices = ['rock', 'paper', 'scissors'];

module.exports = {
  name: 'game-rps',
  version: '1.0.0',
  description: 'Main suit batu-gunting-kertas dengan bot',
  commands: ['rps', 'suit'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (!args[0]) {
      return bot.sendMessage(
        chatId,
        '✊ ✋ ✌️ *Batu-Gunting-Kertas*\n\n' +
        'Cara main:\n' +
        '`/rps rock`\n' +
        '`/rps paper`\n' +
        '`/rps scissors`\n\n' +
        'Alias bahasa Indonesia:\n' +
        '`/suit batu`\n' +
        '`/suit kertas`\n' +
        '`/suit gunting`',
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
        '❌ Pilihan tidak dikenal. Gunakan: rock / paper / scissors (atau batu / kertas / gunting).'
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

    let text = '✊ ✋ ✌️ *Batu-Gunting-Kertas*\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += `👤 Kamu: ${toEmoji(userChoice)} *${userChoice}*\n`;
    text += `🤖 Bot : ${toEmoji(botChoice)} *${botChoice}*\n\n`;

    if (result === 'win') text += '🎉 *Kamu menang!* GG.';
    else if (result === 'lose') text += '😜 *Kamu kalah!* Coba lagi dong.';
    else text += '🤝 *Seri!* Kita seimbang.';

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
};

