const fs = require('fs-extra');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

module.exports = {
  name: 'clones',
  version: '1.0.0',
  description: 'Clone bot management system with approval',
  author: 'Bot Developer',
  commands: ['clone', 'clones', 'dashboard'],
  
  async init(bot, botInstance) {
    this.dataPath = path.join(__dirname, '../data/clones.json');
    this.botsPath = path.join(__dirname, '../data/bots');
    
    // Ensure directories exist
    await fs.ensureDir(path.dirname(this.dataPath));
    await fs.ensureDir(this.botsPath);
    
    // Load or create database
    try {
      this.clones = await fs.readJson(this.dataPath);
    } catch {
      this.clones = {
        pending: {},    // Pending approvals
        approved: {},   // Approved clones
        rejected: {}    // Rejected clones (history)
      };
      await this.saveData();
    }
    
    // Start all active clones
    await this.startAllClones(botInstance);
    
    console.log(`✅ Clones plugin initialized. Active: ${Object.keys(this.clones.approved).filter(id => this.clones.approved[id].active).length}`);
  },
  
  async saveData() {
    await fs.writeJson(this.dataPath, this.clones, { spaces: 2 });
  },
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    if (command === 'clone') {
      await this.handleCloneRequest(bot, msg, args, botInstance);
    } else if (command === 'clones' || command === 'dashboard') {
      await this.handleDashboard(bot, msg, botInstance);
    }
  },
  
  async handleCloneRequest(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    
    // Check if owner
    if (botInstance.isOwner(userId)) {
      return bot.sendMessage(chatId, '❌ Owner cannot create clone requests!');
    }
    
    // Check arguments
    if (args.length === 0) {
      return bot.sendMessage(chatId, 
        '❌ *Usage:*\n' +
        '`/clone <bot_token>`\n\n' +
        '*Example:*\n' +
        '`/clone 123456789:ABCdefGHIjklMNOpqrsTUVwxyz`\n\n' +
        '*How to get bot token:*\n' +
        '1. Chat with @BotFather\n' +
        '2. Send /newbot\n' +
        '3. Follow instructions\n' +
        '4. Copy the token given',
        { parse_mode: 'Markdown' }
      );
    }
    
    const token = args[0];
    
    // Validate token format
    if (!this.validateToken(token)) {
      return bot.sendMessage(chatId, '❌ Invalid bot token format!');
    }
    
    // Check if token already exists
    if (this.tokenExists(token)) {
      return bot.sendMessage(chatId, '❌ This bot token is already registered!');
    }
    
    // Check if user has pending request
    if (this.clones.pending[userId]) {
      return bot.sendMessage(chatId, '⏳ You already have a pending request. Please wait for approval.');
    }
    
    // Verify token by getting bot info
    try {
      const statusMsg = await bot.sendMessage(chatId, '🔍 Verifying bot token...');
      
      const testBot = new TelegramBot(token);
      const botInfo = await testBot.getMe();
      
      // Save pending request
      this.clones.pending[userId] = {
        userId: userId,
        username: username,
        token: token,
        botInfo: {
          id: botInfo.id,
          name: botInfo.first_name,
          username: botInfo.username
        },
        requestDate: new Date().toISOString()
      };
      
      await this.saveData();
      
      // Notify user
      await bot.editMessageText(
        '✅ *Request Submitted!*\n\n' +
        `🤖 Bot: @${botInfo.username}\n` +
        `📝 Name: ${botInfo.first_name}\n\n` +
        '⏳ Waiting for owner approval...',
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        }
      );
      
      // Notify owner
      await this.notifyOwner(bot, userId, username, botInfo, botInstance);
      
    } catch (error) {
      let errorMsg = '❌ Failed to verify bot token!';
      
      if (error.response && error.response.statusCode === 401) {
        errorMsg = '❌ Invalid bot token! Please check and try again.';
      } else if (error.code === 'ETELEGRAM') {
        errorMsg = '❌ Telegram API error. Token might be invalid.';
      }
      
      await bot.sendMessage(chatId, errorMsg);
      console.error('Clone verification error:', error.message);
    }
  },
  
  async notifyOwner(bot, userId, username, botInfo, botInstance) {
    const ownerId = botInstance.config.ownerId;
    
    const message = `
🔔 *New Clone Request*
━━━━━━━━━━━━━━━━━━━━

👤 *Requester:*
• ID: \`${userId}\`
• Username: @${username || 'N/A'}

🤖 *Bot Info:*
• ID: \`${botInfo.id}\`
• Name: ${botInfo.name}
• Username: @${botInfo.username}

⏰ *Time:* ${new Date().toLocaleString('id-ID')}
    `.trim();
    
    const keyboard = [
      [
        { text: '✅ Approve', callback_data: `clone_approve:${userId}` },
        { text: '❌ Reject', callback_data: `clone_reject:${userId}` }
      ],
      [
        { text: '👤 View User', callback_data: `clone_viewuser:${userId}` }
      ]
    ];
    
    try {
      await bot.sendMessage(ownerId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error('Failed to notify owner:', error.message);
    }
  },
  
  async handleDashboard(bot, msg, botInstance) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Owner only
    if (!botInstance.isOwner(userId)) {
      return bot.sendMessage(chatId, '❌ This command is for owner only!');
    }
    
    const approved = Object.values(this.clones.approved);
    const pending = Object.values(this.clones.pending);
    const active = approved.filter(c => c.active).length;
    const inactive = approved.filter(c => !c.active).length;
    
    let message = `🎛️ *Clone Dashboard*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 *Statistics:*\n`;
    message += `• Total Approved: ${approved.length}\n`;
    message += `• Active: ${active}\n`;
    message += `• Inactive: ${inactive}\n`;
    message += `• Pending: ${pending.length}\n\n`;
    
    if (pending.length > 0) {
      message += `⏳ *Pending Requests:* ${pending.length}\n`;
    }
    
    const keyboard = [
      [
        { text: '📋 View All Clones', callback_data: 'clone_list_all' }
      ],
      [
        { text: '✅ Active Clones', callback_data: 'clone_list_active' },
        { text: '💤 Inactive Clones', callback_data: 'clone_list_inactive' }
      ]
    ];
    
    if (pending.length > 0) {
      keyboard.push([
        { text: `⏳ Pending (${pending.length})`, callback_data: 'clone_list_pending' }
      ]);
    }
    
    keyboard.push([
      { text: '🔄 Refresh', callback_data: 'clone_dashboard' }
    ]);
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('clone_')) return;
    
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const data = query.data.split(':');
    const action = data[0];
    
    // Owner check for most actions
    const ownerActions = ['clone_approve', 'clone_reject', 'clone_toggle', 'clone_delete', 'clone_list_', 'clone_dashboard', 'clone_manage'];
    const isOwnerAction = ownerActions.some(a => action.startsWith(a));
    
    if (isOwnerAction && !botInstance.isOwner(userId)) {
      return bot.answerCallbackQuery(query.id, {
        text: '❌ Owner only!',
        show_alert: true
      });
    }
    
    try {
      if (action === 'clone_approve') {
        await this.approveClone(bot, query, data[1], botInstance);
      } else if (action === 'clone_reject') {
        await this.rejectClone(bot, query, data[1]);
      } else if (action === 'clone_toggle') {
        await this.toggleClone(bot, query, data[1], botInstance);
      } else if (action === 'clone_delete') {
        await this.deleteClone(bot, query, data[1], botInstance);
      } else if (action === 'clone_list_all') {
        await this.listClones(bot, query, 'all');
      } else if (action === 'clone_list_active') {
        await this.listClones(bot, query, 'active');
      } else if (action === 'clone_list_inactive') {
        await this.listClones(bot, query, 'inactive');
      } else if (action === 'clone_list_pending') {
        await this.listPending(bot, query);
      } else if (action === 'clone_dashboard') {
        await this.refreshDashboard(bot, query, botInstance);
      } else if (action === 'clone_manage') {
        await this.manageClone(bot, query, data[1], botInstance);
      } else if (action === 'clone_viewuser') {
        await this.viewUser(bot, query, data[1]);
      }
      
      await bot.answerCallbackQuery(query.id);
      
    } catch (error) {
      console.error('Clone callback error:', error);
      await bot.answerCallbackQuery(query.id, {
        text: `❌ Error: ${error.message}`,
        show_alert: true
      });
    }
  },
  
  async approveClone(bot, query, targetUserId, botInstance) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const pending = this.clones.pending[targetUserId];
    
    if (!pending) {
      return bot.editMessageText('❌ Request not found or already processed.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
    
    try {
      // Start the clone bot
      const cloneBot = new TelegramBot(pending.token, { polling: true });
      const botInfo = await cloneBot.getMe();
      
      // Move to approved
      this.clones.approved[targetUserId] = {
        ...pending,
        active: true,
        approvedDate: new Date().toISOString(),
        approvedBy: query.from.id
      };
      
      delete this.clones.pending[targetUserId];
      await this.saveData();
      
      // Save bot instance
      await this.saveBot(targetUserId, cloneBot, botInstance);
      
      // Update owner message
      await bot.editMessageText(
        `✅ *Clone Approved!*\n\n` +
        `🤖 Bot: @${botInfo.username}\n` +
        `👤 Owner: @${pending.username}\n` +
        `📅 Approved: ${new Date().toLocaleString('id-ID')}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        }
      );
      
      // Notify user
      await bot.sendMessage(targetUserId,
        `🎉 *Clone Request Approved!*\n\n` +
        `✅ Your bot @${botInfo.username} is now active!\n\n` +
        `The bot will now work as a clone of the main bot with all features.`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Approve error:', error);
      await bot.editMessageText(
        `❌ Failed to approve clone: ${error.message}`,
        { chat_id: chatId, message_id: messageId }
      );
    }
  },
  
  async rejectClone(bot, query, targetUserId) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const pending = this.clones.pending[targetUserId];
    
    if (!pending) {
      return bot.editMessageText('❌ Request not found or already processed.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
    
    // Move to rejected (history)
    this.clones.rejected[targetUserId] = {
      ...pending,
      rejectedDate: new Date().toISOString(),
      rejectedBy: query.from.id
    };
    
    delete this.clones.pending[targetUserId];
    await this.saveData();
    
    // Update owner message
    await bot.editMessageText(
      `❌ *Clone Rejected*\n\n` +
      `🤖 Bot: @${pending.botInfo.username}\n` +
      `👤 Requester: @${pending.username}\n` +
      `📅 Rejected: ${new Date().toLocaleString('id-ID')}`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      }
    );
    
    // Notify user
    await bot.sendMessage(targetUserId,
      `❌ *Clone Request Rejected*\n\n` +
      `Your clone request has been rejected by the owner.\n\n` +
      `You can submit a new request if needed.`,
      { parse_mode: 'Markdown' }
    );
  },
  
  async listClones(bot, query, filter) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    let clones = Object.values(this.clones.approved);
    
    if (filter === 'active') {
      clones = clones.filter(c => c.active);
    } else if (filter === 'inactive') {
      clones = clones.filter(c => !c.active);
    }
    
    if (clones.length === 0) {
      const filterText = filter === 'all' ? '' : filter;
      return bot.editMessageText(
        `📋 No ${filterText} clones found.`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[
              { text: '◀️ Back to Dashboard', callback_data: 'clone_dashboard' }
            ]]
          }
        }
      );
    }
    
    let message = `📋 *${filter.charAt(0).toUpperCase() + filter.slice(1)} Clones (${clones.length})*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const keyboard = [];
    
    clones.forEach((clone, index) => {
      const status = clone.active ? '🟢' : '🔴';
      const botUsername = clone.botInfo.username;
      
      message += `${index + 1}. ${status} @${botUsername}\n`;
      message += `   👤 Owner: @${clone.username}\n`;
      message += `   📅 ${new Date(clone.approvedDate).toLocaleDateString('id-ID')}\n\n`;
      
      keyboard.push([
        { 
          text: `${status} @${botUsername}`, 
          callback_data: `clone_manage:${clone.userId}` 
        }
      ]);
    });
    
    keyboard.push([
      { text: '◀️ Back to Dashboard', callback_data: 'clone_dashboard' }
    ]);
    
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  },
  
  async listPending(bot, query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const pending = Object.values(this.clones.pending);
    
    if (pending.length === 0) {
      return bot.editMessageText(
        '📋 No pending requests.',
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[
              { text: '◀️ Back to Dashboard', callback_data: 'clone_dashboard' }
            ]]
          }
        }
      );
    }
    
    let message = `⏳ *Pending Requests (${pending.length})*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const keyboard = [];
    
    pending.forEach((req, index) => {
      message += `${index + 1}. @${req.botInfo.username}\n`;
      message += `   👤 By: @${req.username}\n`;
      message += `   📅 ${new Date(req.requestDate).toLocaleString('id-ID')}\n\n`;
      
      keyboard.push([
        { text: `✅ Approve @${req.botInfo.username}`, callback_data: `clone_approve:${req.userId}` },
        { text: '❌ Reject', callback_data: `clone_reject:${req.userId}` }
      ]);
    });
    
    keyboard.push([
      { text: '◀️ Back to Dashboard', callback_data: 'clone_dashboard' }
    ]);
    
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  },
  
  async manageClone(bot, query, targetUserId, botInstance) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const clone = this.clones.approved[targetUserId];
    
    if (!clone) {
      return bot.editMessageText('❌ Clone not found.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
    
    const status = clone.active ? '🟢 Active' : '🔴 Inactive';
    
    let message = `🤖 *Clone Management*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📱 *Bot:* @${clone.botInfo.username}\n`;
    message += `📝 *Name:* ${clone.botInfo.name}\n`;
    message += `🆔 *Bot ID:* \`${clone.botInfo.id}\`\n\n`;
    message += `👤 *Owner:* @${clone.username}\n`;
    message += `🆔 *User ID:* \`${clone.userId}\`\n\n`;
    message += `📊 *Status:* ${status}\n`;
    message += `📅 *Approved:* ${new Date(clone.approvedDate).toLocaleString('id-ID')}\n`;
    
    const keyboard = [
      [
        { 
          text: clone.active ? '❌ Deactivate' : '✅ Activate', 
          callback_data: `clone_toggle:${targetUserId}` 
        }
      ],
      [
        { text: '🗑️ Delete Clone', callback_data: `clone_delete:${targetUserId}` }
      ],
      [
        { text: '◀️ Back to List', callback_data: 'clone_list_all' }
      ]
    ];
    
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  },
  
  async toggleClone(bot, query, targetUserId, botInstance) {
    const chatId = query.message.chat.id;
    const clone = this.clones.approved[targetUserId];
    
    if (!clone) {
      return bot.answerCallbackQuery(query.id, {
        text: '❌ Clone not found!',
        show_alert: true
      });
    }
    
    const wasActive = clone.active;
    clone.active = !wasActive;
    await this.saveData();
    
    if (clone.active) {
      // Start the bot
      await this.startBot(targetUserId, botInstance);
      await bot.answerCallbackQuery(query.id, {
        text: '✅ Clone activated!',
        show_alert: true
      });
    } else {
      // Stop the bot
      await this.stopBot(targetUserId);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Clone deactivated!',
        show_alert: true
      });
    }
    
    // Refresh the management view
    await this.manageClone(bot, query, targetUserId, botInstance);
  },
  
  async deleteClone(bot, query, targetUserId, botInstance) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const clone = this.clones.approved[targetUserId];
    
    if (!clone) {
      return bot.answerCallbackQuery(query.id, {
        text: '❌ Clone not found!',
        show_alert: true
      });
    }
    
    // Stop bot if active
    if (clone.active) {
      await this.stopBot(targetUserId);
    }
    
    // Delete from database
    delete this.clones.approved[targetUserId];
    await this.saveData();
    
    // Delete bot file
    const botFile = path.join(this.botsPath, `${targetUserId}.json`);
    if (await fs.pathExists(botFile)) {
      await fs.remove(botFile);
    }
    
    await bot.editMessageText(
      `🗑️ *Clone Deleted*\n\n` +
      `Bot @${clone.botInfo.username} has been permanently deleted.`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '◀️ Back to Dashboard', callback_data: 'clone_dashboard' }
          ]]
        }
      }
    );
    
    // Notify user
    try {
      await bot.sendMessage(targetUserId,
        `🗑️ *Clone Deleted*\n\n` +
        `Your clone bot @${clone.botInfo.username} has been deleted by the owner.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.log('Could not notify user:', error.message);
    }
  },
  
  async viewUser(bot, query, targetUserId) {
    const chatId = query.message.chat.id;
    
    try {
      const userInfo = await bot.getChat(targetUserId);
      
      let message = `👤 *User Information*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🆔 *ID:* \`${userInfo.id}\`\n`;
      message += `📝 *Name:* ${userInfo.first_name}`;
      if (userInfo.last_name) message += ` ${userInfo.last_name}`;
      message += `\n`;
      if (userInfo.username) message += `👤 *Username:* @${userInfo.username}\n`;
      if (userInfo.bio) message += `📋 *Bio:* ${userInfo.bio}\n`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Could not fetch user info',
        show_alert: true
      });
    }
  },
  
  async refreshDashboard(bot, query, botInstance) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    const approved = Object.values(this.clones.approved);
    const pending = Object.values(this.clones.pending);
    const active = approved.filter(c => c.active).length;
    const inactive = approved.filter(c => !c.active).length;
    
    let message = `🎛️ *Clone Dashboard*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 *Statistics:*\n`;
    message += `• Total Approved: ${approved.length}\n`;
    message += `• Active: ${active}\n`;
    message += `• Inactive: ${inactive}\n`;
    message += `• Pending: ${pending.length}\n\n`;
    message += `🔄 Updated: ${new Date().toLocaleTimeString('id-ID')}`;
    
    if (pending.length > 0) {
      message += `\n\n⏳ *Pending Requests:* ${pending.length}`;
    }
    
    const keyboard = [
      [
        { text: '📋 View All Clones', callback_data: 'clone_list_all' }
      ],
      [
        { text: '✅ Active Clones', callback_data: 'clone_list_active' },
        { text: '💤 Inactive Clones', callback_data: 'clone_list_inactive' }
      ]
    ];
    
    if (pending.length > 0) {
      keyboard.push([
        { text: `⏳ Pending (${pending.length})`, callback_data: 'clone_list_pending' }
      ]);
    }
    
    keyboard.push([
      { text: '🔄 Refresh', callback_data: 'clone_dashboard' }
    ]);
    
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  },
  
  async saveBot(userId, cloneBot, botInstance) {
    const botFile = path.join(this.botsPath, `${userId}.json`);
    const botData = {
      userId: userId,
      token: this.clones.approved[userId].token,
      active: true
    };
    await fs.writeJson(botFile, botData, { spaces: 2 });
    
    // Store bot instance in memory
    if (!this.activeBots) this.activeBots = new Map();
    this.activeBots.set(userId, cloneBot);
    
    // Setup bot to mirror main bot
    await this.setupCloneBot(cloneBot, userId, botInstance);
  },
  
  async setupCloneBot(cloneBot, userId, botInstance) {
    // Mirror all commands from main bot
    cloneBot.on('message', async (msg) => {
      const text = msg.text;
      if (!text || !text.startsWith(botInstance.config.prefix)) return;
      
      const args = text.slice(botInstance.config.prefix.length).trim().split(/\s+/);
      const command = args.shift().toLowerCase();
      
      // Find and execute plugin command
      const plugin = botInstance.commands.get(command);
      if (plugin && plugin.name !== 'clones') { // Don't mirror clone commands
        try {
          await plugin.execute(cloneBot, msg, args, botInstance);
        } catch (error) {
          console.error(`Error in clone ${userId}:`, error);
        }
      }
    });
    
    // Mirror callback queries
    cloneBot.on('callback_query', async (query) => {
      for (const [name, plugin] of botInstance.plugins) {
        if (plugin.name === 'clones') continue; // Skip clone plugin
        if (typeof plugin.handleCallback === 'function') {
          try {
            await plugin.handleCallback(cloneBot, query, botInstance);
          } catch (error) {
            console.error(`Error in clone ${userId} callback:`, error);
          }
        }
      }
    });
    
    console.log(`✅ Clone bot setup for user ${userId}`);
  },
  
  async startBot(userId, botInstance) {
    const clone = this.clones.approved[userId];
    if (!clone) return;
    
    try {
      const cloneBot = new TelegramBot(clone.token, { polling: true });
      await this.saveBot(userId, cloneBot, botInstance);
      console.log(`✅ Started clone bot for user ${userId}`);
    } catch (error) {
      console.error(`Failed to start clone ${userId}:`, error);
    }
  },
  
  async stopBot(userId) {
    if (!this.activeBots) return;
    
    const bot = this.activeBots.get(userId);
    if (bot) {
      try {
        await bot.stopPolling();
        this.activeBots.delete(userId);
        console.log(`🛑 Stopped clone bot for user ${userId}`);
      } catch (error) {
        console.error(`Failed to stop clone ${userId}:`, error);
      }
    }
  },
  
  async startAllClones(botInstance) {
    const activeClones = Object.entries(this.clones.approved).filter(([_, c]) => c.active);
    
    for (const [userId, clone] of activeClones) {
      await this.startBot(userId, botInstance);
    }
  },
  
  validateToken(token) {
    // Telegram bot token format: number:alphanumeric_string
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token);
  },
  
  tokenExists(token) {
    // Check in approved
    for (const clone of Object.values(this.clones.approved)) {
      if (clone.token === token) return true;
    }
    // Check in pending
    for (const clone of Object.values(this.clones.pending)) {
      if (clone.token === token) return true;
    }
    return false;
  }
};
