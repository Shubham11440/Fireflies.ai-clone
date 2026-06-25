"""Meeting notes router — get and update notes."""
from __future__ import annotations

from fastapi import APIRouter, Request

from backend.app.db import get_db
from backend.app.repositories import meeting_notes as notes_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.errors import NotFoundError

router = APIRouter(tags=["notes"])


@router.get("/api/meetings/{meeting_id}/notes")
async def get_notes(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    notes = await notes_repo.get_by_meeting(db, meeting_id)
    if not notes:
        return {"meeting_id": meeting_id, "notes_markdown": None, "notes_json": None}

    return {
        "meeting_id": notes["meeting_id"],
        "notes_markdown": notes["notes_markdown"],
        "notes_json": notes["notes_json"],
    }


@router.put("/api/meetings/{meeting_id}/notes")
async def update_notes(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    body = await request.json()
    await notes_repo.upsert(
        db,
        meeting_id,
        notes_markdown=body.get("notes_markdown"),
        notes_json=body.get("notes_json"),
    )
    await db.commit()

    return {"meeting_id": meeting_id, "status": "updated"}
