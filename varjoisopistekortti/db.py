import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from config import DB_PATH
from tasks import TASKS

SCHEMA = """
CREATE TABLE IF NOT EXISTS isos (
    telegram_id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'fi',
    announce INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    text_fi TEXT NOT NULL,
    text_en TEXT NOT NULL,
    repeatable INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iso_id INTEGER NOT NULL REFERENCES isos(telegram_id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    completed_at TEXT NOT NULL,
    photo_file_id TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_conn():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        try:
            conn.execute("ALTER TABLE isos ADD COLUMN announce INTEGER NOT NULL DEFAULT 1")
        except sqlite3.OperationalError as e:
            if "duplicate column" not in str(e):
                raise
        for task in TASKS:
            conn.execute(
                """
                INSERT INTO tasks (key, text_fi, text_en, repeatable)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    text_fi = excluded.text_fi,
                    text_en = excluded.text_en,
                    repeatable = excluded.repeatable
                """,
                (task.key, task.text_fi, task.text_en, int(task.repeatable)),
            )
        # Enforce one-time-only completions at the DB level for non-repeatable tasks.
        # SQLite partial index WHERE clauses can't contain subqueries, so the
        # repeatable task ids are resolved first and inlined as literals.
        repeatable_ids = [
            row["id"]
            for row in conn.execute("SELECT id FROM tasks WHERE repeatable = 1").fetchall()
        ]
        conn.execute("DROP INDEX IF EXISTS uq_completion_once")
        exclusion = (
            f"WHERE task_id NOT IN ({','.join(str(i) for i in repeatable_ids)})"
            if repeatable_ids
            else ""
        )
        conn.execute(
            f"""
            CREATE UNIQUE INDEX uq_completion_once
            ON completions (iso_id, task_id)
            {exclusion}
            """
        )


def upsert_iso(telegram_id: int, display_name: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO isos (telegram_id, display_name, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(telegram_id) DO UPDATE SET display_name = excluded.display_name
            """,
            (telegram_id, display_name, datetime.now(timezone.utc).isoformat()),
        )


def set_language(telegram_id: int, language: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE isos SET language = ? WHERE telegram_id = ?",
            (language, telegram_id),
        )


def get_language(telegram_id: int) -> str:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT language FROM isos WHERE telegram_id = ?", (telegram_id,)
        ).fetchone()
        return row["language"] if row else "fi"


def get_announce(telegram_id: int) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT announce FROM isos WHERE telegram_id = ?", (telegram_id,)
        ).fetchone()
        return bool(row["announce"]) if row else True


def set_announce(telegram_id: int, announce: bool) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE isos SET announce = ? WHERE telegram_id = ?",
            (int(announce), telegram_id),
        )


def get_all_tasks(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()


def get_completion_counts(conn: sqlite3.Connection, iso_id: int) -> dict[int, int]:
    rows = conn.execute(
        "SELECT task_id, COUNT(*) AS c FROM completions WHERE iso_id = ? GROUP BY task_id",
        (iso_id,),
    ).fetchall()
    return {row["task_id"]: row["c"] for row in rows}


def get_completed_task_ids(conn: sqlite3.Connection, iso_id: int) -> set[int]:
    rows = conn.execute(
        """
        SELECT DISTINCT task_id FROM completions
        WHERE iso_id = ?
        AND task_id IN (SELECT id FROM tasks WHERE repeatable = 0)
        """,
        (iso_id,),
    ).fetchall()
    return {row["task_id"] for row in rows}


def add_completion(iso_id: int, task_id: int, photo_file_id: str | None) -> bool:
    """Returns True on success, False if already completed (unique constraint).

    Only a UNIQUE constraint violation means "already completed" - any other
    IntegrityError (e.g. a missing isos row violating the FOREIGN KEY) is a
    real bug and must not be silently mistaken for a duplicate completion.
    """
    with get_conn() as conn:
        try:
            conn.execute(
                """
                INSERT INTO completions (iso_id, task_id, completed_at, photo_file_id)
                VALUES (?, ?, ?, ?)
                """,
                (iso_id, task_id, datetime.now(timezone.utc).isoformat(), photo_file_id),
            )
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                return False
            raise
        return True


def remove_completion(iso_id: int, task_id: int) -> bool:
    """Removes the most recent completion for (iso_id, task_id). Returns True if a row was deleted."""
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT id FROM completions
            WHERE iso_id = ? AND task_id = ?
            ORDER BY id DESC LIMIT 1
            """,
            (iso_id, task_id),
        ).fetchone()
        if row is None:
            return False
        conn.execute("DELETE FROM completions WHERE id = ?", (row["id"],))
        return True


def get_points(iso_id: int) -> int:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM completions WHERE iso_id = ?", (iso_id,)
        ).fetchone()
        return row["c"]


def get_leaderboard() -> list[sqlite3.Row]:
    with get_conn() as conn:
        return conn.execute(
            """
            SELECT isos.display_name AS display_name, COUNT(completions.id) AS points
            FROM isos
            JOIN completions ON completions.iso_id = isos.telegram_id
            GROUP BY isos.telegram_id
            ORDER BY points DESC, isos.display_name ASC
            """
        ).fetchall()


def set_setting(key: str, value: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )


def get_setting(key: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = ?", (key,)
        ).fetchone()
        return row["value"] if row else None
