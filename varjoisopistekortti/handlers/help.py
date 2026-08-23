from telegram import Update
from telegram.ext import ContextTypes

from db import get_language
from i18n import t


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_language(update.effective_user.id)
    await update.message.reply_text(t("help_text", lang), parse_mode="Markdown")
