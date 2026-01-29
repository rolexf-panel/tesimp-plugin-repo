import os
import time
import requests

TOKEN = os.environ.get("TG_BOT_TOKEN")
PD_KEY = os.environ.get("PD_API_KEY")
FILE_ID = os.environ.get("FILE_ID")
FILE_NAME = os.environ.get("FILE_NAME", "file.bin")
CHAT_ID = os.environ.get("CHAT_ID")
MESSAGE_ID = os.environ.get("MESSAGE_ID")

TG_API_URL = f"https://api.telegram.org/bot{TOKEN}"

# Flag cancel (file sederhana)
CANCEL_FLAG_PATH = "/tmp/pd_cancel.txt"

def is_cancelled():
    try:
        with open(CANCEL_FLAG_PATH, "r") as f:
            return f.read().strip() == "1"
    except FileNotFoundError:
        return False

def edit_message(text):
    requests.post(
        f"{TG_API_URL}/editMessageText",
        data={
            "chat_id": CHAT_ID,
            "message_id": MESSAGE_ID,
            "text": text,
            "parse_mode": "Markdown",
        },
    )

def get_file_info():
    r = requests.post(f"{TG_API_URL}/getFile", data={"file_id": FILE_ID})
    data = r.json()
    if not data.get("ok"):
        raise Exception("Gagal getFile Telegram")
    file_path = data["result"]["file_path"]
    return f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"

def format_size(bytes_):
    mb = bytes_ / (1024 * 1024)
    if mb >= 1024:
        gb = mb / 1024
        return f"{gb:.2f} GB"
    return f"{mb:.2f} MB"

def get_mime_type(filename):
    ext = filename.split(".")[-1].lower()
    mime_map = {
        "mp4": "video",
        "mkv": "video",
        "webm": "video",
        "mp3": "audio",
        "wav": "audio",
        "jpg": "image",
        "jpeg": "image",
        "png": "image",
        "gif": "image",
        "pdf": "document",
        "zip": "archive",
        "rar": "archive",
        "7z": "archive",
    }
    return mime_map.get(ext, "file")

def run():
    try:
        mime_type = get_mime_type(FILE_NAME)

        edit_message(
            f"⏳ *Menyiapkan Worker GitHub...*\n\n"
            f"📄 Nama: `{FILE_NAME}`\n"
            f"📁 Tipe: {mime_type}\n"
        )

        download_url = get_file_info()

        # 1. DOWNLOAD
        with requests.get(download_url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get("content-length", 0))
            downloaded = 0
            temp_path = f"/tmp/{FILE_NAME}"

            last_percent = -1

            with open(temp_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 64):
                    if is_cancelled():
                        edit_message(
                            f"🚫 *Download Dibatalkan*\n\n"
                            f"📄 `{FILE_NAME}`\n"
                        )
                        return

                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = int((downloaded / total_size) * 100)
                        else:
                            percent = 0

                        if percent != last_percent and percent % 5 == 0:
                            last_percent = percent
                            edit_message(
                                f"⬇️ *Downloading...*\n\n"
                                f"📄 Nama: `{FILE_NAME}`\n"
                                f"📁 Tipe: {mime_type}\n"
                                f"📊 {percent}% ({format_size(downloaded)} / {format_size(total_size)})"
                            )

        if is_cancelled():
            edit_message(
                f"🚫 *Proses Dibatalkan setelah download*\n\n"
                f"📄 `{FILE_NAME}`\n"
            )
            return

        # 2. UPLOAD KE PIXELDRAIN
        edit_message(
            f"⬆️ *Uploading ke Pixeldrain...*\n\n"
            f"📄 Nama: `{FILE_NAME}`\n"
            f"📁 Tipe: {mime_type}\n"
            f"📊 Memulai upload..."
        )

        pd_url = "https://pixeldrain.com/api/file"
        file_size = os.path.getsize(temp_path)
        uploaded = 0

        last_percent = -1

        class ProgressReader:
            def __init__(self, fp, total, callback):
                self.fp = fp
                self.total = total
                self.callback = callback
                self.read_bytes = 0

            def read(self, size=-1):
                if is_cancelled():
                    return b""
                data = self.fp.read(size)
                self.read_bytes += len(data)
                if self.total > 0:
                    percent = int((self.read_bytes / self.total) * 100)
                else:
                    percent = 0

                if percent != last_percent and percent % 5 == 0:
                    nonlocal last_percent
                    last_percent = percent
                    self.callback(percent)

                return data

        def upload_callback(percent):
            edit_message(
                f"⬆️ *Uploading ke Pixeldrain...*\n\n"
                f"📄 Nama: `{FILE_NAME}`\n"
                f"📁 Tipe: {mime_type}\n"
                f"📊 {percent}% ({format_size(uploaded)} / {format_size(file_size)})"
            )

        with open(temp_path, "rb") as f:
            reader = ProgressReader(f, file_size, upload_callback)
            files = {"file": (FILE_NAME, reader, "application/octet-stream")}
            headers = {"Authorization": PD_KEY}

            res = requests.post(pd_url, files=files, headers=headers)

        if is_cancelled():
            edit_message(
                f"🚫 *Upload Dibatalkan*\n\n"
                f"📄 `{FILE_NAME}`\n"
            )
            return

        if res.status_code == 201:
            result = res.json()
            pd_id = result["id"]
            pd_link = f"https://pixeldrain.com/u/{pd_id}"

            edit_message(
                f"✅ *Upload Selesai!*\n\n"
                f"📄 Nama: `{FILE_NAME}`\n"
                f"📁 Tipe: {mime_type}\n"
                f"💾 Size: {format_size(file_size)}\n"
                f"🔗 Link: {pd_link}"
            )
        else:
            edit_message(
                f"❌ *Gagal Upload Pixeldrain*\n\n"
                f"Status: {res.status_code}\n"
                f"Response: `{res.text[:400]}`"
            )

    except Exception as e:
        edit_message(
            f"❌ *Terjadi kesalahan*\n\n"
            f"`{str(e)}`"
        )

if __name__ == "__main__":
    run()
