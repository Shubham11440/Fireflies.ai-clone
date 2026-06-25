"""Highlights router — POST/GET/DELETE /api/meetings/{id}/highlights"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.app.db import get_db
from backend.app.repositories import highlights as highlights_repo
from backend.app.errors import NotFoundError

router = APIRouter(tags=["highlights"])

HIGHLIGHT_COLORS = {"yellow", "green", "blue", "pink", "purple"}


class CreateHighlightRequest(BaseModel):
    line_id: str
    color: str = "yellow"
    note: Optional[str] = None


@router.post("/api/meetings/{meeting_id}/highlights", status_code=201)
async def add_highlight(meeting_id: str, body: CreateHighlightRequest):
    color = body.color if body.color in HIGHLIGHT_COLORS else "yellow"
    db = await get_db()
    row = {
        "id": str(uuid.uuid4()),
        "meeting_id": meeting_id,
        "line_id": body.line_id,
        "color": color,
        "note": body.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await highlights_repo.create(db, row)
    return row


@router.get("/api/meetings/{meeting_id}/highlights")
async def list_highlights(meeting_id: str):
    db = await get_db()
    items = await highlights_repo.list_by_meeting(db, meeting_id)
    return {"items": items}


@router.delete("/api/meetings/{meeting_id}/highlights/{highlight_id}", status_code=204)
async def delete_highlight(meeting_id: str, highlight_id: str):
    db = await get_db()
    deleted = await highlights_repo.delete_by_id(db, highlight_id)
    if not deleted:
        raise NotFoundError("Highlight", highlight_id)
