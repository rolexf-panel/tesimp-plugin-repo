const axios = require('axios');

module.exports = {
  name: 'gemini',
  version: '2.0.0',
  description: 'Q&A with Gemini AI (Google)',
  commands: ['gemini', 'ai2'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    if (!args[0]) return bot.sendMessage(chatId, '💬 Hello! How can I help you?');

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      return bot.sendMessage(chatId,
        '⚠️ GEMINI_API_KEY is not set in environment.\n' +
        'Please set it and restart the bot.'
      );
    }

    const text = `${args.join(' ')} (answer in Indonesian)`;
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
        'Sorry, I cannot answer at this time.';

      await bot.sendMessage(chatId, reply, { reply_to_message_id: msg.message_id });
    } catch (e) {
      console.error('Gemini error:', e.response?.data || e.message);
      bot.sendMessage(chatId, '⚠️ Sorry, AI service is currently unstable or an error occurred.');
    }
  }
};
