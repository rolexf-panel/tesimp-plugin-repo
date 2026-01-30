const axios = require('axios');

module.exports = {
  name: 'weather',
  version: '1.0.0',
  description: 'Get current weather information by city',
  commands: ['weather', 'w'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    if (!args.length) {
      return bot.sendMessage(chatId, '❌ Please provide a city name.');
    }

    const city = args.join(' ');
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return bot.sendMessage(chatId, '❌ Weather API key not configured.');
    }

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
      );

      const data = res.data;
      const text = `
🌤 *Weather Information*

• City: *${data.name}*
• Condition: *${data.weather[0].description}*
• Temperature: *${data.main.temp}°C*
• Feels Like: *${data.main.feels_like}°C*
• Humidity: *${data.main.humidity}%*
• Wind Speed: *${data.wind.speed} m/s*
      `.trim();

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ City not found or API error.');
    }
  }
};
