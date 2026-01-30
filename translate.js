const axios = require('axios');

module.exports = {
  name: 'translate',
  version: '2.0.1',
  description: 'Translate text using a more stable LibreTranslate mirror',
  author: 'Upgraded Plugin',
  commands: ['translate', 'tr', 'tl'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    // Support for reply: If user replies to a message, get text from replied message
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
        'Or reply to message with `/tr <lang>`\n\n' +
        '*Example:*\n' +
        '`/tr en Hello how are you`',
        { parse_mode: 'Markdown' }
      );
    }
    
    let statusMsg;
    try {
      statusMsg = await bot.sendMessage(chatId, '🌐 *Translating...*', { parse_mode: 'Markdown' });
      
      // Using a mirror that's usually more stable for public use
      const baseUrl = process.env.LIBRETRANSLATE_URL || 'https://translate.argosopentech.com';
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/translate`;
      
      const response = await axios.post(apiUrl, {
        q: text,
        source: 'auto',
        target: targetLang,
        format: 'text',
        api_key: "" // Leave empty if you don't have one
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0' // Masquerade as browser to avoid simple blocks
        },
        timeout: 10000 // Timeout 10 seconds to avoid hanging
      });
      
      const translated = response.data?.translatedText;
      
      if (!translated) {
        // If API responds but format is different (error from server)
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
                         '• Make sure language code is correct (en, id, jp, etc)\n' +
                         '• Server might be busy/down\n' +
                         '• Use shorter text';

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
