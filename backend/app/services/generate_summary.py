"""GenerateSummaryService — async state machine for summary generation."""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone

from backend.app.db import get_db
from backend.app.repositories import summary as summary_repo
from backend.app.repositories import transcript as transcript_repo
from backend.app.repositories import action_items as ai_repo
from backend.app.repositories import chapters as chapters_repo
from backend.app.models.entities import SummaryProcess, ActionItem, Chapter
from backend.app.adapters.summary.mock import MockSummaryProvider
from backend.app.logging.logger import CustomLogger
from backend.app.logging.events import Events


def _now() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


async def run_summary(meeting_id: str, logger: CustomLogger) -> None:
    """Background task: generate summary for a meeting."""
    db = await get_db()
    start_time = _now()
    start_monotonic = time.monotonic()

    try:
        # Mark as processing
        await summary_repo.update_status(
            db, meeting_id, "processing", start_time=start_time
        )
        logger.info({
            "event": Events.SUMMARY_STARTED,
            "event_type": "internal_process",
            "meeting_id": meeting_id,
        })

        # Load transcript
        transcript_text = await transcript_repo.get_full_text(db, meeting_id)
        if not transcript_text.strip():
            raise ValueError("No transcript content to summarize")

        # Generate summary (mock provider for now)
        provider = MockSummaryProvider()
        result = provider.summarize(transcript_text, logger=logger)

        # Extract action items from summary
        action_blocks = result.get("action_items", {}).get("blocks", [])
        for block in action_blocks:
            if block.get("content"):
                item = ActionItem(
                    id=__import__("uuid").uuid4().hex,
                    meeting_id=meeting_id,
                    text=block["content"],
                    created_at=_now(),
                    updated_at=_now(),
                )
                await ai_repo.create(db, item)

        # Extract chapters from key_decisions section
        decision_blocks = result.get("key_decisions", {}).get("blocks", [])
        chaps = []
        for i, block in enumerate(decision_blocks):
            if block.get("content"):
                chaps.append(
                    Chapter(
                        id=__import__("uuid").uuid4().hex,
                        meeting_id=meeting_id,
                        title=block["content"],
                        seq=i + 1,
                    )
                )
        if chaps:
            await chapters_repo.create_many(db, chaps)

        elapsed = time.monotonic() - start_monotonic
        end_time = _now()

        # Mark as completed
        await summary_repo.update_status(
            db,
            meeting_id,
            "completed",
            result=json.dumps(result),
            provider="mock",
            chunk_count=1,
            processing_time=round(elapsed, 3),
            end_time=end_time,
        )
        logger.info({
            "event": Events.SUMMARY_COMPLETED,
            "event_type": "internal_process",
            "meeting_id": meeting_id,
            "processing_time": round(elapsed, 3),
        })

    except Exception as e:
        end_time = _now()
        await summary_repo.update_status(
            db,
            meeting_id,
            "failed",
            error=str(e),
            end_time=end_time,
        )
        logger.error({
            "event": Events.SUMMARY_FAILED,
            "event_type": "internal_process",
            "meeting_id": meeting_id,
            "error": str(e),
        })
