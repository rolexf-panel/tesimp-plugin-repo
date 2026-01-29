const axios = require('axios');

module.exports = {
  name: 'ai-image',
  version: '2.0.0',
  description: 'Generate images from text using OpenAI',
  author: 'Upgraded Plugin',
  commands: ['imagine', 'aiimg', 'generate', 'img'],
  
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/imagine <description>`\n' +
        '`/aiimg <what you want>`',
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
    
    const prompt = args.join(' ');
    
    try {
      const statusMsg = await bot.sendMessage(chatId, '🎨 Generating image with AI...\nThis may take a moment...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
          prompt,
          n: 1,
          size: '1024x1024'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const imageUrl = response.data.data?.[0]?.url;
      if (!imageUrl) throw new Error('No image URL from OpenAI');
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `🎨 *AI Generated Image*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📝 *Prompt:* ${prompt}`;
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      console.error('AI image generation error:', error.response?.data || error.message);
      await bot.sendMessage(chatId,
        '❌ Failed to generate image!\n\n' +
        `Error: ${error.message}`
      );
    }
  }
};