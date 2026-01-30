// plugins/currency.js
const axios = require('axios');

module.exports = {
  name: 'currency',
  version: '1.0.0',
  description: 'Convert currency rates',
  commands: ['convert', 'kurs'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;

    // Format: /convert 100 USD IDR
    if (args.length < 3) {
      return bot.sendMessage(chatId, '❌ Format: `/convert <amount> <from> <to>`\nExample: `/convert 10 USD IDR`', { parse_mode: 'Markdown' });
    }

    const [amount, from, to] = args;
    const statusMsg = await bot.sendMessage(chatId, '💱 Calculating...');

    try {
      const url = `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`;
      const response = await axios.get(url);
      const rate = response.data.rates[to.toUpperCase()];

      if (!rate) throw new Error('Currency not found');

      const result = (amount * rate).toLocaleString('en-US');
      const text = `💰 *Currency Conversion*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                   `${amount} ${from.toUpperCase()} ➡️ *${result} ${to.toUpperCase()}*\n` +
                   `📈 Rate: 1 ${from.toUpperCase()} = ${rate.toLocaleString('en-US')} ${to.toUpperCase()}`;

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      await bot.editMessageText(`❌ Failed to fetch data. Make sure currency codes are correct (Example: USD, IDR, JPY).`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  }
};
