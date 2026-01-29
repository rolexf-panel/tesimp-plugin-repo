const localMessages = [
  {
    message: 'Janganlah kau bandingkan prosesmu dengan orang lain. Setiap orang punya garis waktunya masing-masing.',
    creator: 'Hazel'
  },
  {
    message: 'Janganlah terlalu keras pada dirimu sendiri. Kamu sudah melakukan yang terbaik dengan apa yang kamu punya.',
    creator: 'Hazel'
  },
  {
    message: 'Janganlah berhenti hanya karena lelah. Berhentilah jika tujuanmu sudah tercapai.',
    creator: 'Hazel'
  },
  {
    message: 'Janganlah lupa istirahat. Produktif itu penting, tapi waras lebih penting.',
    creator: 'Hazel'
  }
];

module.exports = {
  name: 'janganlah',
  version: '2.0.0',
  description: 'Mendapatkan kata-kata nasihat lokal (tanpa API)',
  commands: ['janganlah', 'nasihat'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const loadingMsg = await bot.sendMessage(chatId, '💭 *Merenung sejenak...*', { parse_mode: 'Markdown' });

    try {
      const random = localMessages[Math.floor(Math.random() * localMessages.length)];

      const text = `
📜 *PESAN BIJAK*
━━━━━━━━━━━━━━━━━━━━
"${random.message}"

— _${random.creator || 'Hazel'}_
      `.trim();

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error Janganlah Plugin:', error.message);
      await bot.editMessageText('⚠️ Gagal memproses pesan bijak.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }
  }
};
