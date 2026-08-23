from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from db import get_announce, get_language, set_announce, upsert_iso
from i18n import t


def _keyboard(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(t("privacy_button_on", lang), callback_data="privacy:on"),
          InlineKeyboardButton(t("privacy_button_off", lang), callback_data="privacy:off")]]
    )


async def yksityisyys(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    upsert_iso(user.id, user.full_name)
    lang = get_language(user.id)

    status_key = "privacy_status_on" if get_announce(user.id) else "privacy_status_off"
    text = t("privacy_intro", lang, status=t(status_key, lang))
    await update.message.reply_text(text, reply_markup=_keyboard(lang), parse_mode="Markdown")


async def privacy_toggle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = update.effective_user
    lang = get_language(user.id)

    wants_on = query.data.split(":", 1)[1] == "on"
    set_announce(user.id, wants_on)

    confirmation = t("privacy_set_on" if wants_on else "privacy_set_off", lang)
    await query.edit_message_text(confirmation)
