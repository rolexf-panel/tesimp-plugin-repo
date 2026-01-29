const crypto = require('crypto');

module.exports = {
  name: 'random',
  version: '1.0.0',
  description: 'Generate random numbers, dice rolls, and coin flips',
  author: 'Bot Developer',
  commands: ['random', 'dice', 'roll', 'coin', 'flip'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    try {
      let message;
      
      // Coin flip
      if (command === 'coin' || command === 'flip') {
        const result = this.getSecureRandom(0, 1) === 0 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '🎴';
        
        message = `${emoji} *Coin Flip*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `**Result: ${result}!**`;
        
        const keyboard = [
          [
            { text: '🔄 Flip Again', callback_data: 'random_coin' }
          ]
        ];
        
        return bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
      
      // Dice roll
      if (command === 'dice' || command === 'roll') {
        if (args.length === 0) {
          return bot.sendMessage(chatId,
            '❌ *Usage:*\n' +
            '`/dice <sides>` - Roll a dice\n' +
            '`/dice <count>d<sides>` - Roll multiple dice\n\n' +
            '*Examples:*\n' +
            '`/dice 6` - Roll 1 six-sided die\n' +
            '`/dice 2d6` - Roll 2 six-sided dice\n' +
            '`/roll 3d20` - Roll 3 twenty-sided dice\n' +
            '`/dice 100` - Roll 1 hundred-sided die',
            { parse_mode: 'Markdown' }
          );
        }
        
        const input = args[0];
        let count = 1;
        let sides = 6;
        
        // Parse dice notation (e.g., 2d6)
        if (input.includes('d')) {
          const parts = input.split('d');
          count = parseInt(parts[0]) || 1;
          sides = parseInt(parts[1]) || 6;
        } else {
          sides = parseInt(input) || 6;
        }
        
        // Validate
        if (count < 1 || count > 100) {
          return bot.sendMessage(chatId, '❌ Dice count must be between 1 and 100!');
        }
        
        if (sides < 2 || sides > 1000) {
          return bot.sendMessage(chatId, '❌ Sides must be between 2 and 1000!');
        }
        
        // Roll dice
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
          const roll = this.getSecureRandom(1, sides);
          rolls.push(roll);
          total += roll;
        }
        
        message = `🎲 *Dice Roll*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🎯 *Rolling:* ${count}d${sides}\n\n`;
        
        if (count === 1) {
          message += `🎲 **Result: ${rolls[0]}**`;
        } else {
          message += `🎲 *Rolls:* ${rolls.join(', ')}\n`;
          message += `📊 *Total:* **${total}**\n`;
          message += `📈 *Average:* ${(total / count).toFixed(2)}`;
        }
        
        const keyboard = [
          [
            { text: '🔄 Roll Again', callback_data: `random_dice:${count}:${sides}` }
          ]
        ];
        
        return bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
      
      // Random number
      if (command === 'random') {
        if (args.length === 0) {
          return bot.sendMessage(chatId,
            '❌ *Usage:*\n' +
            '`/random <max>` - Random 0 to max\n' +
            '`/random <min> <max>` - Random min to max\n\n' +
            '*Examples:*\n' +
            '`/random 100` - Random 0-100\n' +
            '`/random 1 100` - Random 1-100\n' +
            '`/random 50 150` - Random 50-150',
            { parse_mode: 'Markdown' }
          );
        }
        
        let min = 0;
        let max = 100;
        
        if (args.length === 1) {
          max = parseInt(args[0]) || 100;
        } else {
          min = parseInt(args[0]) || 0;
          max = parseInt(args[1]) || 100;
        }
        
        if (min > max) {
          [min, max] = [max, min];
        }
        
        const result = this.getSecureRandom(min, max);
        
        message = `🎰 *Random Number*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📊 *Range:* ${min} - ${max}\n`;
        message += `🎯 **Result: ${result}**`;
        
        const keyboard = [
          [
            { text: '🔄 Generate Again', callback_data: `random_number:${min}:${max}` }
          ]
        ];
        
        return bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
      
    } catch (error) {
      console.error('Random error:', error);
      await bot.sendMessage(chatId,
        '❌ An error occurred!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  getSecureRandom(min, max) {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = crypto.randomBytes(bytesNeeded);
    let randomValue = 0;
    
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + randomBytes[i];
    }
    
    randomValue = randomValue % range;
    return min + randomValue;
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('random_')) return;
    
    const chatId = query.message.chat.id;
    const data = query.data.split(':');
    const action = data[0].replace('random_', '');
    
    try {
      let message, keyboard;
      
      if (action === 'coin') {
        const result = this.getSecureRandom(0, 1) === 0 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '🎴';
        
        message = `${emoji} *Coin Flip*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `**Result: ${result}!**`;
        
        keyboard = [[{ text: '🔄 Flip Again', callback_data: 'random_coin' }]];
        
      } else if (action === 'dice') {
        const count = parseInt(data[1]);
        const sides = parseInt(data[2]);
        
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
          const roll = this.getSecureRandom(1, sides);
          rolls.push(roll);
          total += roll;
        }
        
        message = `🎲 *Dice Roll*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🎯 *Rolling:* ${count}d${sides}\n\n`;
        
        if (count === 1) {
          message += `🎲 **Result: ${rolls[0]}**`;
        } else {
          message += `🎲 *Rolls:* ${rolls.join(', ')}\n`;
          message += `📊 *Total:* **${total}**\n`;
          message += `📈 *Average:* ${(total / count).toFixed(2)}`;
        }
        
        keyboard = [[{ text: '🔄 Roll Again', callback_data: `random_dice:${count}:${sides}` }]];
        
      } else if (action === 'number') {
        const min = parseInt(data[1]);
        const max = parseInt(data[2]);
        const result = this.getSecureRandom(min, max);
        
        message = `🎰 *Random Number*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📊 *Range:* ${min} - ${max}\n`;
        message += `🎯 **Result: ${result}**`;
        
        keyboard = [[{ text: '🔄 Generate Again', callback_data: `random_number:${min}:${max}` }]];
      }
      
      await bot.answerCallbackQuery(query.id, { text: '🎲 Rolling...' });
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Random callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Error occurred',
        show_alert: true
      });
    }
  }
};
