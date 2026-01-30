const axios = require('axios');

const activeTrivia = new Map(); // chatId:userId -> { correct, question }

module.exports = {
  name: 'game-trivia',
  version: '1.0.0',
  description: 'Multiple choice trivia quiz',
  commands: ['trivia', 'quiz'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const key = `${chatId}:${userId}`;

    try {
      const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986');
      const q = res.data.results?.[0];
      if (!q) throw new Error('No trivia available');

      const decode = (s) => decodeURIComponent(s || '');

      const correct = decode(q.correct_answer);
      const incorrect = (q.incorrect_answers || []).map(decode);

      const options = [...incorrect, correct].sort(() => Math.random() - 0.5);

      activeTrivia.set(key, { correct, question: decode(q.question) });

      const keyboard = [
        options.map((opt, idx) => ({
          text: `${String.fromCharCode(65 + idx)}. ${opt}`,
          callback_data: `trivia:${Buffer.from(
            JSON.stringify({ a: opt })
          ).toString('base64')}`
        }))
      ];

      let text = '🧠 *Trivia Quiz*\n';
      text += '━━━━━━━━━━━━━━━━━━━━\n\n';
      text += `❓ *Question:*\n${decode(q.question)}\n\n`;
      text += 'Choose the correct answer below.';

      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (e) {
      console.error('Trivia error:', e);
      await bot.sendMessage(chatId, '❌ Failed to fetch trivia question. Try again later.');
    }
  },

  async handleCallback(bot, query) {
    if (!query.data.startsWith('trivia:')) return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const key = `${chatId}:${userId}`;

    if (!activeTrivia.has(key)) {
      return bot.answerCallbackQuery(query.id, {
        text: 'Question is no longer active. Send /trivia again.',
        show_alert: true
      });
    }

    const state = activeTrivia.get(key);
    activeTrivia.delete(key);

    let payload;
    try {
      payload = JSON.parse(Buffer.from(query.data.split(':')[1], 'base64').toString());
    } catch {
      return bot.answerCallbackQuery(query.id, { text: 'Invalid answer.' });
    }

    const chosen = payload.a;

    if (chosen === state.correct) {
      await bot.answerCallbackQuery(query.id, { text: '✅ Correct! Great job.', show_alert: true });
      await bot.sendMessage(
        chatId,
        `✅ *Correct!*\n\n❓ ${state.question}\n\n✔️ Answer: *${state.correct}*`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.answerCallbackQuery(query.id, { text: '❌ Wrong, try again next time.', show_alert: true });
      await bot.sendMessage(
        chatId,
        `❌ *Wrong.*\n\n❓ ${state.question}\n\n✔️ Correct answer: *${state.correct}*`,
        { parse_mode: 'Markdown' }
      );
    }
  }
};

