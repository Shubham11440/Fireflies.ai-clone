"""Transcript router — paginated lines + FTS search."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Request, Query

from backend.app.db import get_db
from backend.app.repositories import transcript as transcript_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.schemas import TranscriptResponse, TranscriptLineResponse

router = APIRouter(prefix="/api/meetings/{meeting_id}/transcript", tags=["transcript"])


@router.get("", response_model=TranscriptResponse)
async def get_transcript(
    meeting_id: str,
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    db = await get_db()

    # Verify meeting exists
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    lines = await transcript_repo.list_by_meeting(db, meeting_id, limit=limit, offset=offset)
    total = await transcript_repo.count_by_meeting(db, meeting_id)

    return TranscriptResponse(
        lines=[TranscriptLineResponse(**line) for line in lines],
        total_count=total,
        has_more=(offset + limit) < total,
    )


@router.get("/search")
async def search_transcript(
    meeting_id: str,
    request: Request,
    q: str = Query(..., min_length=1),
):
    db = await get_db()

    # Verify meeting exists
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    results = await transcript_repo.search_in_meeting(db, meeting_id, q)

    return {
        "items": [
            {
                "line_id": r["id"],
                "meeting_id": r["meeting_id"],
                "seq": r["seq"],
                "speaker": r["speaker"],
                "text": r["text"],
                "start_offset": r["start_offset"],
            }
            for r in results
        ],
        "total": len(results),
    }
