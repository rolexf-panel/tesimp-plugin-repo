module.exports = {
  name: 'daily-focus',
  version: '1.0.0',
  description: 'Generate a daily focus prompt',
  commands: ['focus', 'dailyfocus'],

  async execute(bot, msg) {
    const chatId = msg.chat.id;

    const prompts = [
      'What is the ONE task that moves the needle today?',
      'What are you avoiding that you must confront?',
      'What would make today a win?',
      'What distraction will you eliminate today?',
      'What skill will compound if practiced today?'
    ];

    const pick = prompts[Math.floor(Math.random() * prompts.length)];

    bot.sendMessage(chatId, `🎯 *DAILY FOCUS*\n\n${pick}`, {
      parse_mode: 'Markdown'
    });
  }
};
