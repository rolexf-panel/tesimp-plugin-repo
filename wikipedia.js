const axios = require('axios');

module.exports = {
  name: 'wikipedia',
  version: '2.0.0',
  description: 'Search Wikipedia articles (official API)',
  author: 'Upgraded Plugin',
  commands: ['wiki', 'wikipedia'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/wiki <topic>`\n' +
        '`/wikipedia <search>`\n\n' +
        '*Example:*\n' +
        '`/wiki Albert Einstein`\n' +
        '`/wikipedia Python programming`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const query = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📚 Searching Wikipedia...');

      // 1. Cari judul yang paling cocok
      const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          utf8: '',
          format: 'json',
          srlimit: 1
        },
        headers: {
          'User-Agent': 'TeSimp-Telegram-Bot/2.0 (Wikipedia plugin)'
        }
      });

      const searchResults = searchRes.data?.query?.search || [];
      if (searchResults.length === 0) {
        return bot.editMessageText(
          `❌ No Wikipedia article found for: *${query}*\n\n` +
          'Try different keywords!',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }

      const title = searchResults[0].title;

      // 2. Ambil summary
      const summaryRes = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        {
          headers: {
            'User-Agent': 'TeSimp-Telegram-Bot/2.0 (Wikipedia plugin)'
          }
        }
      );

      const summary = summaryRes.data || {};

      let message = `📚 *Wikipedia*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📖 *${summary.title || title}*\n\n`;

      let extract = summary.extract || '';

      if (extract.length > 1000) {
        extract = extract.substring(0, 1000) + '...';
      }

      message += extract || '_No summary available for this article._';

      const url =
        summary.content_urls?.desktop?.page ||
        summary.content_urls?.mobile?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      if (url) {
        message += `\n\n🔗 [Read More](${url})`;
      }
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });
      
    } catch (error) {
      console.error('Wikipedia search error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to search Wikipedia!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};