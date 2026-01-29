module.exports = {
  name: 'bmi-calculator',
  version: '1.0.0',
  description: 'Calculate Body Mass Index (BMI) and health category',
  author: 'Bot Developer',
  commands: ['bmi', 'bodymass', 'health'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    
    if (args.length < 2) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/bmi <weight> <height>`\n\n' +
        '*Weight Units:*\n' +
        '• kg (kilograms) - default\n' +
        '• lbs (pounds) - add "lbs" after weight\n\n' +
        '*Height Units:*\n' +
        '• cm (centimeters) - default\n' +
        '• m (meters) - add "m" after height\n' +
        '• ft (feet) - format: 5.8ft or 5ft8\n\n' +
        '*Examples:*\n' +
        '`/bmi 70 175` - 70kg, 175cm\n' +
        '`/bmi 150lbs 5.8ft` - 150 pounds, 5.8 feet\n' +
        '`/bmi 65 1.70m` - 65kg, 1.70 meters',
        { parse_mode: 'Markdown' }
      );
    }
    
    try {
      // Parse weight
      let weightStr = args[0];
      let weight;
      
      if (weightStr.toLowerCase().includes('lbs')) {
        weight = parseFloat(weightStr) * 0.453592; // Convert to kg
      } else {
        weight = parseFloat(weightStr);
      }
      
      // Parse height
      let heightStr = args[1];
      let height; // in meters
      
      if (heightStr.toLowerCase().includes('ft')) {
        // Handle feet input (e.g., 5.8ft or 5ft8)
        const feetMatch = heightStr.match(/(\d+)\.?(\d*)/);
        if (feetMatch) {
          const feet = parseFloat(feetMatch[1]);
          const inches = feetMatch[2] ? parseFloat(feetMatch[2]) / 10 * 12 : 0;
          height = (feet * 12 + inches) * 0.0254; // Convert to meters
        }
      } else if (heightStr.toLowerCase().includes('m') && !heightStr.toLowerCase().includes('cm')) {
        height = parseFloat(heightStr);
      } else {
        // Assume cm
        height = parseFloat(heightStr) / 100;
      }
      
      // Validate input
      if (isNaN(weight) || isNaN(height)) {
        return bot.sendMessage(chatId, '❌ Invalid input! Please check weight and height values.');
      }
      
      if (weight <= 0 || weight > 500) {
        return bot.sendMessage(chatId, '❌ Weight must be between 0 and 500 kg!');
      }
      
      if (height <= 0 || height > 3) {
        return bot.sendMessage(chatId, '❌ Height must be between 0 and 3 meters!');
      }
      
      // Calculate BMI
      const bmi = weight / (height * height);
      const bmiData = this.getBMICategory(bmi);
      
      // Calculate ideal weight range
      const idealWeightMin = 18.5 * (height * height);
      const idealWeightMax = 24.9 * (height * height);
      
      let message = `⚕️ *BMI Calculator*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📊 *Your Stats:*\n`;
      message += `• Weight: ${weight.toFixed(1)} kg\n`;
      message += `• Height: ${(height * 100).toFixed(0)} cm (${height.toFixed(2)} m)\n\n`;
      
      message += `📈 *BMI Result:*\n`;
      message += `• BMI: **${bmi.toFixed(1)}**\n`;
      message += `• Category: ${bmiData.emoji} **${bmiData.category}**\n\n`;
      
      message += `${bmiData.risk}\n\n`;
      
      message += `💪 *Ideal Weight Range:*\n`;
      message += `• ${idealWeightMin.toFixed(1)} - ${idealWeightMax.toFixed(1)} kg\n\n`;
      
      // Weight difference
      if (weight < idealWeightMin) {
        const diff = idealWeightMin - weight;
        message += `📉 You are ${diff.toFixed(1)} kg below ideal range\n`;
      } else if (weight > idealWeightMax) {
        const diff = weight - idealWeightMax;
        message += `📈 You are ${diff.toFixed(1)} kg above ideal range\n`;
      } else {
        message += `✅ You are within ideal weight range!\n`;
      }
      
      message += `\n⚠️ _Note: BMI is a screening tool, not a diagnostic tool. Consult a healthcare professional for personalized advice._`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });
      
    } catch (error) {
      console.error('BMI calculator error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to calculate BMI!\n\n' +
        `Error: ${error.message}`
      );
    }
  },
  
  getBMICategory(bmi) {
    if (bmi < 16) {
      return {
        category: 'Severe Underweight',
        emoji: '🔴',
        risk: '⚠️ *Health Risk:* Very High - Seek medical attention'
      };
    } else if (bmi < 17) {
      return {
        category: 'Moderate Underweight',
        emoji: '🟠',
        risk: '⚠️ *Health Risk:* High - Consider consulting a doctor'
      };
    } else if (bmi < 18.5) {
      return {
        category: 'Mild Underweight',
        emoji: '🟡',
        risk: '⚠️ *Health Risk:* Moderate - May need to gain weight'
      };
    } else if (bmi < 25) {
      return {
        category: 'Normal Weight',
        emoji: '🟢',
        risk: '✅ *Health Risk:* Low - Maintain current lifestyle'
      };
    } else if (bmi < 30) {
      return {
        category: 'Overweight',
        emoji: '🟡',
        risk: '⚠️ *Health Risk:* Moderate - Consider lifestyle changes'
      };
    } else if (bmi < 35) {
      return {
        category: 'Obese Class I',
        emoji: '🟠',
        risk: '⚠️ *Health Risk:* High - Recommend medical consultation'
      };
    } else if (bmi < 40) {
      return {
        category: 'Obese Class II',
        emoji: '🔴',
        risk: '⚠️ *Health Risk:* Very High - Seek medical attention'
      };
    } else {
      return {
        category: 'Obese Class III',
        emoji: '🔴',
        risk: '⚠️ *Health Risk:* Extremely High - Urgent medical attention needed'
      };
    }
  }
};
