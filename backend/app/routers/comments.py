"""Comments router — POST/GET/DELETE /api/meetings/{id}/comments"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.db import get_db
from backend.app.repositories import comments as comments_repo
from backend.app.errors import NotFoundError

router = APIRouter(tags=["comments"])


class CreateCommentRequest(BaseModel):
    line_id: str
    body: str
    author: str = "Default User"


@router.post("/api/meetings/{meeting_id}/comments", status_code=201)
async def add_comment(meeting_id: str, body: CreateCommentRequest):
    db = await get_db()
    row = {
        "id": str(uuid.uuid4()),
        "meeting_id": meeting_id,
        "line_id": body.line_id,
        "author": body.author,
        "body": body.body,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await comments_repo.create(db, row)
    return row


@router.get("/api/meetings/{meeting_id}/comments")
async def list_comments(meeting_id: str):
    db = await get_db()
    items = await comments_repo.list_by_meeting(db, meeting_id)
    return {"items": items}


@router.delete("/api/meetings/{meeting_id}/comments/{comment_id}", status_code=204)
async def delete_comment(meeting_id: str, comment_id: str):
    db = await get_db()
    deleted = await comments_repo.delete_by_id(db, comment_id)
    if not deleted:
        raise NotFoundError("Comment", comment_id)
