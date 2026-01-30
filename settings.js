// plugins/settings.js
module.exports = {
  name: 'settings',
  version: '1.0.2',
  description: 'Settings handler with smart edit (Photo/Text support)',
  commands: ['settings'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '⚙️ *Settings Menu*', {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: this.getSettingsKeyboard() }
    });
  },

  getSettingsKeyboard() {
    return [
      [{ text: '📊 System Info', callback_data: 'settings:info' }],
      [{ text: '👤 User Profile', callback_data: 'settings:profile' }],
      [{ text: '◀️ Back to Menu', callback_data: 'back_to_menu' }]
    ];
  },

  async handleCallback(bot, query, botInstance) {
    const { data, message } = query;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    // Only handle settings callbacks
    if (!data.startsWith('settings:')) return;

    const action = data.split(':')[1];
    let text = '';

    if (action === 'main') {
      text = '⚙️ *Bot Settings*\n\nPlease select a category below:';
    } else if (action === 'info') {
      text = `🖥️ *System Information*\n━━━━━━━━━━━━━━━━━━━━\n• Uptime: \`${botInstance.getRuntime()}\`\n• Time: \`${botInstance.getTime()}\`\n• Platform: \`${require('os').platform()}\``;
    } else if (action === 'profile') {
      text = `👤 *Your Profile*\n━━━━━━━━━━━━━━━━━━━━\n• Name: ${query.from.first_name}\n• ID: \`${query.from.id}\`\n• Status: ${botInstance.isOwner(query.from.id) ? '👑 Owner' : '👤 User'}`;
    }

    try {
      const options = {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: this.getSettingsKeyboard() }
      };

      // RESCUE LOGIC:
      // If message has photo, use editMessageCaption
      // If not, use editMessageText
      if (message.photo || message.caption !== undefined) {
        await bot.editMessageCaption(text, options);
      } else {
        await bot.editMessageText(text, options);
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error('Settings Callback Error:', err.message);
      // If still error due to type difference, try forcing delete and send new (last option)
      await bot.answerCallbackQuery(query.id, { text: "Failed to process settings menu." });
    }
  }
};
