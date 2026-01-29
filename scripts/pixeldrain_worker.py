import os
import requests
import time

# --- KONFIGURASI DARI ENVIRONMENT VARIABLES ---
TOKEN = os.environ.get("TG_BOT_TOKEN")
PD_KEY = os.environ.get("PD_API_KEY")
FILE_ID = os.environ.get("FILE_ID")
FILE_NAME = os.environ.get("FILE_NAME", "file.bin")
CHAT_ID = os.environ.get("CHAT_ID")
MESSAGE_ID = os.environ.get("MESSAGE_ID")

TG_API_URL = f"https://api.telegram.org/bot{TOKEN}"

# Path flag untuk cancel (opsional, sebagai backup jika runner tidak langsung mati)
CANCEL_FLAG_PATH = "/tmp/pd_cancel.txt"

# --- HELPER FUNCTIONS ---

def is_cancelled():
    """Cek apakah user menekan tombol batalkan."""
    try:
        if os.path.exists(CANCEL_FLAG_PATH):
            with open(CANCEL_FLAG_PATH, "r") as f:
                return f.read().strip() == "1"
    except:
        pass
    return False

def edit_message(text):
    """Mengedit pesan Telegram untuk menampilkan status/progress."""
    try:
        requests.post(
            f"{TG_API_URL}/editMessageText",
            data={
                "chat_id": CHAT_ID,
                "message_id": MESSAGE_ID,
                "text": text,
                "parse_mode": "Markdown",
            },
        )
    except Exception as e:
        print(f"Gagal edit pesan: {e}")

def get_file_info():
    """Mendapatkan URL download file dari Telegram."""
    r = requests.post(f"{TG_API_URL}/getFile", data={"file_id": FILE_ID})
    data = r.json()
    if not data.get("ok"):
        raise Exception(f"Gagal getFile Telegram: {data}")
    file_path = data["result"]["file_path"]
    return f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"

def format_size(bytes_):
    """Mengubah bytes ke format yang mudah dibaca (MB/GB)."""
    mb = bytes_ / (1024 * 1024)
    if mb >= 1024:
        gb = mb / 1024
        return f"{gb:.2f} GB"
    return f"{mb:.2f} MB"

def get_mime_type(filename):
    """Menebak tipe file berdasarkan ekstensi."""
    ext = filename.split(".")[-1].lower()
    mime_map = {
        "mp4": "video", "mkv": "video", "webm": "video", "mov": "video", "avi": "video",
        "mp3": "audio", "wav": "audio", "m4a": "audio", "ogg": "audio", "flac": "audio",
        "jpg": "image", "jpeg": "image", "png": "image", "gif": "image", "webp": "image",
        "pdf": "document", "doc": "document", "docx": "document", "xls": "document", "xlsx": "document", "ppt": "document", "pptx": "document",
        "zip": "archive", "rar": "archive", "7z": "archive", "tar": "archive",
        "apk": "android", "exe": "windows", "sh": "linux",
    }
    return mime_map.get(ext, "file")

# --- MAIN LOGIC ---

def run():
    try:
        mime_type = get_mime_type(FILE_NAME)

        # 1. Tampilkan pesan awal
        edit_message(
            f"⏳ *Menyiapkan Worker GitHub...*\n\n"
            f"📄 Nama: `{FILE_NAME}`\n"
            f"📁 Tipe: {mime_type}\n"
        )

        # 2. Ambil link download
        download_url = get_file_info()
        
        # 3. DOWNLOAD FILE DARI TELEGRAM
        # Kita download ke /tmp karena disk runner cukup besar
        temp_path = f"/tmp/{FILE_NAME}"
        
        with requests.get(download_url, stream=True, timeout=60) as r:
            r.raise_for_status()
            total_size = int(r.headers.get("content-length", 0))
            downloaded = 0
            
            # Untuk progress bar download
            last_percent_dl = -1

            with open(temp_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 64): # 64KB chunks
                    if is_cancelled():
                        edit_message(f"🚫 *Proses Dibatalkan* (User)\n\n📄 `{FILE_NAME}`")
                        return

                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Update progress download
                        if total_size > 0:
                            percent = int((downloaded / total_size) * 100)
                        else:
                            percent = 0
                        
                        # Update setiap kelipatan 10% agar tidak spam
                        if percent != last_percent_dl and percent % 10 == 0:
                            last_percent_dl = percent
                            edit_message(
                                f"⬇️ *Downloading...*\n\n"
                                f"📄 Nama: `{FILE_NAME}`\n"
                                f"📁 Tipe: {mime_type}\n"
                                f"📊 {percent}% ({format_size(downloaded)} / {format_size(total_size)})"
                            )

        if is_cancelled():
            edit_message(f"🚫 *Proses Dibatalkan* (User)\n\n📄 `{FILE_NAME}`")
            return

        # 4. UPLOAD KE PIXELDRAIN
        edit_message(
            f"⬆️ *Uploading ke Pixeldrain...*\n\n"
            f"📄 Nama: `{FILE_NAME}`\n"
            f"📁 Tipe: {mime_type}\n"
            f"📊 Memulai upload..."
        )

        pd_url = "https://pixeldrain.com/api/file"
        file_size = os.path.getsize(temp_path)
        
        # --- PERBAIKAN BUG NONLOCAL ---
        # Variabel ini didefinisikan di scope luar (fungsi run)
        last_percent = -1 

        class ProgressReader:
            """Wrapper untuk file stream agar bisa melaporkan progress upload."""
            def __init__(self, fp, total, callback):
                self.fp = fp
                self.total = total
                self.callback = callback
                self.read_bytes = 0

            def read(self, size=-1):
                if is_cancelled():
                    return b"" # Mengembalikan bytes kosong akan memutus upload
                
                data = self.fp.read(size)
                self.read_bytes += len(data)
                
                if self.total > 0:
                    percent = int((self.read_bytes / self.total) * 100)
                else:
                    percent = 0
                
                # Deklarasi nonlocal harus di AWAL fungsi
                nonlocal last_percent
                
                if percent != last_percent and percent % 5 == 0:
                    last_percent = percent
                    self.callback(percent)
                
                return data

        def upload_callback(percent):
            """Fungsi ini dipanggil saat progress upload berubah."""
            edit_message(
                f"⬆️ *Uploading ke Pixeldrain...*\n\n"
                f"📄 Nama: `{FILE_NAME}`\n"
                f"📁 Tipe: {mime_type}\n"
                f"📊 {percent}% ({format_size(file_size * (percent/100))} / {format_size(file_size)})"
            )

        # Mulai proses upload
        with open(temp_path, "rb") as f:
            reader = ProgressReader(f, file_size, upload_callback)
            files = {"file": (FILE_NAME, reader, "application/octet-stream")}
            headers = {"Authorization": PD_KEY}
            
            res = requests.post(pd_url, files=files, headers=headers)

        # Cek hasil upload
        if is_cancelled():
             edit_message(f"🚫 *Upload Dibatalkan* (User)\n\n📄 `{FILE_NAME}`")
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
                f"Status Code: {res.status_code}\n"
                f"Response: `{res.text[:500]}`"
            )

    except Exception as e:
        edit_message(
            f"❌ *Terjadi kesalahan sistem*\n\n"
            f"`{str(e)}`"
        )

if __name__ == "__main__":
    run()
