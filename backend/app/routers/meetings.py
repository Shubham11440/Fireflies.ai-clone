"""Meetings router — GET /api/meetings, GET /api/meetings/{id}"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Request, Query

from backend.app.db import get_db
from backend.app.repositories import meetings as meetings_repo
from backend.app.repositories import participants as participants_repo
from backend.app.schemas import MeetingListResponse, MeetingListItem

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.get("", response_model=MeetingListResponse)
async def list_meetings(
    request: Request,
    q: Optional[str] = Query(None, description="Search by title or participant name"),
    participant: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    sort: str = Query("recent", description="recent|title|duration"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    logger = getattr(request.state, "logger", None)
    db = await get_db()
    user_id = "user-default"

    items = await meetings_repo.list_meetings(
        db, user_id=user_id, q=q, sort=sort, limit=limit, offset=offset
    )
    total = await meetings_repo.count_meetings(db, user_id=user_id, q=q)

    has_more = (offset + limit) < total

    return MeetingListResponse(
        items=[MeetingListItem(**item) for item in items],
        has_more=has_more,
        total=total,
    )


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    parts = await participants_repo.list_by_meeting(db, meeting_id)
    return {**meeting, "participants": parts}
