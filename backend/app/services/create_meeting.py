"""CreateMeetingService — transactional creation of meeting + participants + transcript."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from backend.app.db import get_db
from backend.app.models.entities import Meeting, Participant, TranscriptLine
from backend.app.repositories import meeting_notes as notes_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.repositories import participants as participants_repo
from backend.app.repositories import transcript as transcript_repo
from backend.app.services.transcript_import import (
    ParsedLine,
    assign_sequential_offsets,
    parse_json,
    parse_txt,
    parse_vtt,
)


def _now() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _uid() -> str:
    return str(uuid.uuid4())


def parse_transcript_content(
    content: str, file_format: str, duration_sec: float
) -> list[ParsedLine]:
    """Parse raw transcript content based on format."""
    if file_format == "vtt":
        lines = parse_vtt(content)
    elif file_format == "json":
        lines = parse_json(content)
    else:
        lines = parse_txt(content)

    return assign_sequential_offsets(lines, duration_sec)


async def create_meeting(
    *,
    title: str,
    occurred_at: str,
    duration_sec: float,
    source: str = "manual",
    media_url: Optional[str] = None,
    participant_names: list[str] | None = None,
    transcript_content: Optional[str] = None,
    transcript_format: str = "txt",
) -> dict:
    """Create a meeting with participants and optional transcript in a single transaction.

    Returns the created meeting id and basic info.
    """
    db = await get_db()
    meeting_id = _uid()
    now = _now()
    user_id = "user-default"

    try:
        await db.execute("BEGIN")

        # Create meeting
        meeting = Meeting(
            id=meeting_id,
            user_id=user_id,
            title=title,
            occurred_at=occurred_at,
            duration_sec=duration_sec,
            source=source,
            media_url=media_url,
            created_at=now,
            updated_at=now,
        )
        await meetings_repo.create(db, meeting)

        # Create participants
        if participant_names:
            parts = []
            for name in participant_names:
                name = name.strip()
                if name:
                    parts.append(
                        Participant(id=_uid(), meeting_id=meeting_id, name=name)
                    )
            if parts:
                await participants_repo.create_many(db, parts)

        # Parse and insert transcript lines
        line_count = 0
        if transcript_content and transcript_content.strip():
            parsed = parse_transcript_content(transcript_content, transcript_format, duration_sec)
            if parsed:
                lines = []
                for i, pl in enumerate(parsed):
                    lines.append(
                        TranscriptLine(
                            id=_uid(),
                            meeting_id=meeting_id,
                            seq=i + 1,
                            text=pl.text,
                            speaker=pl.speaker,
                            timestamp=pl.timestamp,
                            start_offset=pl.start_offset,
                            end_offset=pl.end_offset,
                        )
                    )
                await transcript_repo.create_many(db, lines)

                # Populate FTS index
                for tl in lines:
                    await db.execute(
                        "INSERT INTO transcript_fts (line_id, meeting_id, text) VALUES (?, ?, ?)",
                        (tl.id, tl.meeting_id, tl.text),
                    )
                line_count = len(lines)

        # Create empty meeting notes
        await notes_repo.upsert(db, meeting_id)

        await db.execute("COMMIT")

        return {
            "id": meeting_id,
            "title": title,
            "transcript_lines": line_count,
        }

    except Exception:
        await db.execute("ROLLBACK")
        raise
