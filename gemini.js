const axios = require('axios');

module.exports = {
  name: 'gemini',
  version: '2.0.0',
  description: 'Tanya jawab dengan Gemini AI (Google)',
  commands: ['gemini', 'ai2'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    if (!args[0]) return bot.sendMessage(chatId, '💬 Halo! Ada yang bisa saya bantu?');

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      return bot.sendMessage(chatId,
        '⚠️ GEMINI_API_KEY belum diset di environment.\n' +
        'Set dulu lalu restart bot.'
      );
    }

    const text = `${args.join(' ')} (jawab dalam bahasa indonesia)`;
    await bot.sendChatAction(chatId, 'typing');

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          contents: [{ parts: [{ text }] }]
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const reply =
        res.data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ||
        'Maaf, aku tidak bisa menjawab saat ini.';

      await bot.sendMessage(chatId, reply, { reply_to_message_id: msg.message_id });
    } catch (e) {
      console.error('Gemini error:', e.response?.data || e.message);
      bot.sendMessage(chatId, '⚠️ Maaf, layanan AI sedang tidak stabil atau terjadi error.');
    }
  }
};