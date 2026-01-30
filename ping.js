const os = require('os');
const axios = require('axios');

module.exports = {
  name: 'ping',
  version: '1.2.1',
  description: 'Check status of all bots and server',
  commands: ['ping', 'speed', 'status'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const startMain = Date.now();
    
    const sentMsg = await bot.sendMessage(chatId, '📶 *Checking system status...*', { parse_mode: 'Markdown' });
    const latencyMain = Date.now() - startMain;

    // Get token from process.env or from config botInstance if available
    const reqToken = process.env.REQ_BOT_TOKEN || (botInstance.config && botInstance.config.reqBotToken);
    
    let statusReq = "🔴 Not Configured";
    let latencyReq = "N/A";

    if (reqToken) {
        statusReq = "🟡 Connecting...";
        try {
            const startReq = Date.now();
            // Call Telegram API directly to check request bot health
            const res = await axios.get(`https://api.telegram.org/bot${reqToken}/getMe`, { timeout: 3000 });
            
            if (res.data && res.data.ok) {
                latencyReq = Date.now() - startReq;
                const safeUsername = res.data.result.username.replace(/_/g, '\\_');
                statusReq = `🟢 Online (@${safeUsername})`;
            } else {
                statusReq = "🔴 Invalid Token";
            }
        } catch (e) {
            statusReq = "🔴 Offline / API Timeout";
            console.error("Ping Request Bot Error:", e.message);
        }
    }

    // RAM & System Info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);
    const totalGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const text = `
🏓 *PONG! SYSTEM STATUS*
━━━━━━━━━━━━━━━━━━━━

🤖 *Main Bot*
• Status: 🟢 Online
• Speed: \`${latencyMain}ms\`
• Runtime: \`${botInstance.getRuntime()}\`

📩 *Request Bot*
• Status: ${statusReq}
• Speed: \`${latencyReq}${latencyReq !== 'N/A' ? 'ms' : ''}\`

💻 *VPS Server Status*
• RAM: \`${usedGB}GB / ${totalGB}GB (${memPercent}%)\`
• Platform: \`${os.platform()} ${os.arch()}\`
• Time: \`${botInstance.getTime()}\`

📡 *Plugins:* \`${botInstance.plugins.size}\` Loaded
    `.trim();

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: sentMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
};
