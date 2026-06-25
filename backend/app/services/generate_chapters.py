"""GenerateChaptersService — generates chapters for a meeting using the ChapterProvider adapter."""
from __future__ import annotations

import asyncio
import uuid

from backend.app.db import get_db
from backend.app.repositories import chapters as chapters_repo
from backend.app.repositories import transcript as transcript_repo
from backend.app.models.entities import Chapter
from backend.app.adapters.factory import get_chapter_provider
from backend.app.logging.logger import CustomLogger


def _uid() -> str:
    return uuid.uuid4().hex


async def run_chapters(meeting_id: str, logger: CustomLogger) -> list[dict]:
    """Generate chapters for a meeting and persist them. Returns the chapter list."""
    db = await get_db()

    # Load transcript lines with offsets
    lines = await transcript_repo.list_by_meeting(db, meeting_id, limit=5000, offset=0)
    if not lines:
        return []

    # Call chapter provider (sync, offloaded to thread)
    provider = get_chapter_provider()
    raw_chapters = await asyncio.to_thread(
        provider.generate_chapters, lines, logger=logger
    )

    if not raw_chapters:
        return []

    # Delete old chapters and insert new ones
    await chapters_repo.delete_by_meeting(db, meeting_id)

    entities = []
    for i, ch in enumerate(raw_chapters):
        entities.append(
            Chapter(
                id=_uid(),
                meeting_id=meeting_id,
                title=ch.get("title", f"Chapter {i + 1}"),
                start_offset=ch.get("start_offset"),
                summary=ch.get("summary"),
                seq=i + 1,
            )
        )

    await chapters_repo.create_many(db, entities)
    await db.commit()

    return [
        {
            "id": c.id,
            "title": c.title,
            "start_offset": c.start_offset,
            "summary": c.summary,
            "seq": c.seq,
        }
        for c in entities
    ]
