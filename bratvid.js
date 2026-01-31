const axios = require('axios');

module.exports = {
  name: 'bratvid',
  version: '2.2.0',
  description: 'Generate brat-style animated video with stable error handling',
  author: 'Plugin Developer',
  commands: ['bratvid', 'bratv'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '/bratvid <text>\n\n' +
        '*Example:*\n' +
        '/bratvid club classics',
        { parse_mode: 'Markdown' }
      );
    }

    const text = args.join(' ');
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }

    let statusMsg;
    try {
      statusMsg = await bot.sendMessage(chatId, '🎬 *Generating brat video...*', { parse_mode: 'Markdown' });

      const apiKey = process.env.BETABOTZ_API || '';
      
      // Construct the API URL with the specified format
      const apiUrl = `https://api.betabotz.eu.org/api/maker/brat-video?apikey=${apiKey}&text=${encodeURIComponent(text)}`;

      // Fetch the video from the API
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 45000 // Wait for up to 45 seconds
      });

      // Ensure that response data exists and is valid
      if (!response || !response.data) {
        throw new Error('EMPTY_RESPONSE');
      }

      // Check if the response contains HTML (which could indicate an error page)
      const contentString = response.data.slice(0, 100).toString().toLowerCase();
      if (contentString.includes('<html') || contentString.includes('<!doctype')) {
        console.error('--- [DEBUG HTML RESPONSE] ---');
        console.error(response.data.toString()); // Log complete response for debugging
        throw new Error('SERVER_RETURNED_HTML');
      }

      const buffer = Buffer.from(response.data, 'binary');

      // Delete status message once video is generated
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      // Send the generated video to the user
      await bot.sendVideo(chatId, buffer, {
        caption: `🎬 *BRAT Video*\n━━━━━━━━━━━━━━━━━━━━\n\n📝 Text: ${text}`,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      // Delete status message in case of error
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      let errorDisplay = 'Terjadi kesalahan sistem.';

      // Error handling logic
      if (error.message === 'SERVER_RETURNED_HTML') {
        errorDisplay = 'API Key salah, Limit habis, atau Server sedang Maintenance.';
      } else if (error.message === 'EMPTY_RESPONSE') {
        errorDisplay = 'Server API tidak memberikan respon apa pun.';
      } else if (error.response) {
        // Error from server (404, 500, etc)
        errorDisplay = `API Error: ${error.response.status}`;
        console.error('Server Response Error:', error.response.status);
      } else if (error.request) {
        // Network error (no response)
        errorDisplay = 'Gagal terhubung ke API. Cek koneksi VPS.';
        console.error('Network Error:', error.message);
      } else {
        errorDisplay = error.message;
      }

      console.error('Final Error Catch:', error.message);

      await bot.sendMessage(chatId, 
        `❌ *Failed to generate brat video!*\n\n*Reason:* ${errorDisplay}\n\nCek log terminal untuk detail teknis.`,
        { parse_mode: 'Markdown' }
      );
    }
  }
};

