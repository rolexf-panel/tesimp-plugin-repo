module.exports = {
  name: 'color-converter',
  version: '1.0.0',
  description: 'Convert colors between HEX, RGB, HSL formats and get color info',
  author: 'Bot Developer',
  commands: ['color', 'colour', 'hex', 'rgb'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/color <hex>` - HEX color (e.g., #FF5733)\n' +
        '`/color <r> <g> <b>` - RGB color\n' +
        '`/color random` - Random color\n\n' +
        '*Examples:*\n' +
        '`/color #FF5733`\n' +
        '`/color 255 87 51`\n' +
        '`/hex random`\n' +
        '`/rgb 128 0 255`',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      let rgb, hex, hsl;
      
      // Random color
      if (args[0].toLowerCase() === 'random') {
        rgb = {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256)
        };
        hex = this.rgbToHex(rgb);
        hsl = this.rgbToHsl(rgb);
      }
      // HEX input
      else if (args[0].startsWith('#')) {
        hex = args[0].toUpperCase();
        rgb = this.hexToRgb(hex);
        hsl = this.rgbToHsl(rgb);
      }
      // RGB input
      else if (args.length === 3) {
        rgb = {
          r: parseInt(args[0]),
          g: parseInt(args[1]),
          b: parseInt(args[2])
        };
        
        // Validate RGB
        if (rgb.r < 0 || rgb.r > 255 || rgb.g < 0 || rgb.g > 255 || rgb.b < 0 || rgb.b > 255) {
          return bot.sendMessage(chatId, '❌ RGB values must be between 0 and 255!');
        }
        
        hex = this.rgbToHex(rgb);
        hsl = this.rgbToHsl(rgb);
      }
      else {
        return bot.sendMessage(chatId, '❌ Invalid color format!');
      }
      
      // Get color name (approximate)
      const colorName = this.getColorName(rgb);
      
      // Calculate brightness
      const brightness = this.getBrightness(rgb);
      const isDark = brightness < 128;
      
      let message = `🎨 *Color Converter*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🔷 **${colorName}**\n\n`;
      
      message += `📋 *Formats:*\n`;
      message += `• HEX: \`${hex}\`\n`;
      message += `• RGB: \`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\`\n`;
      message += `• HSL: \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\`\n\n`;
      
      message += `💡 *Properties:*\n`;
      message += `• Brightness: ${brightness.toFixed(0)} (${isDark ? 'Dark' : 'Light'})\n`;
      message += `• Complementary: \`${this.getComplementary(hsl)}\`\n\n`;
      
      message += `🎨 *Web Usage:*\n`;
      message += `CSS: \`color: ${hex};\`\n`;
      message += `CSS: \`background-color: ${hex};\``;
      
      const keyboard = [
        [
          { text: '🎲 Random Color', callback_data: 'color_random' }
        ]
      ];
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Color converter error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to convert color!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  },
  
  rgbToHex(rgb) {
    const toHex = (n) => {
      const hex = Math.round(n).toString(16).padStart(2, '0');
      return hex.toUpperCase();
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  },
  
  rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },
  
  getBrightness(rgb) {
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  },
  
  getComplementary(hsl) {
    const compH = (hsl.h + 180) % 360;
    return `hsl(${compH}°, ${hsl.s}%, ${hsl.l}%)`;
  },
  
  getColorName(rgb) {
    const colors = [
      { name: 'Red', r: 255, g: 0, b: 0 },
      { name: 'Green', r: 0, g: 255, b: 0 },
      { name: 'Blue', r: 0, g: 0, b: 255 },
      { name: 'Yellow', r: 255, g: 255, b: 0 },
      { name: 'Cyan', r: 0, g: 255, b: 255 },
      { name: 'Magenta', r: 255, g: 0, b: 255 },
      { name: 'Orange', r: 255, g: 165, b: 0 },
      { name: 'Purple', r: 128, g: 0, b: 128 },
      { name: 'Pink', r: 255, g: 192, b: 203 },
      { name: 'Brown', r: 165, g: 42, b: 42 },
      { name: 'Gray', r: 128, g: 128, b: 128 },
      { name: 'Black', r: 0, g: 0, b: 0 },
      { name: 'White', r: 255, g: 255, b: 255 }
    ];
    
    let closestColor = colors[0];
    let minDistance = Infinity;
    
    colors.forEach(color => {
      const distance = Math.sqrt(
        Math.pow(rgb.r - color.r, 2) +
        Math.pow(rgb.g - color.g, 2) +
        Math.pow(rgb.b - color.b, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    });
    
    return closestColor.name;
  },
  
  async handleCallback(bot, query, botInstance) {
    if (query.data !== 'color_random') return;
    
    const chatId = query.message.chat.id;
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '🎨 Generating random color...' });
      
      const rgb = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
      };
      
      const hex = this.rgbToHex(rgb);
      const hsl = this.rgbToHsl(rgb);
      const colorName = this.getColorName(rgb);
      const brightness = this.getBrightness(rgb);
      const isDark = brightness < 128;
      
      let message = `🎨 *Color Converter*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🔷 **${colorName}**\n\n`;
      
      message += `📋 *Formats:*\n`;
      message += `• HEX: \`${hex}\`\n`;
      message += `• RGB: \`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\`\n`;
      message += `• HSL: \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\`\n\n`;
      
      message += `💡 *Properties:*\n`;
      message += `• Brightness: ${brightness.toFixed(0)} (${isDark ? 'Dark' : 'Light'})\n`;
      message += `• Complementary: \`${this.getComplementary(hsl)}\`\n\n`;
      
      message += `🎨 *Web Usage:*\n`;
      message += `CSS: \`color: ${hex};\`\n`;
      message += `CSS: \`background-color: ${hex};\``;
      
      const keyboard = [
        [
          { text: '🎲 Random Color', callback_data: 'color_random' }
        ]
      ];
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Color callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Failed to generate color',
        show_alert: true
      });
    }
  }
};
