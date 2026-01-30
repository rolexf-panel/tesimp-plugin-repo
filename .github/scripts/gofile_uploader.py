#!/usr/bin/env python3
import json
import os
import time
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from datetime import datetime
from pyrogram import Client
from pyrogram.errors import FloodWait

# === ProgressTracker Class (sama seperti fixed pixeldrain) ===
class ProgressTracker:
    def __init__(self, total_size, file_name, bot_token, chat_id, message_id):
        self.total_size = int(total_size)
        self.file_name = file_name
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.message_id = message_id
        self.downloaded = 0
        self.uploaded = 0
        self.start_time = time.time()
        self.last_update = 0
        self.phase = "initializing"

    def create_progress_bar(self, current, total, length=20):
        filled = int(length * current / total) if total > 0 else 0
        bar = '█' * filled + '░' * (length - filled)
        percentage = (current / total * 100) if total > 0 else 0
        return f"{bar} {percentage:.1f}%"

    def format_speed(self, bytes_per_sec):
        if bytes_per_sec < 1024: return f"{bytes_per_sec:.0f} B/s"
        elif bytes_per_sec < 1024**2: return f"{bytes_per_sec / 1024:.1f} KB/s"
        else: return f"{bytes_per_sec / (1024**2):.1f} MB/s"

    def format_size(self, bytes_size):
        if bytes_size < 1024: return f"{bytes_size} B"
        elif bytes_size < 1024**2: return f"{bytes_size / 1024:.1f} KB"
        elif bytes_size < 1024**3: return f"{bytes_size / (1024**2):.1f} MB"
        else: return f"{bytes_size / (1024**3):.2f} GB"

    def format_time(self, seconds):
        if seconds < 60: return f"{int(seconds)}s"
        elif seconds < 3600: return f"{int(seconds / 60)}m {int(seconds % 60)}s"
        else: hours = int(seconds / 3600); minutes = int((seconds % 3600) / 60); return f"{hours}h {minutes}m"

    async def update_telegram(self, force=False):
        now = time.time()
        if not force and (now - self.last_update) < 2: return
        self.last_update = now
        elapsed = now - self.start_time

        if self.phase in ["downloading", "uploading"]:
            current = self.downloaded if self.phase == "downloading" else self.uploaded
            speed = current / elapsed if elapsed > 0 else 0
            eta = (self.total_size - current) / speed if speed > 0 else 0
            eta_str = self.format_time(eta) if speed > 0 else "Calculating..."
        else:
            current = speed = 0
            eta_str = "N/A"

        phase_emoji = {"initializing": "🚀", "downloading": "⬇️", "uploading": "⬆️", "completing": "🔄"}
        message = f"{phase_emoji.get(self.phase, '🔄')} *{self.phase.title()}*\n━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"📄 *File:* `{self.file_name}`\n"
        message += f"📦 *Size:* {self.format_size(self.total_size)}\n\n"

        if self.phase in ["downloading", "uploading"]:
            message += f"{self.create_progress_bar(current, self.total_size)}\n\n"
            message += f"✅ Processed: {self.format_size(current)} / {self.format_size(self.total_size)}\n"
            message += f"🚀 Speed: {self.format_speed(speed)}\n"
            message += f"⏳ ETA: {eta_str}\n"
            message += f"⏱️ Elapsed: {self.format_time(elapsed)}\n\n"
            message += "Use /gfcancel to cancel"

        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/editMessageText"
            data = {
                "chat_id": self.chat_id,
                "message_id": self.message_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as resp:
                    pass
        except Exception as e:
            print(f"Telegram update error: {e}")

# === Download File ===
async def download_file(client, source_chat_id, source_message_id, file_name, progress_tracker):
    progress_tracker.phase = "downloading"
    await progress_tracker.update_telegram(force=True)

    download_path = Path("downloads") / file_name
    download_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        message = await client.get_messages(int(source_chat_id), int(source_message_id))
        if not message or not (message.document or message.video or message.audio or message.photo):
            raise Exception("No file found in source message")

        async def progress_callback(current, total):
            progress_tracker.downloaded = current
            await progress_tracker.update_telegram()

        await client.download_media(
            message,
            file_name=str(download_path),
            progress=progress_callback
        )
        return str(download_path)
    except FloodWait as e:
        print(f"FloodWait: {e.value}s")
        await asyncio.sleep(e.value)
        return await download_file(client, source_chat_id, source_message_id, file_name, progress_tracker)
    except Exception as e:
        raise e

# === Upload to Gofile ===
async def upload_to_gofile(file_path, progress_tracker):
    progress_tracker.phase = "uploading"
    await progress_tracker.update_telegram(force=True)

    async with aiohttp.ClientSession() as session:
        # Get best server
        async with session.get('https://api.gofile.io/getServer') as resp:
            data = await resp.json()
            if data['status'] != 'ok':
                raise Exception('Failed to get Gofile server')
            server = data['data']['server']

        url = f"https://{server}.gofile.io/uploadFile"
        file_size = os.path.getsize(file_path)

        async with aiofiles.open(file_path, 'rb') as f:
            async def file_sender():
                uploaded = 0
                chunk = await f.read(1024 * 1024)  # 1MB chunks
                while chunk:
                    uploaded += len(chunk)
                    progress_tracker.uploaded = uploaded
                    await progress_tracker.update_telegram()
                    yield chunk
                    chunk = await f.read(1024 * 1024)

            form = aiohttp.FormData()
            form.add_field('file', file_sender(), filename=os.path.basename(file_path))

            async with session.post(url, data=form) as resp:
                result = await resp.json()
                if result['status'] != 'ok':
                    raise Exception(result.get('data', 'Unknown error'))
                return result['data']['downloadPage']  # e.g., https://gofile.io/d/ABC123

# === Success / Error Message ===
async def send_success_message(bot_token, chat_id, message_id, file_name, file_size, link, elapsed):
    message = f"✅ *Upload Successful!*\n━━━━━━━━━━━━━━━━━━━━\n\n"
    message += f"📄 *File:* `{file_name}`\n"
    message += f"📦 *Size:* {ProgressTracker(0,'','','','').format_size(file_size)}\n"
    message += f"⏱️ *Duration:* {ProgressTracker(0,'','','','').format_time(elapsed)}\n\n"
    message += f"🔗 [Download]({link})\n\n"
    message += "Use /gflist to view history"

    url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
    data = {"chat_id": chat_id, "message_id": message_id, "text": message, "parse_mode": "Markdown", "disable_web_page_preview": False}
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data): pass

async def send_error_message(bot_token, chat_id, message_id, file_name, error_msg):
    message = f"❌ *Upload Failed*\n━━━━━━━━━━━━━━━━━━━━\n\n"
    message += f"📄 *File:* `{file_name}`\n"
    message += f"❗ *Error:* {error_msg}\n\n"
    message += "Try again later."

    url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
    data = {"chat_id": chat_id, "message_id": message_id, "text": message, "parse_mode": "Markdown"}
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data): pass

# === Main ===
async def main():
    with open("config.json") as f:
        config = json.load(f)

    tracker = ProgressTracker(config["file_size"], config["file_name"], config["bot_token"], config["chat_id"], config["message_id"])
    await tracker.update_telegram(force=True)

    app = Client("uploader", api_id=int(config["api_id"]), api_hash=config["api_hash"], session_string=config["session_string"])

    async with app:
        try:
            file_path = await download_file(app, config["source_chat_id"], config["source_message_id"], config["file_name"], tracker)
            link = await upload_to_gofile(file_path, tracker)

            elapsed = time.time() - tracker.start_time
            await send_success_message(config["bot_token"], config["chat_id"], config["message_id"], config["file_name"], int(config["file_size"]), link, elapsed)
        except Exception as e:
            await send_error_message(config["bot_token"], config["chat_id"], config["message_id"], config["file_name"], str(e))

if __name__ == "__main__":
    asyncio.run(main())
