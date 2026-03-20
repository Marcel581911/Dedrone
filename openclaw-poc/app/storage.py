import aiosqlite
from datetime import datetime, timezone

from app.config import DB_FILE, ensure_config_dir

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS chat_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    sender    TEXT    NOT NULL,
    message   TEXT    NOT NULL,
    reply     TEXT    NOT NULL,
    timestamp TEXT    NOT NULL
);
"""


async def init_db() -> None:
    ensure_config_dir()
    async with aiosqlite.connect(str(DB_FILE)) as db:
        await db.execute(CREATE_TABLE)
        await db.commit()


async def save_message(sender: str, message: str, reply: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(str(DB_FILE)) as db:
        await db.execute(
            "INSERT INTO chat_log (sender, message, reply, timestamp) VALUES (?, ?, ?, ?)",
            (sender, message, reply, ts),
        )
        await db.commit()


async def get_history(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(str(DB_FILE)) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT sender, message, reply, timestamp FROM chat_log ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
    return [dict(r) for r in reversed(rows)]
