from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from db import get_language, set_language, upsert_iso
from i18n import t

LANGUAGE_KEYBOARD = InlineKeyboardMarkup(
    [[InlineKeyboardButton("Suomi 🇫🇮", callback_data="lang:fi"),
      InlineKeyboardButton("English 🇬🇧", callback_data="lang:en")]]
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    upsert_iso(user.id, user.full_name)
    lang = get_language(user.id)
    await update.message.reply_text(t("welcome", lang))
    await update.message.reply_text(t("language_prompt", lang), reply_markup=LANGUAGE_KEYBOARD)


async def language_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_language(update.effective_user.id)
    await update.message.reply_text(t("language_prompt", lang), reply_markup=LANGUAGE_KEYBOARD)


async def language_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    lang = query.data.split(":", 1)[1]
    set_language(update.effective_user.id, lang)
    await query.edit_message_text(t("language_set", lang))
