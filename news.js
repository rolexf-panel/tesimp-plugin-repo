const axios = require('axios');

module.exports = {
  name: 'news',
  version: '1.0.0',
  description: 'Get latest news from various sources',
  author: 'Bot Developer',
  commands: ['news', 'berita', 'headlines'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    // News category
    let category = args[0] || 'general';
    const validCategories = ['general', 'business', 'technology', 'science', 'health', 'sports', 'entertainment'];
    
    if (!validCategories.includes(category.toLowerCase())) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/news [category]`\n\n' +
        '*Categories:*\n' +
        '• general (default)\n' +
        '• business\n' +
        '• technology\n' +
        '• science\n' +
        '• health\n' +
        '• sports\n' +
        '• entertainment\n\n' +
        '*Examples:*\n' +
        '`/news` - General news\n' +
        '`/news technology`\n' +
        '`/news sports`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '📰 Fetching latest news...');
      
      // Using NewsAPI.org - requires free API key
      // Alternative: Use RSS feeds from BBC, CNN, etc.
      // For demo, we'll use a mock response. You should get free API key from newsapi.org
      
      const apiKey = process.env.NEWS_API_KEY || 'demo'; // Get your key from newsapi.org
      const apiUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=5&apiKey=${apiKey}`;
      
      // If no API key, use RSS feed instead
      if (apiKey === 'demo') {
        // Use RSS2JSON for BBC News
        const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/rss.xml`;
        const response = await axios.get(rssUrl);
        
        if (response.data && response.data.items) {
          const articles = response.data.items.slice(0, 5);
          
          let message = `📰 *Latest News*\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          
          articles.forEach((article, index) => {
            message += `${index + 1}. *${article.title}*\n`;
            
            if (article.description) {
              const desc = article.description.replace(/<[^>]*>/g, '').substring(0, 150);
              message += `   ${desc}...\n`;
            }
            
            message += `   🔗 [Read more](${article.link})\n\n`;
          });
          
          message += `📅 _Updated: ${new Date().toLocaleString()}_`;
          
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        }
      } else {
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.articles) {
          const articles = response.data.articles;
          
          let message = `📰 *${category.charAt(0).toUpperCase() + category.slice(1)} News*\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          
          articles.forEach((article, index) => {
            message += `${index + 1}. *${article.title}*\n`;
            
            if (article.description) {
              message += `   ${article.description.substring(0, 150)}...\n`;
            }
            
            if (article.source?.name) {
              message += `   📰 Source: ${article.source.name}\n`;
            }
            
            message += `   🔗 [Read more](${article.url})\n\n`;
          });
          
          message += `📅 _Updated: ${new Date().toLocaleString()}_`;
          
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        }
      }
      
    } catch (error) {
      console.error('News error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to fetch news!\n\n' +
        `Error: ${error.message}\n\n` +
        'Note: For better results, add NEWS_API_KEY to environment variables.\n' +
        'Get free API key from: newsapi.org'
      );
    }
  }
};
