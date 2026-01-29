const axios = require('axios');

module.exports = {
  name: 'ai-chat',
  version: '2.0.0',
  description: 'Chat with AI (OpenAI Chat Completions)',
  author: 'Upgraded Plugin',
  commands: ['ai', 'chat', 'gpt', 'ask'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/ai <question>`\n' +
        '`/chat <message>`\n' +
        '`/ask <anything>`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return bot.sendMessage(chatId,
        '⚠️ OPENAI_API_KEY belum diset di environment.\n' +
        'Set dulu lalu restart bot.'
      );
    }
    
    const question = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🤖 AI is thinking...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that replies in Indonesian if user speaks Indonesian.' },
            { role: 'user', content: question }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const answer = response.data.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error('No answer from OpenAI');
      
      let message = `🤖 *AI Assistant*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `❓ *Question:*\n${question}\n\n`;
      message += `💬 *Answer:*\n${answer}`;
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('AI chat error:', error.response?.data || error.message);
      
      let errorMsg = '❌ Failed to get AI response!\n\n';
      errorMsg += `Error: ${error.message}\n\nPlease try again later.`;
      
      await bot.sendMessage(chatId, errorMsg);
    }
  }
};