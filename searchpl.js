module.exports = {
    name: 'plugin-search',
    version: '1.0.0',
    description: 'Mencari informasi detail plugin dan memberikan saran jika typo',
    commands: ['searchpl', 'plinfo'],

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const query = args[0]?.toLowerCase();

        if (!query) {
            return bot.sendMessage(chatId, '❌ *Format Salah!* Gunakan: `/searchpl <nama_plugin>`', { parse_mode: 'Markdown' });
        }

        const plugins = Array.from(botInstance.plugins.values());
        
        // 1. Cari kecocokan persis
        let targetPlugin = plugins.find(p => p.name.toLowerCase() === query);

        // 2. Jika tidak ketemu, cari saran terdekat (Fuzzy Search)
        if (!targetPlugin) {
            let suggestions = plugins.map(p => {
                return {
                    plugin: p,
                    distance: this.levenshtein(query, p.name.toLowerCase())
                };
            });

            // Urutkan berdasarkan jarak terdekat (angka terkecil = paling mirip)
            suggestions.sort((a, b) => a.distance - b.distance);
            
            // Threshold: Jika jarak terlalu jauh (> 4), anggap tidak mirip sama sekali
            if (suggestions[0].distance <= 4) {
                const suggestionName = suggestions[0].plugin.name;
                return bot.sendMessage(chatId, `❓ Plugin \`${query}\` tidak ditemukan.\n\nMaksud kamu: */searchpl ${suggestionName}*?`, { 
                    parse_mode: 'Markdown' 
                });
            } else {
                return bot.sendMessage(chatId, `❌ Plugin \`${query}\` tidak ditemukan dalam database.`);
            }
        }

        // 3. Tampilkan Informasi Detail
        const info = `📖 *PLUGIN INFORMATION*
━━━━━━━━━━━━━━━━━━━━
• *Nama:* \`${targetPlugin.name}\`
• *Versi:* \`${targetPlugin.version || '1.0.0'}\`
• *Author:* \`${targetPlugin.author || 'Unknown'}\`
• *Deskripsi:* _${targetPlugin.description || 'Tidak ada deskripsi.'}_

🚀 *Perintah (Commands):*
${targetPlugin.commands.map(cmd => `• /${cmd}`).join('\n')}

💡 *Cara Penggunaan:*
Gunakan prefix \`${botInstance.config.prefix}\` diikuti salah satu perintah di atas.`;

        return bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
    },

    // Algoritma Levenshtein untuk menghitung kemiripan kata
    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
};
