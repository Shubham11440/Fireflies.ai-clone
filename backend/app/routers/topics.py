"""Topics router — POST/DELETE /api/meetings/{id}/topics, GET /api/topics"""
from __future__ import annotations

from fastapi import APIRouter, Request

from backend.app.db import get_db
from backend.app.repositories import topics as topics_repo
from backend.app.schemas import TopicResponse, TopicCreateRequest

router = APIRouter(tags=["topics"])


@router.get("/api/topics", response_model=list[TopicResponse])
async def list_topics(request: Request):
    db = await get_db()
    rows = await topics_repo.list_all(db)
    return [TopicResponse(**r) for r in rows]


@router.post("/api/meetings/{meeting_id}/topics", status_code=201)
async def add_topic_to_meeting(meeting_id: str, req: TopicCreateRequest, request: Request):
    db = await get_db()
    topic_id = await topics_repo.get_or_create(db, req.name.strip())
    await topics_repo.link_to_meeting(db, meeting_id, topic_id)
    return {"meeting_id": meeting_id, "topic_id": topic_id, "name": req.name.strip()}


@router.delete("/api/meetings/{meeting_id}/topics/{topic_id}", status_code=204)
async def remove_topic_from_meeting(meeting_id: str, topic_id: str, request: Request):
    db = await get_db()
    removed = await topics_repo.unlink_from_meeting(db, meeting_id, topic_id)
    if not removed:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Topic link", f"{meeting_id}/{topic_id}")
    return None
