const axios = require('axios');

module.exports = {
  name: 'translate',
  version: '2.0.1',
  description: 'Translate text using a more stable LibreTranslate mirror',
  author: 'Upgraded Plugin',
  commands: ['translate', 'tr', 'tl'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Support untuk reply: Jika user reply pesan, ambil teks dari pesan yang di-reply
    let targetLang = args[0]?.toLowerCase();
    let text = args.slice(1).join(' ');

    if (msg.reply_to_message && args.length >= 1) {
      text = msg.reply_to_message.text || msg.reply_to_message.caption;
      targetLang = args[0].toLowerCase();
    }

    if (!targetLang || !text) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/tr <lang> <text>`\n' +
        'Atau balas pesan dengan `/tr <lang>`\n\n' +
        '*Example:*\n' +
        '`/tr en Halo apa kabar`',
        { parse_mode: 'Markdown' }
      );
    }
    
    let statusMsg;
    try {
      statusMsg = await bot.sendMessage(chatId, '🌐 *Translating...*', { parse_mode: 'Markdown' });
      
      // Menggunakan mirror yang biasanya lebih stabil untuk publik
      const baseUrl = process.env.LIBRETRANSLATE_URL || 'https://translate.argosopentech.com';
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/translate`;
      
      const response = await axios.post(apiUrl, {
        q: text,
        source: 'auto',
        target: targetLang,
        format: 'text',
        api_key: "" // Biarkan kosong jika tidak punya
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0' // Menyamarkan sebagai browser untuk menghindari blokir simpel
        },
        timeout: 10000 // Timeout 10 detik agar tidak ngehang
      });
      
      const translated = response.data?.translatedText;
      
      if (!translated) {
        // Jika API membalas tapi formatnya beda (error dari server)
        const errorDetail = response.data?.error || 'Invalid response from API';
        throw new Error(errorDetail);
      }
      
      let message = `🌐 *Translation*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🔤 *To:* \`${targetLang.toUpperCase()}\`\n\n`;
      message += `📝 *Original:*\n\`${text}\`\n\n`;
      message += `💬 *Result:*\n${translated}`;
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('Translation error:', error.response?.data || error.message);
      
      const errorMsg = error.response?.data?.error || error.message;
      
      const failMessage = '❌ *Translation Failed!*\n\n' +
                         `*Error:* \`${errorMsg}\`\n\n` +
                         '• Pastikan kode bahasa benar (en, id, jp, dll)\n' +
                         '• Server mungkin sedang sibuk/down\n' +
                         '• Gunakan teks yang lebih pendek';

      if (statusMsg) {
        await bot.editMessageText(failMessage, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(chatId, failMessage, { parse_mode: 'Markdown' });
      }
    }
  }
};