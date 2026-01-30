const axios = require('axios');

module.exports = {
  name: 'crypto',
  version: '2.0.0',
  description: 'View live cryptocurrency market prices (CoinGecko)',
  commands: ['crypto', 'market', 'harga'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;
    const loadingMsg = await bot.sendMessage(chatId, '📊 *Fetching crypto market data...*', { parse_mode: 'Markdown' });

    try {
      const apiKey = process.env.COINGECKO_API_KEY || null;

      const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false
        },
        headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {}
      });

      const market = res.data;

      if (!Array.isArray(market) || market.length === 0) {
        throw new Error('Market data is empty');
      }

      const getEmoji = (change) => parseFloat(change) >= 0 ? '🚀' : '🔻';
      const getSymbol = (change) => parseFloat(change) >= 0 ? '+' : '';

      let text = `💰 *CRYPTO MARKET LIVE* 💰\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      market.forEach((coin, index) => {
        const change24h = coin.price_change_percentage_24h ?? 0;
        const emoji = getEmoji(change24h);
        const symbol = getSymbol(change24h);

        text += `${index + 1}. *${coin.symbol.toUpperCase()}* (${coin.name})\n`;
        text += `💵 Price: \`$${coin.current_price}\`\n`;
        text += `${emoji} 24h: \`${symbol}${change24h.toFixed(2)}%\`\n\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🕒 _Last Update: ${new Date().toLocaleTimeString('en-US')}_`;

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Crypto Plugin Error:', error.message);
      await bot.editMessageText('⚠️ *Failed to fetch market data.*\nMake sure the API is active or try again later.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    }
  }
};
