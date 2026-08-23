from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from db import (
    add_completion,
    get_announce,
    get_completed_task_ids,
    get_completion_counts,
    get_conn,
    get_language,
    get_points,
    get_setting,
    remove_completion,
    upsert_iso,
)
from i18n import t

AWAITING_PHOTO_KEY = "awaiting_photo_task_id"


def _task_text(row, lang: str) -> str:
    return row["text_fi"] if lang == "fi" else row["text_en"]


async def suorita(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    upsert_iso(user.id, user.full_name)
    lang = get_language(user.id)

    with get_conn() as conn:
        tasks = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()
        completed_ids = get_completed_task_ids(conn, user.id)

    if not any(row["id"] not in completed_ids for row in tasks):
        await update.message.reply_text(t("no_tasks_left", lang))
        return

    lines = [t("choose_task", lang), ""]
    number_buttons = []
    for i, row in enumerate(tasks, start=1):
        is_done = row["id"] in completed_ids
        done_marker = t("done_marker", lang) if is_done else t("todo_marker", lang)
        repeat_marker = " 🔁" if row["repeatable"] else ""
        lines.append(f"{done_marker} `{i}.` {_task_text(row, lang)}{repeat_marker}")

        callback_data = f"noop:{row['id']}" if is_done else f"task:{row['id']}"
        label = f"✅{i}" if is_done else str(i)
        number_buttons.append(InlineKeyboardButton(label, callback_data=callback_data))

    columns = 5
    buttons = [number_buttons[i:i + columns] for i in range(0, len(number_buttons), columns)]
    buttons.append([InlineKeyboardButton(t("cancel_button", lang), callback_data="cancel")])

    await update.message.reply_text(
        "\n".join(lines), reply_markup=InlineKeyboardMarkup(buttons), parse_mode="Markdown"
    )


async def task_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = update.effective_user
    lang = get_language(user.id)
    task_id = int(query.data.split(":", 1)[1])

    context.user_data[AWAITING_PHOTO_KEY] = None
    context.user_data["pending_task_id"] = task_id

    keyboard = InlineKeyboardMarkup(
        [[InlineKeyboardButton(t("photo_yes", lang), callback_data="photo:yes"),
          InlineKeyboardButton(t("photo_no", lang), callback_data="photo:no")],
         [InlineKeyboardButton(t("cancel_button", lang), callback_data="cancel")]]
    )
    await query.edit_message_text(t("ask_photo", lang), reply_markup=keyboard)


async def photo_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = update.effective_user
    lang = get_language(user.id)
    task_id = context.user_data.get("pending_task_id")

    if task_id is None:
        return

    wants_photo = query.data.split(":", 1)[1] == "yes"

    if wants_photo:
        context.user_data[AWAITING_PHOTO_KEY] = task_id
        await query.edit_message_text(t("send_photo_now", lang))
    else:
        await _finalize(update, context, task_id, photo_file_id=None, via_query=query)


async def noop_already_done(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    lang = get_language(update.effective_user.id)
    await query.answer(text=t("already_done_toast", lang), show_alert=False)


async def cancel_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    lang = get_language(update.effective_user.id)
    context.user_data["pending_task_id"] = None
    context.user_data[AWAITING_PHOTO_KEY] = None
    await query.edit_message_text(t("cancelled", lang))


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = get_language(update.effective_user.id)
    had_pending = bool(
        context.user_data.get("pending_task_id") or context.user_data.get(AWAITING_PHOTO_KEY)
    )
    context.user_data["pending_task_id"] = None
    context.user_data[AWAITING_PHOTO_KEY] = None
    key = "cancelled" if had_pending else "nothing_to_cancel"
    await update.message.reply_text(t(key, lang))


async def photo_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    task_id = context.user_data.get(AWAITING_PHOTO_KEY)
    if task_id is None:
        return

    photo_file_id = update.message.photo[-1].file_id
    context.user_data[AWAITING_PHOTO_KEY] = None
    await _finalize(update, context, task_id, photo_file_id=photo_file_id, via_query=None)


async def _finalize(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    task_id: int,
    photo_file_id: str | None,
    via_query,
) -> None:
    user = update.effective_user
    upsert_iso(user.id, user.full_name)
    lang = get_language(user.id)

    with get_conn() as conn:
        task_row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

    task_text = _task_text(task_row, lang)
    success = add_completion(user.id, task_id, photo_file_id)

    context.user_data["pending_task_id"] = None

    reply_fn = via_query.edit_message_text if via_query else update.message.reply_text

    if not success:
        await reply_fn(t("already_done", lang))
        return

    points = get_points(user.id)
    confirmation = t("completion_confirmed", lang, task=task_text, points=points)
    await reply_fn(confirmation)

    group_chat_id = get_setting("group_chat_id")
    if group_chat_id and get_announce(user.id):
        announcement = t(
            "group_announcement", lang, name=user.full_name, task=task_text
        )
        if photo_file_id:
            await context.bot.send_photo(
                chat_id=int(group_chat_id), photo=photo_file_id, caption=announcement
            )
        else:
            await context.bot.send_message(chat_id=int(group_chat_id), text=announcement)


async def poistasuoritus(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    lang = get_language(user.id)

    with get_conn() as conn:
        counts = get_completion_counts(conn, user.id)
        tasks = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()

    completed = [(row, counts[row["id"]]) for row in tasks if counts.get(row["id"], 0) > 0]

    if not completed:
        await update.message.reply_text(t("no_completions_to_remove", lang))
        return

    lines = [t("choose_remove", lang), ""]
    buttons_flat = []
    for i, (row, count) in enumerate(completed, start=1):
        suffix = f" _({count}x)_" if row["repeatable"] else ""
        lines.append(f"`{i}.` {_task_text(row, lang)}{suffix}")
        buttons_flat.append(
            InlineKeyboardButton(str(i), callback_data=f"remove:{row['id']}")
        )

    columns = 5
    buttons = [buttons_flat[i:i + columns] for i in range(0, len(buttons_flat), columns)]
    buttons.append([InlineKeyboardButton(t("cancel_button", lang), callback_data="cancel")])

    await update.message.reply_text(
        "\n".join(lines), reply_markup=InlineKeyboardMarkup(buttons), parse_mode="Markdown"
    )


async def remove_ask(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = update.effective_user
    lang = get_language(user.id)
    task_id = int(query.data.split(":", 1)[1])

    with get_conn() as conn:
        task_row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    task_text = _task_text(task_row, lang)

    keyboard = InlineKeyboardMarkup(
        [[InlineKeyboardButton(t("remove_yes", lang), callback_data=f"removeok:{task_id}")],
         [InlineKeyboardButton(t("cancel_button", lang), callback_data="cancel")]]
    )
    await query.edit_message_text(
        t("confirm_remove", lang, task=task_text), reply_markup=keyboard, parse_mode="Markdown"
    )


async def remove_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = update.effective_user
    lang = get_language(user.id)
    task_id = int(query.data.split(":", 1)[1])

    with get_conn() as conn:
        task_row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    task_text = _task_text(task_row, lang)

    removed = remove_completion(user.id, task_id)
    if not removed:
        await query.edit_message_text(t("nothing_to_remove", lang))
        return

    points = get_points(user.id)
    await query.edit_message_text(t("remove_confirmed", lang, task=task_text, points=points))
