from telegram import Update
from telegram.ext import ContextTypes

from config import ADMIN_TELEGRAM_IDS
from db import get_language, set_setting
from i18n import t


async def rekisteroiryhma(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat = update.effective_chat
    lang = get_language(user.id)

    if chat.type not in ("group", "supergroup"):
        await update.message.reply_text(t("group_only", lang))
        return

    if user.id not in ADMIN_TELEGRAM_IDS:
        await update.message.reply_text(t("not_admin", lang))
        return

    set_setting("group_chat_id", str(chat.id))
    await update.message.reply_text(t("group_registered", lang))
