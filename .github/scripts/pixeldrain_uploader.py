#!/usr/bin/env python3
"""
Pixeldrain Uploader with Real-time Progress
Supports files up to 2GB with live progress updates
"""

import json
import os
import sys
import time
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from datetime import datetime
from pyrogram import Client
from pyrogram.errors import FloodWait
import requests

class ProgressTracker:
    def __init__(self, total_size, file_name, bot_token, chat_id, message_id):
        self.total_size = total_size
        self.file_name = file_name
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.message_id = message_id
        self.downloaded = 0
        self.uploaded = 0
        self.start_time = time.time()
        self.last_update = 0
        self.phase = "initializing"
        self.cancelled = False

    def create_progress_bar(self, current, total, length=20):
        """Create ASCII progress bar"""
        filled = int(length * current / total) if total > 0 else 0
        bar = '█' * filled + '░' * (length - filled)
        percentage = (current / total * 100) if total > 0 else 0
        return f"{bar} {percentage:.1f}%"

    def format_speed(self, bytes_per_sec):
        """Format speed in human readable format"""
        if bytes_per_sec < 1024:
            return f"{bytes_per_sec:.0f} B/s"
        elif bytes_per_sec < 1024 * 1024:
            return f"{bytes_per_sec / 1024:.1f} KB/s"
        else:
            return f"{bytes_per_sec / (1024 * 1024):.1f} MB/s"

    def format_size(self, bytes_size):
        """Format size in human readable format"""
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{bytes_size / 1024:.1f} KB"
        elif bytes_size < 1024 * 1024 * 1024:
            return f"{bytes_size / (1024 * 1024):.1f} MB"
        else:
            return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"

    def format_time(self, seconds):
        """Format time in human readable format"""
        if seconds < 60:
            return f"{int(seconds)}s"
        elif seconds < 3600:
            return f"{int(seconds / 60)}m {int(seconds % 60)}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"

    async def update_telegram(self, force=False):
        """Update Telegram message with current progress"""
        now = time.time()
        
        # Update every 2 seconds or if forced
        if not force and (now - self.last_update) < 2:
            return

        self.last_update = now
        elapsed = now - self.start_time
        
        # Calculate speeds
        if self.phase == "downloading":
            current = self.downloaded
            speed = self.downloaded / elapsed if elapsed > 0 else 0
        elif self.phase == "uploading":
            current = self.uploaded
            speed = self.uploaded / elapsed if elapsed > 0 else 0
        else:
            current = 0
            speed = 0

        # Calculate ETA
        if speed > 0:
            remaining = (self.total_size - current) / speed
            eta_str = self.format_time(remaining)
        else:
            eta_str = "Calculating..."

        # Create message
        phase_emoji = {
            "initializing": "🔄",
            "downloading": "⬇️",
            "uploading": "⬆️",
            "completing": "✨"
        }

        message = f"{phase_emoji.get(self.phase, '📦')} *{self.phase.title()}*\n"
        message += "━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"📄 *File:* `{self.file_name}`\n"
        message += f"📦 *Size:* {self.format_size(self.total_size)}\n\n"

        if self.phase in ["downloading", "uploading"]:
            progress_bar = self.create_progress_bar(current, self.total_size)
            message += f"{progress_bar}\n\n"
            message += f"📊 *Progress:* {self.format_size(current)} / {self.format_size(self.total_size)}\n"
            message += f"⚡ *Speed:* {self.format_speed(speed)}\n"
            message += f"⏱️ *ETA:* {eta_str}\n"
            message += f"🕐 *Elapsed:* {self.format_time(elapsed)}\n\n"
            message += f"💡 Use /pdcancel to cancel upload"
        elif self.phase == "completing":
            message += f"⏳ Finalizing upload...\n"
            message += f"🕐 *Total Time:* {self.format_time(elapsed)}"

        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/editMessageText"
            data = {
                "chat_id": self.chat_id,
                "message_id": self.message_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status != 200:
                        print(f"Failed to update telegram: {await response.text()}")
        except Exception as e:
            print(f"Error updating telegram: {e}")

    async def check_cancelled(self):
        """Check if upload was cancelled"""
        # Check via bot message or file flag
        # For now, just return False
        # TODO: Implement actual cancellation check
        return False


async def send_success_message(bot_token, chat_id, message_id, file_name, file_size, pixeldrain_id, elapsed):
    """Send success message directly to Telegram"""
    try:
        def format_size(bytes_size):
            if bytes_size < 1024:
                return f"{bytes_size} B"
            elif bytes_size < 1024 * 1024:
                return f"{bytes_size / 1024:.1f} KB"
            elif bytes_size < 1024 * 1024 * 1024:
                return f"{bytes_size / (1024 * 1024):.1f} MB"
            else:
                return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"
        
        pd_link = f"https://pixeldrain.com/u/{pixeldrain_id}"
        duration = f"{elapsed:.1f}s" if elapsed < 60 else f"{int(elapsed/60)}m {int(elapsed%60)}s"
        
        message = f"✅ *Upload Berhasil!*\n"
        message += "━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"📄 *File:* {file_name}\n"
        message += f"📦 *Size:* {format_size(file_size)}\n"
        message += f"⏱️ *Duration:* {duration}\n\n"
        message += f"🔗 *Link:*\n{pd_link}\n\n"
        message += f"💡 Use /pdlist to see all uploads"
        
        url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
        data = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data) as response:
                if response.status == 200:
                    print("Success message sent to Telegram!")
                    
                    # Save to history database
                    await save_to_history(chat_id, pixeldrain_id, file_name, file_size)
                    
                    return True
                else:
                    error = await response.text()
                    print(f"Failed to send success message: {error}")
                    return False
                    
    except Exception as e:
        print(f"Error sending success message: {e}")
        return False


async def save_to_history(user_id, file_id, file_name, file_size):
    """Save upload to history database"""
    try:
        import json
        from datetime import datetime
        
        db_path = Path("../database/pixeldrain.json")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing history
        if db_path.exists():
            with open(db_path, 'r') as f:
                history = json.load(f)
        else:
            history = []
        
        # Add new entry
        history.append({
            "userId": str(user_id),
            "fileId": file_id,
            "fileName": file_name,
            "fileSize": file_size,
            "date": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        })
        
        # Save history
        with open(db_path, 'w') as f:
            json.dump(history, f, indent=2)
        
        print(f"Saved to history: {file_name}")
        
    except Exception as e:
        print(f"Failed to save history: {e}")


async def send_error_message(bot_token, chat_id, message_id, file_name, error_msg):
    """Send error message directly to Telegram"""
    try:
        message = f"❌ *Upload Gagal*\n"
        message += "━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"📄 *File:* {file_name}\n"
        message += f"❗ *Error:* {error_msg}\n\n"
        message += "Possible causes:\n"
        message += "• File too large\n"
        message += "• Network timeout\n"
        message += "• Pixeldrain service down\n"
        message += "• Invalid API key\n\n"
        message += "Please try again later."
        
        url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
        data = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data) as response:
                if response.status == 200:
                    print("Error message sent to Telegram!")
                else:
                    error = await response.text()
                    print(f"Failed to send error message: {error}")
                    
    except Exception as e:
        print(f"Error sending error message: {e}")


async def download_file(client, file_id, file_name, progress_tracker):
    """Download file from Telegram using userbot"""
    print(f"Starting download: {file_name}")
    progress_tracker.phase = "downloading"
    await progress_tracker.update_telegram(force=True)

    download_path = Path("downloads") / file_name
    download_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        async def progress_callback(current, total):
            progress_tracker.downloaded = current
            await progress_tracker.update_telegram()
            
            # Check if cancelled
            if await progress_tracker.check_cancelled():
                raise Exception("Upload cancelled by user")

        # Download file with progress
        file_path = await client.download_media(
            file_id,
            file_name=str(download_path),
            progress=progress_callback
        )

        print(f"Download completed: {file_path}")
        return file_path

    except FloodWait as e:
        print(f"FloodWait: Waiting {e.value} seconds")
        await asyncio.sleep(e.value)
        return await download_file(client, file_id, file_name, progress_tracker)
    except Exception as e:
        print(f"Download error: {e}")
        raise


async def upload_to_pixeldrain(file_path, progress_tracker, api_key=None):
    """Upload file to Pixeldrain with progress tracking"""
    print(f"Starting upload to Pixeldrain: {file_path}")
    progress_tracker.phase = "uploading"
    progress_tracker.uploaded = 0
    await progress_tracker.update_telegram(force=True)

    file_size = os.path.getsize(file_path)
    
    try:
        # Prepare authentication
        auth = None
        if api_key:
            # Use API key authentication (recommended)
            auth = aiohttp.BasicAuth('', api_key)
            print("Using API key authentication")
        else:
            print("WARNING: No API key provided - upload may fail!")
            print("Get free API key at: https://pixeldrain.com/user/api_keys")
        
        async with aiohttp.ClientSession() as session:
            async with aiofiles.open(file_path, 'rb') as f:
                # Read file in chunks
                chunk_size = 1024 * 1024  # 1MB chunks
                
                async def file_sender():
                    while True:
                        chunk = await f.read(chunk_size)
                        if not chunk:
                            break
                        
                        progress_tracker.uploaded += len(chunk)
                        await progress_tracker.update_telegram()
                        
                        # Check if cancelled
                        if await progress_tracker.check_cancelled():
                            raise Exception("Upload cancelled by user")
                        
                        yield chunk

                # Create form data
                data = aiohttp.FormData()
                data.add_field('file',
                             file_sender(),
                             filename=os.path.basename(file_path),
                             content_type='application/octet-stream')

                # Upload with authentication
                async with session.post('https://pixeldrain.com/api/file', 
                                       data=data,
                                       auth=auth) as response:
                    if response.status == 201:
                        result = await response.json()
                        
                        if result.get('success'):
                            file_id = result.get('id')
                            print(f"Upload successful! File ID: {file_id}")
                            return file_id
                        else:
                            raise Exception(f"Pixeldrain error: {result}")
                    else:
                        error_text = await response.text()
                        raise Exception(f"Upload failed with status {response.status}: {error_text}")

    except Exception as e:
        print(f"Upload error: {e}")
        raise


async def main():
    """Main function"""
    print("=" * 50)
    print("Pixeldrain Uploader v2.0")
    print("=" * 50)

    # Load config
    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"Failed to load config: {e}")
        sys.exit(1)

    # Extract config
    api_id = int(config['api_id'])
    api_hash = config['api_hash']
    session_string = config['session_string']
    bot_token = config['bot_token']
    chat_id = int(config['chat_id'])
    message_id = int(config['message_id'])
    file_id = config['file_id']
    file_name = config['file_name']
    file_size = int(config['file_size'])
    pixeldrain_api_key = config.get('pixeldrain_api_key')  # Optional

    print(f"File: {file_name}")
    print(f"Size: {file_size / (1024*1024):.2f} MB")
    print(f"Chat ID: {chat_id}")
    if pixeldrain_api_key:
        print(f"Pixeldrain API: Authenticated")
    else:
        print(f"Pixeldrain API: Anonymous (may fail!)")
    print()

    # Initialize progress tracker
    progress = ProgressTracker(
        total_size=file_size,
        file_name=file_name,
        bot_token=bot_token,
        chat_id=chat_id,
        message_id=message_id
    )

    result = {
        "success": False,
        "file_id": None,
        "error": None,
        "upload_id": f"{config['user_id']}_{chat_id}"
    }

    try:
        # Initialize userbot client
        print("Initializing Telegram client...")
        app = Client(
            "pixeldrain_bot",
            api_id=api_id,
            api_hash=api_hash,
            session_string=session_string
        )

        async with app:
            print("Client connected!")
            
            # Download file
            file_path = await download_file(app, file_id, file_name, progress)
            
            if not file_path or not os.path.exists(file_path):
                raise Exception("Download failed - file not found")

            # Upload to Pixeldrain
            pixeldrain_id = await upload_to_pixeldrain(file_path, progress, pixeldrain_api_key)
            
            if not pixeldrain_id:
                raise Exception("Upload to Pixeldrain failed")

            # Success!
            progress.phase = "completing"
            await progress.update_telegram(force=True)

            result["success"] = True
            result["file_id"] = pixeldrain_id

            # Send success message directly to Telegram
            await send_success_message(
                bot_token=bot_token,
                chat_id=chat_id,
                message_id=message_id,
                file_name=file_name,
                file_size=file_size,
                pixeldrain_id=pixeldrain_id,
                elapsed=time.time() - progress.start_time
            )

            # Clean up downloaded file
            try:
                os.remove(file_path)
                print(f"Cleaned up: {file_path}")
            except Exception as e:
                print(f"Failed to cleanup: {e}")

    except Exception as e:
        print(f"Error: {e}")
        result["error"] = str(e)
        
        # Send error message directly to Telegram
        await send_error_message(
            bot_token=bot_token,
            chat_id=chat_id,
            message_id=message_id,
            file_name=file_name,
            error_msg=str(e)
        )

    finally:
        # Save result to file for bot to read
        result_file = Path("upload_result.json")
        with open(result_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print("\n" + "=" * 50)
        print(f"Result: {'SUCCESS' if result['success'] else 'FAILED'}")
        if result['success']:
            print(f"Pixeldrain ID: {result['file_id']}")
            print(f"Link: https://pixeldrain.com/u/{result['file_id']}")
        else:
            print(f"Error: {result['error']}")
        print("=" * 50)

        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)


if __name__ == "__main__":
    asyncio.run(main())
