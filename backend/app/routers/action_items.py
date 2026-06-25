"""Action items router — CRUD endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Request

from backend.app.db import get_db
from backend.app.repositories import action_items as ai_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.schemas import ActionItemCreateRequest, ActionItemUpdateRequest, ActionItemResponse
from backend.app.errors import NotFoundError

router = APIRouter(tags=["action-items"])


def _now() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/api/meetings/{meeting_id}/action-items", response_model=list[ActionItemResponse])
async def list_action_items(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    items = await ai_repo.list_by_meeting(db, meeting_id)
    return [ActionItemResponse(**item) for item in items]


@router.post("/api/meetings/{meeting_id}/action-items", response_model=ActionItemResponse, status_code=201)
async def create_action_item(meeting_id: str, body: ActionItemCreateRequest, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    now = _now()
    item = await ai_repo.create(
        db,
        __import__("backend.app.models.entities", fromlist=["ActionItem"]).ActionItem(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            text=body.text,
            assignee=body.assignee,
            due_date=body.due_date,
            created_at=now,
            updated_at=now,
        ),
    )
    created = await ai_repo.get_by_id(db, item.id if hasattr(item, "id") else str(uuid.uuid4()))
    # Fetch the newly created item
    items = await ai_repo.list_by_meeting(db, meeting_id)
    last = items[-1] if items else None
    return ActionItemResponse(**last) if last else None


@router.patch("/api/action-items/{item_id}", response_model=ActionItemResponse)
async def update_action_item(item_id: str, body: ActionItemUpdateRequest, request: Request):
    db = await get_db()
    existing = await ai_repo.get_by_id(db, item_id)
    if not existing:
        raise NotFoundError("ActionItem", item_id)

    fields = {}
    if body.text is not None:
        fields["text"] = body.text
    if body.assignee is not None:
        fields["assignee"] = body.assignee
    if body.due_date is not None:
        fields["due_date"] = body.due_date
    if body.is_completed is not None:
        fields["is_completed"] = int(body.is_completed)
    fields["updated_at"] = _now()

    await ai_repo.update(db, item_id, **fields)
    updated = await ai_repo.get_by_id(db, item_id)
    return ActionItemResponse(**updated)


@router.delete("/api/action-items/{item_id}", status_code=204)
async def delete_action_item(item_id: str, request: Request):
    db = await get_db()
    existing = await ai_repo.get_by_id(db, item_id)
    if not existing:
        raise NotFoundError("ActionItem", item_id)

    await ai_repo.delete_by_id(db, item_id)
