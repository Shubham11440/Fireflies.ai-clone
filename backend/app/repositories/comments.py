"""Comments repository — CRUD for transcript line comments."""
from __future__ import annotations

from typing import Optional
import aiosqlite


async def create(db: aiosqlite.Connection, comment: dict) -> None:
    await db.execute(
        "INSERT INTO comments (id, meeting_id, line_id, author, body, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            comment["id"],
            comment["meeting_id"],
            comment["line_id"],
            comment.get("author", "Default User"),
            comment["body"],
            comment["created_at"],
        ),
    )
    await db.commit()


async def list_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM comments WHERE meeting_id = ? ORDER BY created_at",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def list_by_line(db: aiosqlite.Connection, line_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM comments WHERE line_id = ? ORDER BY created_at",
        (line_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_by_id(db: aiosqlite.Connection, comment_id: str) -> Optional[dict]:
    cursor = await db.execute(
        "SELECT * FROM comments WHERE id = ?", (comment_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def delete_by_id(db: aiosqlite.Connection, comment_id: str) -> bool:
    cursor = await db.execute(
        "DELETE FROM comments WHERE id = ?", (comment_id,)
    )
    await db.commit()
    return cursor.rowcount > 0
