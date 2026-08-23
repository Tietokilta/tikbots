import logging

from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from config import BOT_TOKEN
from db import init_db
from handlers.admin import rekisteroiryhma
from handlers.complete import (
    cancel_command,
    cancel_flow,
    noop_already_done,
    photo_choice,
    photo_received,
    poistasuoritus,
    remove_ask,
    remove_confirm,
    suorita,
    task_selected,
)
from handlers.help import help_command
from handlers.privacy import privacy_toggle, yksityisyys
from handlers.start import language_callback, language_command, start
from handlers.stats import pisteeni, tulostaulu
from handlers.tasklist import tehtavat

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)


def build_application() -> Application:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not set. Copy .env.example to .env and fill it in.")

    init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler(["kieli", "language"], language_command))
    app.add_handler(CommandHandler("suorita", suorita))
    app.add_handler(CommandHandler(["peruuta", "cancel"], cancel_command))
    app.add_handler(CommandHandler("pisteeni", pisteeni))
    app.add_handler(CommandHandler("tulostaulu", tulostaulu))
    app.add_handler(CommandHandler("rekisteroiryhma", rekisteroiryhma))
    app.add_handler(CommandHandler(["help", "apua"], help_command))
    app.add_handler(CommandHandler(["tehtavat", "tasks"], tehtavat))
    app.add_handler(CommandHandler(["poistasuoritus", "poista", "undo"], poistasuoritus))
    app.add_handler(CommandHandler(["yksityisyys", "privacy"], yksityisyys))

    app.add_handler(CallbackQueryHandler(language_callback, pattern=r"^lang:"))
    app.add_handler(CallbackQueryHandler(task_selected, pattern=r"^task:"))
    app.add_handler(CallbackQueryHandler(noop_already_done, pattern=r"^noop:"))
    app.add_handler(CallbackQueryHandler(photo_choice, pattern=r"^photo:"))
    app.add_handler(CallbackQueryHandler(remove_ask, pattern=r"^remove:"))
    app.add_handler(CallbackQueryHandler(remove_confirm, pattern=r"^removeok:"))
    app.add_handler(CallbackQueryHandler(privacy_toggle, pattern=r"^privacy:"))
    app.add_handler(CallbackQueryHandler(cancel_flow, pattern=r"^cancel$"))

    app.add_handler(MessageHandler(filters.PHOTO & filters.ChatType.PRIVATE, photo_received))

    return app


def main() -> None:
    app = build_application()
    app.run_polling(allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
