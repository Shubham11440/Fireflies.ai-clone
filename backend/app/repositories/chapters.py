from __future__ import annotations

import aiosqlite

from backend.app.models.entities import Chapter


async def create_many(db: aiosqlite.Connection, chapters: list[Chapter]) -> None:
    await db.executemany(
        "INSERT INTO chapters (id, meeting_id, title, start_offset, summary, seq) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        [
            (c.id, c.meeting_id, c.title, c.start_offset, c.summary, c.seq)
            for c in chapters
        ],
    )


async def delete_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> None:
    await db.execute("DELETE FROM chapters WHERE meeting_id = ?", (meeting_id,))


async def list_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM chapters WHERE meeting_id = ? ORDER BY seq",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
