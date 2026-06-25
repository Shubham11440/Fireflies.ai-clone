"""Chat router — /api/meetings/{id}/chat and /api/chat/{threadId}/messages"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.db import get_db
from backend.app.logging.logger import CustomLogger
from backend.app.services import chat_service

router = APIRouter(tags=["chat"])


class PostMessageRequest(BaseModel):
    question: str


@router.post("/api/meetings/{meeting_id}/chat", status_code=201)
async def create_or_get_thread(meeting_id: str):
    """Get or create a chat thread for a meeting (one thread per meeting)."""
    db = await get_db()
    now = datetime.now(timezone.utc).isoformat()
    thread = await chat_service.get_or_create_thread(
        db, meeting_id, str(uuid.uuid4()), now
    )
    return {"thread_id": thread["id"], "meeting_id": meeting_id, "created_at": thread["created_at"]}


@router.post("/api/chat/{thread_id}/messages", status_code=201)
async def post_message(thread_id: str, body: PostMessageRequest):
    """Send a user question and get an AI answer."""
    db = await get_db()
    logger = CustomLogger()
    now = datetime.now(timezone.utc).isoformat()

    # We need the meeting_id from the thread — fetch it
    from backend.app.repositories import chat as chat_repo
    thread = await chat_repo.get_thread(db, thread_id)
    if not thread:
        from backend.app.errors import NotFoundError
        raise NotFoundError("ChatThread", thread_id)

    result = await chat_service.post_message(
        db=db,
        thread_id=thread_id,
        meeting_id=thread["meeting_id"],
        user_message_id=str(uuid.uuid4()),
        assistant_message_id=str(uuid.uuid4()),
        question=body.question,
        created_at=now,
        logger=logger,
    )
    return result


@router.get("/api/chat/{thread_id}/messages")
async def get_messages(thread_id: str):
    """Retrieve the full chat history for a thread."""
    db = await get_db()
    messages = await chat_service.get_history(db, thread_id)
    return {"messages": messages}
