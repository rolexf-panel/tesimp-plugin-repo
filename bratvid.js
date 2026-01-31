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
        '`/bratvid <text>`\n\n' +
        '*Example:*\n' +
        '`/bratvid club classics`',
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
      const apiUrl = `https://api.betabotz.eu.org/api/maker/bratvideo?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 45000 // Menunggu hingga 45 detik
      });

      // Validasi apakah data ada
      if (!response || !response.data) {
        throw new Error('EMPTY_RESPONSE');
      }

      // Cek apakah response berupa HTML (Error dari Cloudflare/Server)
      const contentString = response.data.slice(0, 100).toString().toLowerCase();
      if (contentString.includes('<html') || contentString.includes('<!doctype')) {
        console.error('--- [DEBUG HTML RESPONSE] ---');
        console.error(response.data.toString()); // Log lengkap di terminal VPS
        throw new Error('SERVER_RETURNED_HTML');
      }
      
      const buffer = Buffer.from(response.data, 'binary');
      
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      
      await bot.sendVideo(chatId, buffer, {
        caption: `🎬 *BRAT Video*\n━━━━━━━━━━━━━━━━━━━━\n\n📝 Text: \`${text}\``,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      // Hapus pesan loading jika gagal
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      let errorDisplay = 'Terjadi kesalahan sistem.';

      // LOGIKA PENANGANAN ERROR YANG AMAN (TIDAK AKAN CRASH)
      if (error.message === 'SERVER_RETURNED_HTML') {
        errorDisplay = 'API Key salah, Limit habis, atau Server sedang Maintenance.';
      } else if (error.message === 'EMPTY_RESPONSE') {
        errorDisplay = 'Server API tidak memberikan respon apa pun.';
      } else if (error.response) {
        // Error dari server (404, 500, dll)
        errorDisplay = `API Error: ${error.response.status}`;
        console.error('Server Response Error:', error.response.status);
      } else if (error.request) {
        // Error jaringan (tidak ada respon)
        errorDisplay = 'Gagal terhubung ke API. Cek koneksi VPS.';
        console.error('Network Error:', error.message);
      } else {
        errorDisplay = error.message;
      }

      console.error('Final Error Catch:', error.message);

      await bot.sendMessage(chatId,
        '❌ *Failed to generate brat video!*\n\n' +
        `*Reason:* \`${errorDisplay}\`\n\n` +
        'Cek log terminal untuk detail teknis.',
        { parse_mode: 'Markdown' }
      );
    }
  }
};
