const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  name: 'updater',
  version: '1.2.0',
  description: 'Reload and update all plugins automatically',
  commands: ['update', 'reload'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Optional: limit to owner only
    // if (userId !== Number(process.env.OWNER_ID)) return;

    const waitMsg = await bot.sendMessage(chatId, '🔄 *Processing plugin updates...*', { parse_mode: 'Markdown' });

    try {
      const pluginsPath = __dirname; // plugins folder (same folder as this file)
      const updaterFilename = path.basename(__filename);
      // Get all .js files except this updater
      const pluginFiles = fs.readdirSync(pluginsPath)
        .filter(file => file.endsWith('.js') && file !== updaterFilename);

      // Reset command list in bot instance
      botInstance.commands = new Map();

      const now = Date.now();

      // Helper: format relative time (seconds/minutes/hours/days)
      function formatRelativeTime(tsMs) {
        const diff = Math.max(0, now - tsMs);
        const sec = Math.floor(diff / 1000);
        if (sec < 5) return 'just now';
        if (sec < 60) return `${sec} seconds ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min} minutes ago`;
        const hour = Math.floor(min / 60);
        if (hour < 24) return `${hour} hours ago`;
        const day = Math.floor(hour / 24);
        if (day < 7) return `${day} days ago`;
        // older: display date dd-mm-yyyy
        const d = new Date(tsMs);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      }

      let updateLines = [];

      for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);

        let timeDisplay = '';
        try {
          // Preference: use git last commit time if git repo exists
          let tsMs;
          try {
            // This command returns epoch seconds from last commit touching the file
            const gitOut = execSync(`git log -1 --format=%ct -- "${filePath}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
              .toString().trim();
            if (gitOut && /^\d+$/.test(gitOut)) {
              tsMs = Number(gitOut) * 1000;
            }
          } catch (gitErr) {
            // git not available or file not tracked, fallback to mtime
            tsMs = undefined;
          }

          if (!tsMs) {
            const stats = fs.statSync(filePath);
            tsMs = stats.mtime.getTime();
          }

          timeDisplay = formatRelativeTime(tsMs);
        } catch (timeErr) {
          // If something weird, use -unknown-
          timeDisplay = 'unknown time';
          console.error('Error getting time for', file, timeErr);
        }

        // Delete require cache so module is re-required
        try {
          const resolved = require.resolve(filePath);
          if (require.cache[resolved]) delete require.cache[resolved];
        } catch (e) {
          // if require.resolve fails, just continue
        }

        // Try to load plugin
        try {
          const newPlugin = require(filePath);

          if (newPlugin && Array.isArray(newPlugin.commands)) {
            newPlugin.commands.forEach(cmd => {
              // Make sure key is string
              const key = typeof cmd === 'string' ? cmd : JSON.stringify(cmd);
              botInstance.commands.set(key, newPlugin);
            });
            const pluginName = newPlugin.name || path.basename(file, '.js');
            updateLines.push(`• *${pluginName}* (${timeDisplay})`);
          } else {
            // Plugin doesn't have expected commands structure
            const pluginName = (newPlugin && newPlugin.name) ? newPlugin.name : path.basename(file, '.js');
            updateLines.push(`• *${pluginName}* (${timeDisplay}) — _no commands registered_`);
          }
        } catch (err) {
          console.error('Failed to load plugin', file, err);
          updateLines.push(`• ❌ *${path.basename(file, '.js')}* (${timeDisplay}) — failed to load`);
          // don't throw; continue to next plugin
        }
      }

      const updateDetails = updateLines.length ? updateLines.join('\n') : '_No plugins found_';

      const finalText = `✅ *Update Successful!*\n\nTotal *${pluginFiles.length}* plugins have been updated.\n\n*Update Status:*\n${updateDetails}`;

      await bot.editMessageText(finalText, {
        chat_id: chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Updater Error:', error);
      await bot.editMessageText('❌ *Failed to update.* Check console logs for details.', {
        chat_id: chatId,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown'
      });
    }
  }
};

