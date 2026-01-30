module.exports = {
  name: 'file-metadata',
  version: '1.0.0',
  description: 'Get metadata from replied file',
  commands: ['fileinfo', 'metadata'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
      return bot.sendMessage(chatId, '❌ Reply to a file.');
    }

    const file = msg.reply_to_message.document;

    const text = `
📄 *FILE METADATA*

• Name: \`${file.file_name}\`
• Size: \`${(file.file_size / 1024).toFixed(2)} KB\`
• MIME: \`${file.mime_type}\`
• File ID: \`${file.file_id}\`
    `.trim();

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
};
