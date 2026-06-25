"""Meetings router — CRUD for /api/meetings"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Request, Query, Body

from backend.app.db import get_db
from backend.app.repositories import meetings as meetings_repo
from backend.app.repositories import participants as participants_repo
from backend.app.schemas import (
    MeetingListResponse,
    MeetingListItem,
    CreateMeetingRequest,
    CreateMeetingResponse,
    UpdateMeetingRequest,
)

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


@router.post("", response_model=CreateMeetingResponse, status_code=201)
async def create_meeting(req: CreateMeetingRequest, request: Request):
    from backend.app.services.create_meeting import create_meeting as do_create

    result = await do_create(
        title=req.title,
        occurred_at=req.occurred_at,
        duration_sec=req.duration_sec,
        source=req.source,
        media_url=req.media_url,
        participant_names=req.participant_names,
        transcript_content=req.transcript_content,
        transcript_format=req.transcript_format,
    )
    return CreateMeetingResponse(**result)


@router.patch("/{meeting_id}")
async def update_meeting(meeting_id: str, req: UpdateMeetingRequest, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    from datetime import datetime, timezone
    fields: dict = {}
    if req.title is not None:
        fields["title"] = req.title
    if req.occurred_at is not None:
        fields["occurred_at"] = req.occurred_at
    if req.duration_sec is not None:
        fields["duration_sec"] = req.duration_sec
    if req.media_url is not None:
        fields["media_url"] = req.media_url
    if fields:
        fields["updated_at"] = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        await meetings_repo.update(db, meeting_id, **fields)

    # Update participants if provided
    if req.participant_names is not None:
        # Delete existing and re-create
        await db.execute("DELETE FROM participants WHERE meeting_id = ?", (meeting_id,))
        if req.participant_names:
            import uuid as _uuid
            from backend.app.models.entities import Participant
            parts = [
                Participant(id=str(_uuid.uuid4()), meeting_id=meeting_id, name=n.strip())
                for n in req.participant_names if n.strip()
            ]
            if parts:
                await participants_repo.create_many(db, parts)
        await db.commit()

    updated = await meetings_repo.get_by_id(db, meeting_id)
    parts = await participants_repo.list_by_meeting(db, meeting_id)
    return {**updated, "participants": parts}


@router.delete("/{meeting_id}", status_code=204)
async def delete_meeting(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    # FK cascades handle dependent data
    await meetings_repo.delete_by_id(db, meeting_id)
    return None
