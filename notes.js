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
  description: 'Simpan catatan via reply (Support Media)',
  commands: ['notes'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const ownerId = process.env.OWNER_ID;
    const subCommand = args[0]?.toLowerCase();
    const db = readDB();

    // 1. /notes add <nama_catatan> (REPLY REQUIRED)
    if (subCommand === 'add') {
      const noteName = args.slice(1).join(' ');
      if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ *Gagal!* Balas (reply) ke pesan yang ingin disimpan sebagai catatan.');
      }
      if (!noteName) {
        return bot.sendMessage(chatId, '❌ *Format Salah!* Gunakan: `/notes add <nama catatan>` sambil membalas pesan.');
      }

      if (!db[userId]) db[userId] = [];
      
      const replyMsg = msg.reply_to_message;
      const newNote = {
        id: Math.floor(1000 + Math.random() * 9000),
        name: noteName,
        message_id: replyMsg.message_id,
        chat_id: chatId, // Disimpan untuk fitur copyMessage
        date: new Date().toLocaleString('id-ID')
      };

      db[userId].push(newNote);
      writeDB(db);
      return bot.sendMessage(chatId, `✅ *Berhasil!* Catatan \`${noteName}\` disimpan.\nID: \`${newNote.id}\``, { parse_mode: 'Markdown' });
    }

    // 2. /notes list
    if (subCommand === 'list') {
      const userNotes = db[userId] || [];
      if (userNotes.length === 0) return bot.sendMessage(chatId, '📭 Kamu tidak punya catatan.');

      let text = `📝 *Daftar Catatan Kamu*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      userNotes.forEach((n, i) => {
        text += `${i + 1}. *${n.name}* (ID: \`${n.id}\`)\n`;
      });
      text += `\n💡 _Gunakan "/notes get <ID>"_`;
      return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 3. /notes get <id> (MENGGUNAKAN COPYMESSAGE)
    if (subCommand === 'get') {
      const noteId = args[1];
      const note = (db[userId] || []).find(n => n.id.toString() === noteId);

      if (!note) return bot.sendMessage(chatId, '❌ ID Catatan tidak ditemukan.');
      
      try {
        // Mengirim kembali pesan yang asli beserta attachmentnya
        await bot.copyMessage(chatId, note.chat_id, note.message_id);
      } catch (e) {
        bot.sendMessage(chatId, '❌ *Gagal mengambil media.* Pesan asli mungkin sudah dihapus atau bot tidak memiliki akses ke chat tersebut.');
      }
      return;
    }

    // 4. /notes del <id>
    if (subCommand === 'del') {
      const noteId = args[1];
      if (!db[userId]) return bot.sendMessage(chatId, '❌ Kamu tidak punya catatan.');

      const initialLength = db[userId].length;
      db[userId] = db[userId].filter(n => n.id.toString() !== noteId);

      if (db[userId].length === initialLength) return bot.sendMessage(chatId, '❌ ID tidak ditemukan.');

      writeDB(db);
      return bot.sendMessage(chatId, '🗑️ Catatan berhasil dihapus.');
    }

    // 5. /notes get-user <id_user> (Owner)
    if (subCommand === 'get-user') {
      if (userId !== ownerId) return bot.sendMessage(chatId, '🚫 Khusus Owner.');
      const targetId = args[1];
      const targetNotes = db[targetId] || [];
      if (targetNotes.length === 0) return bot.sendMessage(chatId, `📭 User \`${targetId}\` kosong.`);

      let text = `👤 *Notes User:* \`${targetId}\`\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      targetNotes.forEach((n, i) => {
        text += `${i + 1}. *${n.name}* (ID: \`${n.id}\`) - ${n.date}\n`;
      });
      return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // Default Help
    const helpText = `📝 *Notes System v2.0*
━━━━━━━━━━━━━━━━━━━━
• \`/notes add <nama>\` (Reply ke pesan/media)
• \`/notes list\` (Lihat daftar)
• \`/notes get <id>\` (Ambil catatan)
• \`/notes del <id>\` (Hapus catatan)`;

    bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
};
