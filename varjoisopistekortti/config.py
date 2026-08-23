import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")

ADMIN_TELEGRAM_IDS = {
    int(uid.strip())
    for uid in os.environ.get("ADMIN_TELEGRAM_IDS", "").split(",")
    if uid.strip()
}

DB_PATH = Path(os.environ.get("DB_PATH", "data/pistekortti.db"))
