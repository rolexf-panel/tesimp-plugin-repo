const axios = require('axios');

module.exports = {
  name: 'youtube-downloader',
  version: '2.0.0',
  description: 'Download YouTube videos and audio (MP3) via 3rd-party API',
  author: 'Upgraded Plugin',
  commands: ['youtube', 'yt', 'ytdl', 'ytmp3', 'ytmp4'],
  
  async execute(bot, msg, args, botInstance) {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0].replace('/', '');
    
    if (args.length === 0) {
      return bot.sendMessage(chatId,
        '❌ *Usage:*\n' +
        '`/youtube <url>` - Download video info\n' +
        '`/ytmp3 <url>` - Download as MP3 audio\n' +
        '`/ytmp4 <url>` - Download as MP4 video\n\n' +
        '*Example:*\n' +
        '`/yt https://youtube.com/watch?v=xxx`\n' +
        '`/ytmp3 https://youtu.be/xxx`',
        { parse_mode: 'Markdown' }
      );
    }
    
    const url = args[0];
    
    // Validate YouTube URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return bot.sendMessage(chatId, '❌ Invalid YouTube URL!');
    }
    
    try {
      const format = command === 'ytmp3' ? 'audio' : command === 'ytmp4' ? 'video' : 'info';
      const statusMsg = await bot.sendMessage(chatId, 
        format === 'audio' ? '⏳ Converting to MP3...' :
        format === 'video' ? '⏳ Downloading video...' :
        '⏳ Getting video info...'
      );
      
      const apiBase = process.env.YTDL_API_BASE || 'https://api.cobalt.tools';
      const apiUrl = `${apiBase.replace(/\/$/, '')}/api/json`;

      const response = await axios.post(apiUrl, {
        url,
        vCodec: 'h264',
        vQuality: '720',
        audioBitrate: '192',
        isAudioOnly: format === 'audio',
        dubLang: false
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = response.data || {};
      
      if (result.status === 'error') {
        throw new Error(result.text || 'Failed to process YouTube URL');
      }
        
        let caption = `🎥 *YouTube Media*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (result.title) caption += `📝 *Title:* ${result.title}\n`;
        if (result.uploader) caption += `📺 *Channel:* ${result.uploader}\n`;
        if (result.duration) caption += `⏱️ *Duration:* ${result.duration}\n`;
        
        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        if (format === 'audio' && result.audio) {
          caption += `\n🎵 *Format:* Audio`;
          
          await bot.sendAudio(chatId, result.audio, {
            caption: caption,
            parse_mode: 'Markdown',
            title: result.title || 'YouTube Audio',
            performer: result.uploader || 'Unknown'
          });
          
        } else if (format === 'video' && result.url) {
          caption += `\n🎬 *Format:* Video`;
          
          // Check file size (Telegram limit 50MB for videos)
          if (result.filesize && parseInt(result.filesize) > 50000000) {
            await bot.sendMessage(chatId,
              `${caption}\n\n⚠️ *File too large for Telegram!*\n\n` +
              `📥 [Download Link](${result.url})`,
              { 
                parse_mode: 'Markdown',
                disable_web_page_preview: false
              }
            );
          } else {
            await bot.sendVideo(chatId, result.url, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          }
          
        } else {
          // Info mode: kirim thumbnail + tombol download via callback
          const keyboard = [
            [
              { text: '🎵 Download MP3', callback_data: `yt_audio:${Buffer.from(url).toString('base64')}` },
              { text: '🎬 Download MP4', callback_data: `yt_video:${Buffer.from(url).toString('base64')}` }
            ]
          ];
          
          if (result.thumbnail) {
            await bot.sendPhoto(chatId, result.thumbnail, {
              caption: caption,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: keyboard }
            });
          } else {
            await bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: keyboard }
            });
          }
        }
      
    } catch (error) {
      console.error('YouTube download error:', error);
      await bot.sendMessage(chatId,
        '❌ Failed to process YouTube URL!\n\n' +
        `Error: ${error.message}\n\n` +
        'Please make sure:\n' +
        '• URL is valid\n' +
        '• Video is public and available\n' +
        '• Video is not age-restricted'
      );
    }
  },
  
  async handleCallback(bot, query, botInstance) {
    if (!query.data.startsWith('yt_')) return;
    
    const chatId = query.message.chat.id;
    const data = query.data.split(':');
    const action = data[0];
    const url = Buffer.from(data[1], 'base64').toString();
    
    try {
      await bot.answerCallbackQuery(query.id, { text: '⏳ Processing...' });
      
      const statusMsg = await bot.sendMessage(chatId,
        action === 'yt_audio' ? '⏳ Converting to audio...' : '⏳ Downloading video...'
      );
      
      const apiBase = process.env.YTDL_API_BASE || 'https://api.cobalt.tools';
      const apiUrl = `${apiBase.replace(/\/$/, '')}/api/json`;

      const format = action === 'yt_audio' ? 'audio' : 'video';

      const response = await axios.post(apiUrl, {
        url,
        vCodec: 'h264',
        vQuality: '720',
        audioBitrate: '192',
        isAudioOnly: format === 'audio',
        dubLang: false
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const result = response.data || {};

      if (result.status === 'error') {
        throw new Error(result.text || 'Failed to process YouTube URL');
      }

      await bot.deleteMessage(chatId, statusMsg.message_id);
      
      if (action === 'yt_audio' && result.audio) {
        await bot.sendAudio(chatId, result.audio, {
          caption: `🎵 ${result.title || 'YouTube Audio'}`,
          title: result.title || 'YouTube Audio',
          performer: result.uploader || 'Unknown'
        });
      } else if (action === 'yt_video' && result.url) {
        await bot.sendVideo(chatId, result.url, {
          caption: `🎬 ${result.title || 'YouTube Video'}`
        });
      }
      
    } catch (error) {
      console.error('YouTube callback error:', error);
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }
};
