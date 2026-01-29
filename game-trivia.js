const axios = require('axios');

const activeTrivia = new Map(); // chatId:userId -> { correct, question }

module.exports = {
  name: 'game-trivia',
  version: '1.0.0',
  description: 'Kuis trivia pilihan ganda',
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
      text += `❓ *Pertanyaan:*\n${decode(q.question)}\n\n`;
      text += 'Pilih jawaban yang benar di bawah ini.';

      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (e) {
      console.error('Trivia error:', e);
      await bot.sendMessage(chatId, '❌ Gagal mengambil soal trivia. Coba lagi nanti.');
    }
  },

  async handleCallback(bot, query) {
    if (!query.data.startsWith('trivia:')) return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const key = `${chatId}:${userId}`;

    if (!activeTrivia.has(key)) {
      return bot.answerCallbackQuery(query.id, {
        text: 'Soal sudah tidak aktif. Kirim /trivia lagi.',
        show_alert: true
      });
    }

    const state = activeTrivia.get(key);
    activeTrivia.delete(key);

    let payload;
    try {
      payload = JSON.parse(Buffer.from(query.data.split(':')[1], 'base64').toString());
    } catch {
      return bot.answerCallbackQuery(query.id, { text: 'Jawaban tidak valid.' });
    }

    const chosen = payload.a;

    if (chosen === state.correct) {
      await bot.answerCallbackQuery(query.id, { text: '✅ Benar! Keren.', show_alert: true });
      await bot.sendMessage(
        chatId,
        `✅ *Benar!*\n\n❓ ${state.question}\n\n✔️ Jawaban: *${state.correct}*`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.answerCallbackQuery(query.id, { text: '❌ Salah, coba lagi lain waktu.', show_alert: true });
      await bot.sendMessage(
        chatId,
        `❌ *Salah.*\n\n❓ ${state.question}\n\n✔️ Jawaban yang benar: *${state.correct}*`,
        { parse_mode: 'Markdown' }
      );
    }
  }
};

