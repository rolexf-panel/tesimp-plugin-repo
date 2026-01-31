const axios = require('axios');

module.exports = {
  name: 'bratvid',
  version: '2.1.0',
  description: 'Generate brat-style animated video with safety error handling',
  author: 'Plugin Developer',
  commands: ['bratvid', 'bratv'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // 1. Validasi input
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
      // 2. Kirim status loading
      statusMsg = await bot.sendMessage(chatId, '🎬 *Generating brat video...*', { parse_mode: 'Markdown' });
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/maker/bratvideo?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      // 3. Request ke API
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // Timeout 30 detik agar tidak gantung
      });

      // 4. Cek apakah yang diterima HTML (Error page) atau Video
      const firstBytes = response.data.slice(0, 15).toString().toLowerCase();
      if (firstBytes.includes('<html') || firstBytes.includes('<!doc')) {
        // Buang ke catch dengan pesan khusus
        const errorHtml = response.data.toString('utf-8');
        throw new Error(`API_RETURNED_HTML: ${errorHtml.substring(0, 500)}`); 
      }
      
      const buffer = Buffer.from(response.data, 'binary');
      
      // 5. Hapus pesan loading dan kirim video
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      
      const caption = `🎬 *BRAT Video*\n━━━━━━━━━━━━━━━━━━━━\n\n📝 Text: \`${text}\``;
      
      await bot.sendVideo(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      // Hapus pesan loading jika gagal
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      let errorDisplay = error.message;

      // Debugging detail di terminal VPS
      console.error('--- [ERROR LOG] ---');
      if (error.message.includes('API_RETURNED_HTML')) {
        console.error('Server mengembalikan HTML (Kemungkinan API Key salah atau Rate Limit).');
        console.error('Detail:', error.message.replace('API_RETURNED_HTML: ', ''));
        errorDisplay = 'API returned HTML (Check API Key or limit)';
      } else if (error.response) {
        // Jika ada response tapi status code bukan 2xx
        const dataStr = error.response.data instanceof Buffer ? error.response.data.toString() : error.response.data;
        console.error('Response Error:', dataStr);
        errorDisplay = `Server Error: ${error.response.status}`;
      } else {
        // Jika tidak ada response (Network error)
        console.error('Network/System Error:', error.message);
      }
      console.error('-------------------');

      await bot.sendMessage(chatId,
        '❌ *Failed to generate brat video!*\n\n' +
        `*Error:* \`${errorDisplay}\`\n\n` +
        'Pastikan API Key sudah benar di file `.env`',
        { parse_mode: 'Markdown' }
      );
    }
  }
};
