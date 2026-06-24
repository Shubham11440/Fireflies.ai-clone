from __future__ import annotations

import aiosqlite

from backend.app.models.entities import Topic


async def get_or_create(db: aiosqlite.Connection, name: str) -> str:
    """Get existing topic or create new one. Returns topic id."""
    cursor = await db.execute("SELECT id FROM topics WHERE name = ?", (name,))
    row = await cursor.fetchone()
    if row:
        return row["id"]

    import uuid
    topic_id = str(uuid.uuid4())
    await db.execute("INSERT INTO topics (id, name) VALUES (?, ?)", (topic_id, name))
    await db.commit()
    return topic_id


async def link_to_meeting(db: aiosqlite.Connection, meeting_id: str, topic_id: str) -> None:
    await db.execute(
        "INSERT OR IGNORE INTO meeting_topics (meeting_id, topic_id) VALUES (?, ?)",
        (meeting_id, topic_id),
    )


async def list_for_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT t.id, t.name FROM topics t "
        "JOIN meeting_topics mt ON mt.topic_id = t.id "
        "WHERE mt.meeting_id = ? ORDER BY t.name",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def unlink_from_meeting(db: aiosqlite.Connection, meeting_id: str, topic_id: str) -> bool:
    cursor = await db.execute(
        "DELETE FROM meeting_topics WHERE meeting_id = ? AND topic_id = ?",
        (meeting_id, topic_id),
    )
    await db.commit()
    return cursor.rowcount > 0


async def list_all(db: aiosqlite.Connection) -> list[dict]:
    cursor = await db.execute(
        "SELECT t.id, t.name, COUNT(mt.meeting_id) as meeting_count "
        "FROM topics t LEFT JOIN meeting_topics mt ON mt.topic_id = t.id "
        "GROUP BY t.id ORDER BY t.name"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
