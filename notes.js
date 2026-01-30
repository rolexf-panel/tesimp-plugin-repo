const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, '../database');
const dbPath = path.join(dirPath, 'notes.json');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const readDB = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dbPath));
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

module.exports = {
  name: 'notes',
  version: '2.0.0',
  description: 'Save notes via reply (Supports Media)',
  commands: ['notes'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const ownerId = process.env.OWNER_ID;
    const subCommand = args[0]?.toLowerCase();
    const db = readDB();

    // 1. /notes add <note_name> (REPLY REQUIRED)
    if (subCommand === 'add') {
      const noteName = args.slice(1).join(' ');
      if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ *Failed!* Reply to a message you want to save as a note.');
      }
      if (!noteName) {
        return bot.sendMessage(chatId, '❌ *Wrong Format!* Use: `/notes add <note name>` while replying to a message.');
      }

      if (!db[userId]) db[userId] = [];
      
      const replyMsg = msg.reply_to_message;
      const newNote = {
        id: Math.floor(1000 + Math.random() * 9000),
        name: noteName,
        message_id: replyMsg.message_id,
        chat_id: chatId, // Saved for copyMessage feature
        date: new Date().toLocaleString('en-US')
      };

      db[userId].push(newNote);
      writeDB(db);
      return bot.sendMessage(chatId, `✅ *Success!* Note \`${noteName}\` saved.\nID: \`${newNote.id}\``, { parse_mode: 'Markdown' });
    }

    // 2. /notes list
    if (subCommand === 'list') {
      const userNotes = db[userId] || [];
      if (userNotes.length === 0) return bot.sendMessage(chatId, '📭 You have no notes.');

      let text = `📝 *Your Notes List*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      userNotes.forEach((n, i) => {
        text += `${i + 1}. *${n.name}* (ID: \`${n.id}\`)\n`;
      });
      text += `\n💡 _Use "/notes get <ID>"_`;
      return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 3. /notes get <id> (USING COPYMESSAGE)
    if (subCommand === 'get') {
      const noteId = args[1];
      const note = (db[userId] || []).find(n => n.id.toString() === noteId);

      if (!note) return bot.sendMessage(chatId, '❌ Note ID not found.');
      
      try {
        // Send back the original message along with its attachment
        await bot.copyMessage(chatId, note.chat_id, note.message_id);
      } catch (e) {
        bot.sendMessage(chatId, '❌ *Failed to retrieve media.* Original message may have been deleted or bot does not have access to that chat.');
      }
      return;
    }

    // 4. /notes del <id>
    if (subCommand === 'del') {
      const noteId = args[1];
      if (!db[userId]) return bot.sendMessage(chatId, '❌ You have no notes.');

      const initialLength = db[userId].length;
      db[userId] = db[userId].filter(n => n.id.toString() !== noteId);

      if (db[userId].length === initialLength) return bot.sendMessage(chatId, '❌ ID not found.');

      writeDB(db);
      return bot.sendMessage(chatId, '🗑️ Note successfully deleted.');
    }

    // 5. /notes get-user <user_id> (Owner)
    if (subCommand === 'get-user') {
      if (userId !== ownerId) return bot.sendMessage(chatId, '🚫 Owner only.');
      const targetId = args[1];
      const targetNotes = db[targetId] || [];
      if (targetNotes.length === 0) return bot.sendMessage(chatId, `📭 User \`${targetId}\` has no notes.`);

      let text = `👤 *User Notes:* \`${targetId}\`\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      targetNotes.forEach((n, i) => {
        text += `${i + 1}. *${n.name}* (ID: \`${n.id}\`) - ${n.date}\n`;
      });
      return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // Default Help
    const helpText = `📝 *Notes System v2.0*
━━━━━━━━━━━━━━━━━━━━
• \`/notes add <name>\` (Reply to message/media)
• \`/notes list\` (View list)
• \`/notes get <id>\` (Retrieve note)
• \`/notes del <id>\` (Delete note)`;

    bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
};
