const axios = require('axios');

module.exports = {
  name: 'bratvid',
  version: '2.0.0',
  description: 'Generate brat-style animated video',
  author: 'Plugin Developer',
  commands: ['bratvid', 'bratv'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/bratvid <text>`\n\n' +
        '*Example:*\n' +
        '`/bratvid club classics`\n' +
        '`/bratv brat summer`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const text = args.join(' ');
    
    if (text.length > 100) {
      return bot.sendMessage(chatId, '❌ Text too long! Maximum 100 characters.');
    }
    
    let statusMsg;
    try {
      statusMsg = await bot.sendMessage(chatId, '🎬 Generating brat video...');
      
      const apiKey = process.env.BETABOTZ_API || '';
      const apiUrl = `https://api.betabotz.eu.org/api/maker/bratvideo?text=${encodeURIComponent(text)}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer' // Kita minta data mentah (buffer)
      });

      // Cek apakah responnya sebenarnya HTML (biasanya diawali '<!DOCTYPE' atau '<html')
      const firstFewBytes = response.data.slice(0, 15).toString().toLowerCase();
      if (firstFewBytes.includes('<html') || firstFewBytes.includes('<!doc')) {
        throw new Error('RECEIVE_HTML_INSTEAD_OF_VIDEO');
      }
      
      const buffer = Buffer.from(response.data, 'binary');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎬 *BRAT Video*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                      `📝 Text: ${text}`;
      
      await bot.sendVideo(chatId, buffer, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      if (statusMsg) await bot.deleteMessage(chatId, statusMsg.message_id);

      // --- LOGIKA DECODE ERROR ---
      let errorDetail = error.message;

      if (error.response?.data instanceof Buffer || error.message === 'RECEIVE_HTML_INSTEAD_OF_VIDEO') {
        // Jika ada buffer error, ubah ke string teks agar bisa dibaca di console
        const htmlError = error.response?.data?.toString('utf-8') || 'Cloudflare/Server Error (HTML)';
        console.error('--- [DECODE ERROR HTML] ---');
        console.error(htmlError); // Ini akan muncul di terminal kamu
        console.error('---------------------------');
        errorDetail = 'API returned HTML (Possible 404, Rate Limit, or Invalid API Key)';
      } else {
        console.error('Brat video generation error:', error.message);
      }

      await bot.sendMessage(chatId,
        '❌ *Failed to generate brat video!*\n\n' +
        `*Message:* \`${errorDetail}\`\n\n` +
        'Silakan cek console untuk detail error HTML.',
        { parse_mode: 'Markdown' }
      );
    }
  }
};
