"""Repository for meeting_notes table."""
from __future__ import annotations

from typing import Optional
import aiosqlite


async def get_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> Optional[dict]:
    cursor = await db.execute(
        "SELECT * FROM meeting_notes WHERE meeting_id = ?", (meeting_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def upsert(
    db: aiosqlite.Connection,
    meeting_id: str,
    *,
    notes_markdown: Optional[str] = None,
    notes_json: Optional[str] = None,
) -> None:
    from datetime import datetime, timezone

    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    await db.execute(
        "INSERT INTO meeting_notes (meeting_id, notes_markdown, notes_json, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?) "
        "ON CONFLICT(meeting_id) DO UPDATE SET "
        "notes_markdown=excluded.notes_markdown, notes_json=excluded.notes_json, "
        "updated_at=excluded.updated_at",
        (meeting_id, notes_markdown, notes_json, now, now),
    )
    await db.commit()
