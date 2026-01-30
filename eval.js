const util = require('util');
const child_process = require('child_process');

module.exports = {
  name: 'eval',
  version: '2.0.0',
  description: 'Execute JavaScript code (Owner Only)',
  commands: ['eval', 'exec', '>'],

  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!botInstance.isOwner(userId)) return; // Silent ignore if not owner

    if (args.length === 0) return bot.sendMessage(chatId, '⚠️ Enter the code to run.');

    const code = args.join(' ');
    const command = msg.text.split(' ')[0].substring(botInstance.config.prefix.length);

    // 1. EXEC (Shell Command) -> example: /exec ls -la
    if (command === 'exec') {
      child_process.exec(code, (error, stdout, stderr) => {
        if (error) return bot.sendMessage(chatId, `❌ Error:\n\`${error.message}\``, { parse_mode: 'Markdown' });
        if (stderr) return bot.sendMessage(chatId, `⚠️ Stderr:\n\`${stderr}\``, { parse_mode: 'Markdown' });
        
        // Split message if too long
        if (stdout.length > 4000) {
          bot.sendDocument(chatId, Buffer.from(stdout), {}, { filename: 'output.txt' });
        } else {
          bot.sendMessage(chatId, `🖥 *Output:*\n\`\`\`\n${stdout}\n\`\`\``, { parse_mode: 'Markdown' });
        }
      });
      return;
    }

    // 2. EVAL (JavaScript) -> example: /eval bot.sendMessage(chatId, 'Test')
    try {
      let evaled = await eval(`(async () => { ${code} })()`);
      
      if (typeof evaled !== 'string') {
        evaled = util.inspect(evaled);
      }

      if (evaled.length > 4000) {
        bot.sendMessage(chatId, '⚠️ Output too long, sent as file.');
        bot.sendDocument(chatId, Buffer.from(evaled), {}, { filename: 'eval_output.js' });
      } else {
        bot.sendMessage(chatId, `📤 *Output:*\n\`\`\`js\n${evaled}\n\`\`\``, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      bot.sendMessage(chatId, `❌ *Error:*\n\`\`\`js\n${err.message}\n\`\`\``, { parse_mode: 'Markdown' });
    }
  }
};
