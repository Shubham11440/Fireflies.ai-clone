"""Chat repository — CRUD for chat_threads and chat_messages."""
from __future__ import annotations

from typing import Optional
import aiosqlite


async def create_thread(db: aiosqlite.Connection, thread: dict) -> None:
    await db.execute(
        "INSERT INTO chat_threads (id, meeting_id, created_at) VALUES (?, ?, ?)",
        (thread["id"], thread["meeting_id"], thread["created_at"]),
    )
    await db.commit()


async def get_thread(db: aiosqlite.Connection, thread_id: str) -> Optional[dict]:
    cursor = await db.execute(
        "SELECT * FROM chat_threads WHERE id = ?", (thread_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_or_create_thread_for_meeting(
    db: aiosqlite.Connection, meeting_id: str, new_thread_id: str, created_at: str
) -> dict:
    """Get existing thread for a meeting or create a new one (one thread per meeting)."""
    cursor = await db.execute(
        "SELECT * FROM chat_threads WHERE meeting_id = ? LIMIT 1", (meeting_id,)
    )
    row = await cursor.fetchone()
    if row:
        return dict(row)

    thread = {"id": new_thread_id, "meeting_id": meeting_id, "created_at": created_at}
    await create_thread(db, thread)
    return thread


async def add_message(db: aiosqlite.Connection, message: dict) -> None:
    await db.execute(
        "INSERT INTO chat_messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (
            message["id"],
            message["thread_id"],
            message["role"],
            message["content"],
            message["created_at"],
        ),
    )
    await db.commit()


async def list_messages(db: aiosqlite.Connection, thread_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at",
        (thread_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
