const axios = require('axios');

module.exports = {
  name: 'github',
  version: '2.0.0',
  description: 'Search GitHub users (official API)',
  author: 'Upgraded Plugin',
  commands: ['github', 'gh', 'githubuser'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/github <username>`\n' +
        '`/gh <user>`\n\n' +
        '*Example:*\n' +
        '`/github torvalds`\n' +
        '`/gh octocat`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const username = args[0];
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Searching GitHub...');
      
      const apiUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'TeSimp-Telegram-Bot/2.0 (GitHub plugin)'
        }
      });
      
      const user = response.data;
      
      let message = `💻 *GitHub User*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (user.name) message += `👤 *Name:* ${user.name}\n`;
      message += `🔑 *Username:* ${user.login}\n`;
      
      if (user.bio) message += `📝 *Bio:* ${user.bio}\n`;
      if (user.company) message += `🏢 *Company:* ${user.company}\n`;
      if (user.location) message += `📍 *Location:* ${user.location}\n`;
      if (user.blog) message += `🌐 *Website:* ${user.blog}\n`;
      
      message += `\n📊 *Stats:*\n`;
      message += `📦 *Repositories:* ${user.public_repos}\n`;
      message += `👥 *Followers:* ${user.followers}\n`;
      message += `➕ *Following:* ${user.following}\n`;
      
      if (user.public_gists !== undefined) {
        message += `📌 *Gists:* ${user.public_gists}\n`;
      }
      
      if (user.created_at) {
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        message += `\n📅 *Joined:* ${joinDate}\n`;
      }
      
      message += `\n🔗 [View Profile](https://github.com/${user.login})`;
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      if (user.avatar_url) {
        await bot.sendPhoto(chatId, user.avatar_url, {
          caption: message,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      }
      
    } catch (error) {
      console.error('GitHub search error:', error.response?.status, error.message);
      
      if (error.response && error.response.status === 404) {
        return bot.sendMessage(chatId,
          `❌ GitHub user not found: *${username}*\n\n` +
          'Please check the username and try again.',
          { parse_mode: 'Markdown' }
        );
      }
      
      await bot.sendMessage(chatId,
        '❌ Failed to search GitHub!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};