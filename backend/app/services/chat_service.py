"""Chat service — orchestrates Q&A chat for a meeting using the ChatProvider adapter."""
from __future__ import annotations

import json

import aiosqlite

from backend.app.adapters.chat.mock import MockChatAdapter
from backend.app.logging.logger import CustomLogger
from backend.app.repositories import chat as chat_repo
from backend.app.repositories import transcript as transcript_repo
from backend.app.repositories import summary as summary_repo
from backend.app.errors import NotFoundError

# Singleton adapter (mock by default; swap for LLMChatAdapter via config)
_chat_provider = MockChatAdapter()


async def get_or_create_thread(
    db: aiosqlite.Connection,
    meeting_id: str,
    thread_id: str,
    created_at: str,
) -> dict:
    return await chat_repo.get_or_create_thread_for_meeting(
        db, meeting_id, thread_id, created_at
    )


async def post_message(
    db: aiosqlite.Connection,
    thread_id: str,
    meeting_id: str,
    user_message_id: str,
    assistant_message_id: str,
    question: str,
    created_at: str,
    logger: CustomLogger,
) -> dict:
    """
    Persist the user message, call the ChatProvider, persist assistant reply,
    and return both messages.
    """
    # Validate thread exists
    thread = await chat_repo.get_thread(db, thread_id)
    if not thread:
        raise NotFoundError("ChatThread", thread_id)

    # Build context: last 5000 chars of transcript + summary
    lines = await transcript_repo.list_by_meeting(db, meeting_id, limit=500, offset=0)
    transcript_text = " ".join(
        f"{l.get('speaker', 'Speaker')}: {l.get('text', '')}" for l in lines
    )[:5000]

    summary_row = await summary_repo.get_by_meeting(db, meeting_id)
    summary_text = ""
    if summary_row and summary_row.get("result"):
        try:
            s = json.loads(summary_row["result"])
            for key in ["session_summary", "key_decisions", "next_steps"]:
                section = s.get(key, {})
                for block in section.get("blocks", []):
                    summary_text += block.get("content", "") + " "
            summary_text = summary_text[:2000]
        except (json.JSONDecodeError, TypeError):
            pass

    # Persist user message
    user_msg = {
        "id": user_message_id,
        "thread_id": thread_id,
        "role": "user",
        "content": question,
        "created_at": created_at,
    }
    await chat_repo.add_message(db, user_msg)

    # Call adapter
    logger.info({"event": "CHAT_QUESTION", "event_type": "internal_process"})
    answer = _chat_provider.ask(
        question=question,
        transcript_text=transcript_text,
        summary_text=summary_text,
        logger=logger,
    )

    # Persist assistant reply
    from datetime import datetime, timezone
    assistant_msg = {
        "id": assistant_message_id,
        "thread_id": thread_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await chat_repo.add_message(db, assistant_msg)
    logger.info({"event": "CHAT_ANSWERED", "event_type": "internal_process"})

    return {"user": user_msg, "assistant": assistant_msg}


async def get_history(db: aiosqlite.Connection, thread_id: str) -> list[dict]:
    thread = await chat_repo.get_thread(db, thread_id)
    if not thread:
        raise NotFoundError("ChatThread", thread_id)
    return await chat_repo.list_messages(db, thread_id)
