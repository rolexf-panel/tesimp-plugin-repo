const axios = require('axios');

module.exports = {
  name: 'animals',
  version: '2.0.0',
  description: 'Get random cute animal pictures',
  author: 'Upgraded Plugin',
  commands: ['cat', 'dog', 'fox', 'panda'],
  
  async execute(bot, msg) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    const animalEmojis = {
      'cat': '🐱',
      'dog': '🐶',
      'fox': '🦊',
      'panda': '🐼'
    };
    
    const emoji = animalEmojis[command] || '🐾';
    
    try {
      const statusMsg = await bot.sendMessage(chatId, `${emoji} Getting ${command}...`);
      
      let imageUrl = null;

      if (command === 'dog') {
        const res = await axios.get('https://dog.ceo/api/breeds/image/random');
        imageUrl = res.data?.message;
      } else if (command === 'fox') {
        const res = await axios.get('https://randomfox.ca/floof/');
        imageUrl = res.data?.image;
      } else if (command === 'cat') {
        const res = await axios.get('https://cataas.com/cat?json=true');
        const path = res.data?.url;
        if (path) imageUrl = `https://cataas.com${path}`;
      } else if (command === 'panda') {
        // Mengandalkan Some Random API (sudah umum dipakai di banyak bot)
        const res = await axios.get('https://some-random-api.com/animal/panda');
        imageUrl = res.data?.image;
      }

      if (!imageUrl) {
        throw new Error('Animal image not found from API');
      }
      
      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      const caption = `${emoji} *Random ${command.charAt(0).toUpperCase() + command.slice(1)}*`;
      
      const keyboard = [
        [
          { text: `🔄 Get Another ${command.charAt(0).toUpperCase() + command.slice(1)}`, callback_data: `animal_${command}` }
        ]
      ];
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error(`${command} error:`, error);
      await bot.sendMessage(chatId,
        `❌ Failed to get ${command} image!\n\n` +
        'Please try again later.'
      );
    }
  },
  
  async handleCallback(bot, query) {
    if (!query.data.startsWith('animal_')) return;
    
    const chatId = query.message.chat.id;
    const animal = query.data.split('_')[1];
    
    const animalEmojis = {
      'cat': '🐱',
      'dog': '🐶',
      'fox': '🦊',
      'panda': '🐼'
    };
    
    const emoji = animalEmojis[animal] || '🐾';
    
    try {
      await bot.answerCallbackQuery(query.id, { text: `${emoji} Getting new ${animal}...` });
      
      let imageUrl = null;

      if (animal === 'dog') {
        const res = await axios.get('https://dog.ceo/api/breeds/image/random');
        imageUrl = res.data?.message;
      } else if (animal === 'fox') {
        const res = await axios.get('https://randomfox.ca/floof/');
        imageUrl = res.data?.image;
      } else if (animal === 'cat') {
        const res = await axios.get('https://cataas.com/cat?json=true');
        const path = res.data?.url;
        if (path) imageUrl = `https://cataas.com${path}`;
      } else if (animal === 'panda') {
        const res = await axios.get('https://some-random-api.com/animal/panda');
        imageUrl = res.data?.image;
      }

      if (!imageUrl) throw new Error('Animal image not found from API');
      
      const caption = `${emoji} *Random ${animal.charAt(0).toUpperCase() + animal.slice(1)}*`;
      
      const keyboard = [
        [
          { text: `🔄 Get Another ${animal.charAt(0).toUpperCase() + animal.slice(1)}`, callback_data: `animal_${animal}` }
        ]
      ];
      
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error(`${animal} callback error:`, error);
      await bot.answerCallbackQuery(query.id, {
        text: `❌ Failed to get ${animal}`,
        show_alert: true
      });
    }
  }
};