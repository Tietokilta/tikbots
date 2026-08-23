from telegram import Update
from telegram.ext import ContextTypes

from db import get_completion_counts, get_conn, get_language, get_points
from i18n import t
from scoreboard import render_leaderboard
from tasks import TASKS


async def pisteeni(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    lang = get_language(user.id)
    points = get_points(user.id)

    with get_conn() as conn:
        counts = get_completion_counts(conn, user.id)
        tasks = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()

    lines = [
        t("my_points_header", lang, done=len(counts), max_points=len(TASKS), points=points)
    ]
    for row in tasks:
        count = counts.get(row["id"], 0)
        marker = t("done_marker", lang) if count > 0 else t("todo_marker", lang)
        text = row["text_fi"] if lang == "fi" else row["text_en"]
        suffix = f" ({count}x)" if row["repeatable"] and count > 0 else ""
        lines.append(f"{marker} {text}{suffix}")

    await update.message.reply_text("\n".join(lines))


async def tulostaulu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_language(update.effective_user.id)
    await update.message.reply_text(render_leaderboard(lang))
