"""Repository for summary_processes table."""
from __future__ import annotations

from typing import Optional
import aiosqlite

from backend.app.models.entities import SummaryProcess


async def get_by_meeting(db: aiosqlite.Connection, meeting_id: str) -> Optional[dict]:
    cursor = await db.execute(
        "SELECT * FROM summary_processes WHERE meeting_id = ?", (meeting_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def upsert(db: aiosqlite.Connection, process: SummaryProcess) -> None:
    await db.execute(
        "INSERT INTO summary_processes "
        "(meeting_id, status, provider, model, result, error, chunk_count, "
        "processing_time, start_time, end_time, result_backup, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(meeting_id) DO UPDATE SET "
        "status=excluded.status, provider=excluded.provider, model=excluded.model, "
        "result=excluded.result, error=excluded.error, chunk_count=excluded.chunk_count, "
        "processing_time=excluded.processing_time, start_time=excluded.start_time, "
        "end_time=excluded.end_time, result_backup=excluded.result_backup, "
        "updated_at=excluded.updated_at",
        (
            process.meeting_id,
            process.status,
            process.provider,
            process.model,
            process.result,
            process.error,
            process.chunk_count,
            process.processing_time,
            process.start_time,
            process.end_time,
            process.result_backup,
            process.created_at,
            process.updated_at,
        ),
    )
    await db.commit()


async def update_status(
    db: aiosqlite.Connection,
    meeting_id: str,
    status: str,
    *,
    result: Optional[str] = None,
    error: Optional[str] = None,
    provider: Optional[str] = None,
    chunk_count: int = 0,
    processing_time: float = 0.0,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    result_backup: Optional[str] = None,
) -> None:
    from datetime import datetime, timezone

    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    fields = {"status": status, "updated_at": now}
    if result is not None:
        fields["result"] = result
    if error is not None:
        fields["error"] = error
    if provider is not None:
        fields["provider"] = provider
    if chunk_count:
        fields["chunk_count"] = chunk_count
    if processing_time:
        fields["processing_time"] = processing_time
    if start_time:
        fields["start_time"] = start_time
    if end_time:
        fields["end_time"] = end_time
    if result_backup is not None:
        fields["result_backup"] = result_backup

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [meeting_id]
    await db.execute(
        f"UPDATE summary_processes SET {set_clause} WHERE meeting_id = ?", values
    )
    await db.commit()
