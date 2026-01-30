module.exports = {
  name: 'plugin-search',
  version: '1.1.0',
  description: 'Search for detailed plugin information and suggest closest plugins (improved accuracy)',
  commands: ['searchpl', 'plinfo'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const query = (args || []).join(' ').trim().toLowerCase();

    if (!query) {
      return bot.sendMessage(
        chatId,
        '❌ *Wrong Format!* Use: `/searchpl <plugin_name>`',
        { parse_mode: 'Markdown' }
      );
    }

    const plugins = Array.from(botInstance.plugins.values()).filter(Boolean);

    // Helper: safe access strings
    const nameOf = p => (p && p.name ? String(p.name) : '');
    const versionOf = p => (p && p.version ? String(p.version) : '1.0.0');
    const descOf = p => (p && p.description ? String(p.description).replace(/`/g, "'") : 'No description available.');
    const authorOf = p => (p && p.author ? String(p.author) : 'Unknown');
    const commandsOf = p => Array.isArray(p.commands) ? p.commands.map(String) : [];

    // 1) Exact match by name
    let target = plugins.find(p => nameOf(p).toLowerCase() === query);

    // 1b) Exact match by command (any command equals query)
    if (!target) {
      target = plugins.find(p => commandsOf(p).some(c => c.toLowerCase() === query));
    }

    if (target) {
      const info = `📖 *PLUGIN INFORMATION*\n━━━━━━━━━━━━━━━━━━━━\n• *Name:* \`${nameOf(target)}\`\n• *Version:* \`${versionOf(target)}\`\n• *Author:* \`${authorOf(target)}\`\n• *Description:* _${descOf(target)}_\n\n🚀 *Commands:*\n${commandsOf(target).map(cmd => `• /${cmd}`).join('\n')}\n\n💡 *Usage:*\nUse prefix \`${(botInstance.config && botInstance.config.prefix) || '/'}\` followed by one of the commands above.`;
      return bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
    }

    // 2) Substring matches (name / commands / description)
    const substringMatches = plugins.filter(p => {
      const name = nameOf(p).toLowerCase();
      const desc = descOf(p).toLowerCase();
      const cmds = commandsOf(p).map(c => c.toLowerCase()).join(' ');
      return name.includes(query) || desc.includes(query) || cmds.includes(query);
    });

    if (substringMatches.length) {
      const list = substringMatches.slice(0, 8).map(p => {
        return `• \`${nameOf(p)}\` — ${descOf(p).slice(0, 80)}\n  -> Use: /searchpl ${nameOf(p)}`;
      }).join('\n\n');

      return bot.sendMessage(
        chatId,
        `🔎 *Partial matches found:*\n\n${list}`,
        { parse_mode: 'Markdown' }
      );
    }

    // 3) Fuzzy match using normalized Levenshtein distance
    const distances = plugins.map(p => {
      const targetName = nameOf(p).toLowerCase();
      const d = this.levenshtein(query, targetName);
      const maxLen = Math.max(query.length, targetName.length, 1);
      const normalized = d / maxLen; // 0 = identical, >0 = more different
      return { p, d, normalized };
    });

    distances.sort((a, b) => a.normalized - b.normalized);

    // dynamic threshold: allow more tolerance for short words
    const top = distances[0];
    const dynamicThreshold = query.length <= 4 ? 0.5 : 0.35;

    if (top && top.normalized <= dynamicThreshold) {
      // Provide top 3 suggestions
      const suggestions = distances.slice(0, 3).map(s => {
        return { name: nameOf(s.p), score: (1 - s.normalized).toFixed(2) };
      });

      const suggestText = suggestions.map(s => `• \`${s.name}\` (similarity ${s.score})\n  -> Use: /searchpl ${s.name}`).join('\n\n');

      return bot.sendMessage(
        chatId,
        `❓ Plugin \`${query}\` not found.\n\nDid you mean one of these?\n\n${suggestText}`,
        { parse_mode: 'Markdown' }
      );
    }

    // Nothing found
    return bot.sendMessage(chatId, `❌ Plugin \`${query}\` not found in database.`, { parse_mode: 'Markdown' });
  },

  // Levenshtein algorithm (classic)
  levenshtein(a, b) {
    a = a || '';
    b = b || '';
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => Array(a.length + 1).fill(0));
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    return matrix[b.length][a.length];
  }
};

