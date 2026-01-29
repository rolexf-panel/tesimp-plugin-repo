import os
import asyncio
import requests
import aiohttp
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from urllib.parse import quote

# --- ENV VARIABLES ---
BOT_TOKEN = os.environ.get("TG_BOT_TOKEN")
PD_KEY = os.environ.get("PD_API_KEY")
API_ID = int(os.environ.get("API_ID"))
API_HASH = os.environ.get("API_HASH")
SESSION_STR = os.environ.get("TELETHON_SESSION")
USERBOT_ID = int(os.environ.get("USERBOT_ID")) # ID akun userbot

FORWARDED_MSG_ID = int(os.environ.get("FORWARDED_MSG_ID"))
FILE_NAME = os.environ.get("FILE_NAME", "file.bin")
CHAT_ID = os.environ.get("CHAT_ID")
MESSAGE_ID = int(os.environ.get("MESSAGE_ID"))

TG_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
CANCEL_FLAG = False

# --- HELPERS ---
def edit_message(text):
    try:
        requests.post(f"{TG_API_URL}/editMessageText", data={
            "chat_id": CHAT_ID, "message_id": MESSAGE_ID,
            "text": text, "parse_mode": "Markdown"
        })
    except Exception as e:
        print(f"Edit msg error: {e}")

def format_size(b):
    mb = b / (1024*1024)
    return f"{mb:.2f} MB" if mb < 1024 else f"{mb/1024:.2f} GB"

def get_mime_type(f):
    e = f.split('.')[-1].lower()
    m = {"mp4":"video","mkv":"video","mp3":"audio","jpg":"image","png":"image","pdf":"doc","zip":"archive"}
    return m.get(e, "file")

# --- DOWNLOAD PROGRESS CALLBACK ---
async def download_callback(current, total):
    percent = int((current / total) * 100) if total > 0 else 0
    if percent % 10 == 0:
        edit_message(
            f"⬇️ *Downloading (Userbot)...*\n\n"
            f"📄 `{FILE_NAME}`\n"
            f"📊 {percent}% ({format_size(current)} / {format_size(total)})"
        )

# --- PIXELDRAIN UPLOAD (SYNC WRAPPER) ---
def upload_to_pixeldrain(file_path, file_name):
    safe_name = quote(file_name)
    pd_url = f"https://pixeldrain.com/api/file/{safe_name}"
    file_size = os.path.getsize(file_path)
    
    class ProgressReader:
        def __init__(self, fp, total):
            self.fp = fp
            self.total = total
            self.read = 0
            self.last_percent = -1
        
        def read(self, size=-1):
            global CANCEL_FLAG
            if CANCEL_FLAG: return b""
            data = self.fp.read(size)
            self.read += len(data)
            if self.total > 0:
                p = int((self.read / self.total) * 100)
                if p != self.last_percent and p % 5 == 0:
                    self.last_percent = p
                    edit_message(
                        f"⬆️ *Uploading...*\n\n"
                        f"📄 `{file_name}`\n"
                        f"📊 {p}% ({format_size(self.read)} / {format_size(self.total)})"
                    )
            return data

    with open(file_path, "rb") as f:
        reader = ProgressReader(f, file_size)
        # Basic Auth: ("", API_KEY)
        res = requests.put(pd_url, data=reader, auth=("", PD_KEY))
    return res

# --- MAIN ASYNC FUNCTION ---
async def main():
    global CANCEL_FLAG
    
    client = TelegramClient(StringSession(SESSION_STR), API_ID, API_HASH)
    
    try:
        await client.connect()
        if not await client.is_user_authorized():
            raise Exception("Userbot tidak authorized! Cek SESSION_STRING.")

        mime_type = get_mime_type(FILE_NAME)
        edit_message(f"⏳ *Userbot Ready...*\n\n📄 `{FILE_NAME}`")

        # 1. AMBIL PESAN YANG DIFORWARD OLEH BOT
        # Userbot menerima pesan forward di chat pribadinya (dari Bot)
        # Kita cari berdasarkan ID pesan yang dikirim plugin JS
        message = await client.get_messages(USERBOT_ID, ids=FORWARDED_MSG_ID)
        
        if not message or not message.media:
            raise Exception("Pesan forward tidak ditemukan atau tidak ada media.")

        # 2. DOWNLOAD MENGGUNAKAN USERBOT (Telethon)
        # Telethon otomatis handle download besar tanpa error Bot API
        temp_path = f"/tmp/{FILE_NAME}"
        
        # Download dengan progress callback
        await message.download_media(file=temp_path, progress_callback=download_callback)

        if CANCEL_FLAG:
            edit_message("🚫 *Dibatalkan setelah download*")
            return

        # 3. UPLOAD KE PIXELDRAIN
        # Kita jalankan fungsi blocking (requests) di thread terpisah agar tidak blocking event loop telethon
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(None, upload_to_pixeldrain, temp_path, FILE_NAME)

        if CANCEL_FLAG:
            edit_message("🚫 *Dibatalkan saat upload*")
            return

        if res.status_code == 201:
            result = res.json()
            pd_link = f"https://pixeldrain.com/u/{result['id']}"
            edit_message(
                f"✅ *Selesai!*\n\n"
                f"📄 `{FILE_NAME}`\n"
                f"🔗 {pd_link}"
            )
        else:
            edit_message(f"❌ Gagal Upload PD: {res.status_code}")

    except Exception as e:
        edit_message(f"❌ Error:\n`{str(e)}`")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
