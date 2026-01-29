const axios = require('axios');

module.exports = {
  name: 'ip-info',
  version: '1.0.0',
  description: 'Get information about IP addresses',
  author: 'Bot Developer',
  commands: ['ip', 'ipinfo', 'lookup'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    let ip = args[0];
    
    // If no IP provided, show user's IP
    if (!ip) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/ip <ip_address>`\n' +
        '`/ipinfo <ip>`\n\n' +
        '*Examples:*\n' +
        '`/ip 8.8.8.8`\n' +
        '`/ipinfo 1.1.1.1`\n' +
        '`/lookup 142.250.185.46`',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return bot.sendMessage(chatId, '❌ Invalid IP address format!');
    }
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Looking up IP information...');
      
      // Using ip-api.com - free and no API key required
      const apiUrl = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.status === 'success') {
        const data = response.data;
        
        let message = `🌐 *IP Information*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🔢 *IP Address:* \`${data.query}\`\n\n`;
        
        message += `🌍 *Location:*\n`;
        message += `• Country: ${data.country} ${this.getFlagEmoji(data.countryCode)}\n`;
        if (data.regionName) message += `• Region: ${data.regionName}\n`;
        if (data.city) message += `• City: ${data.city}\n`;
        if (data.zip) message += `• ZIP: ${data.zip}\n`;
        if (data.timezone) message += `• Timezone: ${data.timezone}\n`;
        
        message += `\n📍 *Coordinates:*\n`;
        message += `• Latitude: ${data.lat}\n`;
        message += `• Longitude: ${data.lon}\n`;
        
        message += `\n🏢 *Network:*\n`;
        if (data.isp) message += `• ISP: ${data.isp}\n`;
        if (data.org) message += `• Organization: ${data.org}\n`;
        if (data.as) message += `• AS: ${data.as}\n`;
        
        const keyboard = [
          [
            { text: '🗺️ View on Map', url: `https://www.google.com/maps?q=${data.lat},${data.lon}` }
          ]
        ];
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
        
      } else {
        throw new Error(response.data.message || 'IP lookup failed');
      }
      
    } catch (error) {
      console.error('IP info error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to get IP information!\n\n' +
        `Error: ${error.message}\n\n` +
        'Please check:\n' +
        '• IP address is valid\n' +
        '• IP is public (not private like 192.168.x.x)\n' +
        '• Try again later'
      );
    }
  },
  
  getFlagEmoji(countryCode) {
    if (!countryCode) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }
};
