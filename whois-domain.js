const whois = require('whois-json');

module.exports = {
  name: 'whois-domain',
  version: '1.0.0',
  description: 'Get WHOIS information for a domain',
  commands: ['whois', 'domaininfo'],

  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const domain = args[0];

    if (!domain) {
      return bot.sendMessage(chatId, '❌ Usage: /whois example.com');
    }

    try {
      const data = await whois(domain);

      const text = `
🌐 *DOMAIN WHOIS*

• Domain: \`${domain}\`
• Registrar: \`${data.registrar || 'N/A'}\`
• Created: \`${data.creationDate || 'N/A'}\`
• Expires: \`${data.registryExpiryDate || 'N/A'}\`
• Status: \`${Array.isArray(data.domainStatus) ? data.domainStatus.join(', ') : 'N/A'}\`
      `.trim();

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
      bot.sendMessage(chatId, '❌ Failed to fetch WHOIS data.');
    }
  }
};
