from __future__ import annotations

from typing import Optional
import aiosqlite

from backend.app.models.entities import ActionItem


async def create(db: aiosqlite.Connection, item: ActionItem) -> None:
    await db.execute(
        "INSERT INTO action_items (id, meeting_id, text, assignee, due_date, "
        "is_completed, source_line_id, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            item.id, item.meeting_id, item.text, item.assignee,
            item.due_date, int(item.is_completed), item.source_line_id,
            item.created_at, item.updated_at,
        ),
    )


async def list_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_by_id(db: aiosqlite.Connection, item_id: str) -> Optional[dict]:
    cursor = await db.execute("SELECT * FROM action_items WHERE id = ?", (item_id,))
    row = await cursor.fetchone()
    return dict(row) if row else None


async def update(db: aiosqlite.Connection, item_id: str, **fields) -> bool:
    if not fields:
        return False
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [item_id]
    cursor = await db.execute(
        f"UPDATE action_items SET {set_clause} WHERE id = ?", values
    )
    await db.commit()
    return cursor.rowcount > 0


async def delete_by_id(db: aiosqlite.Connection, item_id: str) -> bool:
    cursor = await db.execute("DELETE FROM action_items WHERE id = ?", (item_id,))
    await db.commit()
    return cursor.rowcount > 0
