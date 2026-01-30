module.exports = {
    name: 'plugin-search',
    version: '1.0.0',
    description: 'Search for detailed plugin information and suggest if typo',
    commands: ['searchpl', 'plinfo'],

    async execute(bot, msg, args, botInstance) {
        const chatId = msg.chat.id;
        const query = args[0]?.toLowerCase();

        if (!query) {
            return bot.sendMessage(chatId, '❌ *Wrong Format!* Use: `/searchpl <plugin_name>`', { parse_mode: 'Markdown' });
        }

        const plugins = Array.from(botInstance.plugins.values());
        
        // 1. Search for exact match
        let targetPlugin = plugins.find(p => p.name.toLowerCase() === query);

        // 2. If not found, search for closest suggestion (Fuzzy Search)
        if (!targetPlugin) {
            let suggestions = plugins.map(p => {
                return {
                    plugin: p,
                    distance: this.levenshtein(query, p.name.toLowerCase())
                };
            });

            // Sort by closest distance (smallest number = most similar)
            suggestions.sort((a, b) => a.distance - b.distance);
            
            // Threshold: If distance is too far (> 4), consider it not similar at all
            if (suggestions[0].distance <= 4) {
                const suggestionName = suggestions[0].plugin.name;
                return bot.sendMessage(chatId, `❓ Plugin \`${query}\` not found.\n\nDid you mean: */searchpl ${suggestionName}*?`, { 
                    parse_mode: 'Markdown' 
                });
            } else {
                return bot.sendMessage(chatId, `❌ Plugin \`${query}\` not found in database.`);
            }
        }

        // 3. Display Detailed Information
        const info = `📖 *PLUGIN INFORMATION*\n━━━━━━━━━━━━━━━━━━━━\n• *Name:* \`${targetPlugin.name}\`\n• *Version:* \`${targetPlugin.version || '1.0.0'}\`\n• *Author:* \`${targetPlugin.author || 'Unknown'}\`\n• *Description:* _${targetPlugin.description || 'No description available.'}_\n\n🚀 *Commands:*\n${targetPlugin.commands.map(cmd => `• /${cmd}`).join('\n')}\n\n💡 *Usage:*\nUse prefix \`${botInstance.config.prefix}\` followed by one of the commands above.`;

        return bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
    },

    // Levenshtein algorithm to calculate word similarity
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
