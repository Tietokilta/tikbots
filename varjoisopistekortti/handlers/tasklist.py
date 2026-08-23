from telegram import Update
from telegram.ext import ContextTypes

from db import get_completion_counts, get_conn, get_language, get_points
from i18n import t
from tasks import TASKS


def _task_text(row, lang: str) -> str:
    return row["text_fi"] if lang == "fi" else row["text_en"]


async def tehtavat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    lang = get_language(user.id)
    points = get_points(user.id)

    with get_conn() as conn:
        counts = get_completion_counts(conn, user.id)
        tasks = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()

    lines = [
        t("tasks_list_header", lang, done=len(counts), total=len(TASKS), points=points),
        "",
    ]
    for i, row in enumerate(tasks, start=1):
        count = counts.get(row["id"], 0)
        marker = t("done_marker", lang) if count > 0 else t("todo_marker", lang)
        repeat_marker = " 🔁" if row["repeatable"] else ""
        text = _task_text(row, lang)
        suffix = f" _({count}x)_" if row["repeatable"] and count > 0 else ""
        lines.append(f"{marker} `{i}.` {text}{repeat_marker}{suffix}")

    lines.append("")
    lines.append(t("repeatable_note", lang))

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
