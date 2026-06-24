from __future__ import annotations

import aiosqlite

from backend.app.models.entities import Participant


async def create_many(db: aiosqlite.Connection, participants: list[Participant]) -> None:
    await db.executemany(
        "INSERT INTO participants (id, meeting_id, name, email, role) VALUES (?, ?, ?, ?, ?)",
        [
            (p.id, p.meeting_id, p.name, p.email, p.role)
            for p in participants
        ],
    )


async def list_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM participants WHERE meeting_id = ? ORDER BY name",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
