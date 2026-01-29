const os = require('os');
const axios = require('axios');

module.exports = {
  name: 'ping',
  version: '1.2.1',
  description: 'Cek status semua bot dan server',
  commands: ['ping', 'speed', 'status'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const startMain = Date.now();
    
    const sentMsg = await bot.sendMessage(chatId, '📶 *Mengecek status sistem...*', { parse_mode: 'Markdown' });
    const latencyMain = Date.now() - startMain;

    // Ambil token dari process.env atau dari config botInstance jika tersedia
    const reqToken = process.env.REQ_BOT_TOKEN || (botInstance.config && botInstance.config.reqBotToken);
    
    let statusReq = "🔴 Tidak Terkonfigurasi";
    let latencyReq = "N/A";

    if (reqToken) {
        statusReq = "🟡 Menghubungkan...";
        try {
            const startReq = Date.now();
            // Memanggil API Telegram langsung untuk cek kesehatan bot request
            const res = await axios.get(`https://api.telegram.org/bot${reqToken}/getMe`, { timeout: 3000 });
            
            if (res.data && res.data.ok) {
                latencyReq = Date.now() - startReq;
                const safeUsername = res.data.result.username.replace(/_/g, '\\_');
                statusReq = `🟢 Online (@${safeUsername})`;
            } else {
                statusReq = "🔴 Token Tidak Valid";
            }
        } catch (e) {
            statusReq = "🔴 Offline / API Timeout";
            console.error("Ping Request Bot Error:", e.message);
        }
    }

    // Info RAM & System
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);
    const totalGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const text = `
🏓 *PONG! STATUS SISTEM*
━━━━━━━━━━━━━━━━━━━━

🤖 *Main Bot (Utama)*
• Status: 🟢 Online
• Speed: \`${latencyMain}ms\`
• Runtime: \`${botInstance.getRuntime()}\`

📩 *Request Bot*
• Status: ${statusReq}
• Speed: \`${latencyReq}${latencyReq !== 'N/A' ? 'ms' : ''}\`

💻 *Server VPS Status*
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
