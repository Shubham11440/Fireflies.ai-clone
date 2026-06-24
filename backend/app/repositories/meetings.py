from __future__ import annotations

from typing import Optional
import aiosqlite

from backend.app.models.entities import Meeting


async def create(db: aiosqlite.Connection, meeting: Meeting) -> None:
    await db.execute(
        "INSERT INTO meetings (id, user_id, title, occurred_at, duration_sec, "
        "source, media_url, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            meeting.id,
            meeting.user_id,
            meeting.title,
            meeting.occurred_at,
            meeting.duration_sec,
            meeting.source,
            meeting.media_url,
            meeting.created_at,
            meeting.updated_at,
        ),
    )


async def get_by_id(db: aiosqlite.Connection, meeting_id: str) -> Optional[dict]:
    cursor = await db.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
    row = await cursor.fetchone()
    return dict(row) if row else None


async def list_meetings(
    db: aiosqlite.Connection,
    user_id: str,
    q: Optional[str] = None,
    sort: str = "recent",
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """List meetings with optional search and sort."""
    conditions = ["m.user_id = ?"]
    params: list = [user_id]

    if q:
        conditions.append("(m.title LIKE ? OR EXISTS (SELECT 1 FROM participants p WHERE p.meeting_id = m.id AND p.name LIKE ?))")
        like_q = f"%{q}%"
        params.extend([like_q, like_q])

    where = " AND ".join(conditions)

    order_map = {
        "recent": "m.occurred_at DESC",
        "title": "m.title ASC",
        "duration": "m.duration_sec DESC",
    }
    order = order_map.get(sort, "m.occurred_at DESC")

    sql = f"""
        SELECT
            m.id, m.title, m.occurred_at, m.duration_sec, m.source,
            m.media_url, m.created_at, m.updated_at,
            GROUP_CONCAT(DISTINCT p.name) AS participant_names,
            GROUP_CONCAT(DISTINCT t.name) AS topic_names,
            sp.status AS summary_status,
            (SELECT COUNT(*) FROM action_items ai WHERE ai.meeting_id = m.id) AS action_item_count
        FROM meetings m
        LEFT JOIN participants p ON p.meeting_id = m.id
        LEFT JOIN meeting_topics mt ON mt.meeting_id = m.id
        LEFT JOIN topics t ON t.id = mt.topic_id
        LEFT JOIN summary_processes sp ON sp.meeting_id = m.id
        WHERE {where}
        GROUP BY m.id
        ORDER BY {order}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor = await db.execute(sql, params)
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def count_meetings(db: aiosqlite.Connection, user_id: str, q: Optional[str] = None) -> int:
    conditions = ["user_id = ?"]
    params: list = [user_id]
    if q:
        conditions.append(
            "(title LIKE ? OR id IN (SELECT meeting_id FROM participants WHERE name LIKE ?))"
        )
        like_q = f"%{q}%"
        params.extend([like_q, like_q])
    where = " AND ".join(conditions)
    cursor = await db.execute(f"SELECT COUNT(*) as cnt FROM meetings WHERE {where}", params)
    row = await cursor.fetchone()
    return row["cnt"] if row else 0


async def delete_by_id(db: aiosqlite.Connection, meeting_id: str) -> bool:
    cursor = await db.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    await db.commit()
    return cursor.rowcount > 0


async def update(db: aiosqlite.Connection, meeting_id: str, **fields) -> bool:
    if not fields:
        return False
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [meeting_id]
    cursor = await db.execute(
        f"UPDATE meetings SET {set_clause} WHERE id = ?", values
    )
    await db.commit()
    return cursor.rowcount > 0
