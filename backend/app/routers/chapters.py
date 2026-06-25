"""Chapters router — list chapters for a meeting."""
from __future__ import annotations

from fastapi import APIRouter, Request

from backend.app.db import get_db
from backend.app.repositories import chapters as chapters_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.schemas import ChapterResponse
from backend.app.errors import NotFoundError

router = APIRouter(tags=["chapters"])


@router.get("/api/meetings/{meeting_id}/chapters", response_model=list[ChapterResponse])
async def list_chapters(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    items = await chapters_repo.list_by_meeting(db, meeting_id)
    return [ChapterResponse(**item) for item in items]
