from __future__ import annotations

from typing import Optional
import aiosqlite

from backend.app.models.entities import TranscriptLine


async def create_many(db: aiosqlite.Connection, lines: list[TranscriptLine]) -> None:
    await db.executemany(
        "INSERT INTO transcript_lines (id, meeting_id, seq, speaker, text, timestamp, start_offset, end_offset) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (l.id, l.meeting_id, l.seq, l.speaker, l.text, l.timestamp, l.start_offset, l.end_offset)
            for l in lines
        ],
    )


async def list_by_meeting(
    db: aiosqlite.Connection,
    meeting_id: str,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM transcript_lines WHERE meeting_id = ? ORDER BY seq LIMIT ? OFFSET ?",
        (meeting_id, limit, offset),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def count_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> int:
    cursor = await db.execute(
        "SELECT COUNT(*) as cnt FROM transcript_lines WHERE meeting_id = ?",
        (meeting_id,),
    )
    row = await cursor.fetchone()
    return row["cnt"] if row else 0


async def search_in_meeting(
    db: aiosqlite.Connection, meeting_id: str, q: str
) -> list[dict]:
    """Full-text search within a meeting's transcript lines."""
    cursor = await db.execute(
        "SELECT tl.* FROM transcript_lines tl "
        "JOIN transcript_fts fts ON fts.line_id = tl.id "
        "WHERE fts.meeting_id = ? AND transcript_fts MATCH ? "
        "ORDER BY tl.seq",
        (meeting_id, q),
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_full_text(db: aiosqlite.Connection, meeting_id: str) -> str:
    """Return concatenated transcript text for summarization."""
    cursor = await db.execute(
        "SELECT speaker, text FROM transcript_lines WHERE meeting_id = ? ORDER BY seq",
        (meeting_id,),
    )
    rows = await cursor.fetchall()
    parts = []
    for row in rows:
        speaker = row["speaker"] or "Unknown"
        parts.append(f"{speaker}: {row['text']}")
    return "\n".join(parts)
