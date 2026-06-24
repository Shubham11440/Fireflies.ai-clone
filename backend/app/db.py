from __future__ import annotations

import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "fireflies.db"

_pool: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _pool
    if _pool is None:
        _pool = await aiosqlite.connect(str(DB_PATH))
        _pool.row_factory = aiosqlite.Row
        await _pool.execute("PRAGMA foreign_keys = ON")
        await _pool.execute("PRAGMA journal_mode = WAL")
    return _pool


async def close_db() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def init_db() -> None:
    """Run all pending migrations."""
    db = await get_db()
    await run_migrations(db)


async def run_migrations(db: aiosqlite.Connection) -> None:
    """Apply versioned SQL migration files in order."""
    migrations_dir = Path(__file__).resolve().parent.parent / "migrations"
    if not migrations_dir.exists():
        return

    # Track applied migrations
    await db.execute(
        "CREATE TABLE IF NOT EXISTS _migrations ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "filename TEXT UNIQUE NOT NULL, "
        "applied_at TEXT NOT NULL DEFAULT (datetime('now'))"
        ")"
    )
    await db.commit()

    cursor = await db.execute("SELECT filename FROM _migrations ORDER BY id")
    applied = {row["filename"] for row in await cursor.fetchall()}

    sql_files = sorted(migrations_dir.glob("*.sql"))
    for sql_file in sql_files:
        if sql_file.name not in applied:
            sql = sql_file.read_text(encoding="utf-8")
            await db.executescript(sql)
            await db.execute(
                "INSERT INTO _migrations (filename) VALUES (?)", (sql_file.name,)
            )
            await db.commit()
