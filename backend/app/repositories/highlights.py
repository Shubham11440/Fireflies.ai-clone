"""Highlights repository — CRUD for transcript line highlights."""
from __future__ import annotations

from typing import Optional
import aiosqlite


async def create(db: aiosqlite.Connection, highlight: dict) -> None:
    await db.execute(
        "INSERT INTO highlights (id, meeting_id, line_id, color, note, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            highlight["id"],
            highlight["meeting_id"],
            highlight["line_id"],
            highlight.get("color", "yellow"),
            highlight.get("note"),
            highlight["created_at"],
        ),
    )
    await db.commit()


async def list_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM highlights WHERE meeting_id = ? ORDER BY created_at",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_by_id(db: aiosqlite.Connection, highlight_id: str) -> Optional[dict]:
    cursor = await db.execute(
        "SELECT * FROM highlights WHERE id = ?", (highlight_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def delete_by_id(db: aiosqlite.Connection, highlight_id: str) -> bool:
    cursor = await db.execute(
        "DELETE FROM highlights WHERE id = ?", (highlight_id,)
    )
    await db.commit()
    return cursor.rowcount > 0
