const axios = require('axios');

module.exports = {
  name: 'downloader',
  version: '1.0.0',
  description: 'Download media from URL',
  commands: ['tiktok', 'ig', 'ytmp3'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].substring(botInstance.config.prefix.length);

    if (args.length === 0) return bot.sendMessage(chatId, `⚠️ Please provide a URL! Example: /${command} https://linkhere...`);

    const url = args[0];
    const loadingMsg = await bot.sendMessage(chatId, '🔍 Searching & Downloading...');

    try {
      // Using third-party API (cobiro.github.io or similar for example)
      // You can replace this endpoint with your premium/private API
      
      let apiUrl = '';
      if (command === 'tiktok') apiUrl = `https://api.tiklydown.eu.org/api/download?url=${url}`;
      
      if (!apiUrl) {
         return bot.editMessageText('❌ This feature is under maintenance.', { chat_id: chatId, message_id: loadingMsg.message_id });
      }

      const res = await axios.get(apiUrl);
      const data = res.data;

      if (command === 'tiktok') {
        // Adjust JSON parsing according to the API used
        const videoUrl = data.video?.noWatermark || data.url;
        const caption = `✅ *TikTok Download*\nAuthor: ${data.author?.name || '-'}\nTitle: ${data.title || '-'}`;

        await bot.sendVideo(chatId, videoUrl, { caption: caption, parse_mode: 'Markdown' });
        await bot.deleteMessage(chatId, loadingMsg.message_id);
      }

    } catch (error) {
      console.error(error);
      bot.editMessageText(`❌ Failed to fetch data. Make sure the link is valid or the API is down.\nError: ${error.message}`, {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }
  }
};
