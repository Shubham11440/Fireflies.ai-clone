"""Summary router — kick off, status, update."""
from __future__ import annotations

import json
from fastapi import APIRouter, Request, BackgroundTasks

from backend.app.db import get_db
from backend.app.repositories import summary as summary_repo
from backend.app.repositories import meetings as meetings_repo
from backend.app.services.generate_summary import run_summary
from backend.app.errors import NotFoundError, SummaryError

router = APIRouter(prefix="/api/meetings/{meeting_id}/summary", tags=["summary"])


@router.post("", status_code=202)
async def generate_summary(meeting_id: str, request: Request, background_tasks: BackgroundTasks):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    logger = getattr(request.state, "logger", None)

    # Check if already processing
    existing = await summary_repo.get_by_meeting(db, meeting_id)
    if existing and existing["status"] in ("pending", "processing"):
        return {"meeting_id": meeting_id, "status": existing["status"]}

    # Create/update process row as pending
    from datetime import datetime, timezone
    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    from backend.app.models.entities import SummaryProcess
    process = SummaryProcess(
        meeting_id=meeting_id,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    await summary_repo.upsert(db, process)

    # Kick off background task
    background_tasks.add_task(run_summary, meeting_id, logger)

    return {"meeting_id": meeting_id, "status": "pending"}


@router.get("")
async def get_summary(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    process = await summary_repo.get_by_meeting(db, meeting_id)
    if not process:
        return {"meeting_id": meeting_id, "status": "none"}

    result = None
    if process["result"]:
        try:
            result = json.loads(process["result"])
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "meeting_id": process["meeting_id"],
        "status": process["status"],
        "provider": process["provider"],
        "result": result,
        "error": process["error"],
        "chunk_count": process["chunk_count"],
        "processing_time": process["processing_time"],
    }


@router.put("")
async def update_summary(meeting_id: str, request: Request):
    db = await get_db()
    meeting = await meetings_repo.get_by_id(db, meeting_id)
    if not meeting:
        raise NotFoundError("Meeting", meeting_id)

    body = await request.json()
    result = body.get("result")
    if result is None:
        raise SummaryError("No summary result provided")

    # Backup current result
    existing = await summary_repo.get_by_meeting(db, meeting_id)
    result_backup = existing["result"] if existing else None

    from datetime import datetime, timezone
    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    await db.execute(
        "UPDATE summary_processes SET result = ?, result_backup = ?, updated_at = ? "
        "WHERE meeting_id = ?",
        (json.dumps(result), result_backup, now, meeting_id),
    )
    await db.commit()

    return {"meeting_id": meeting_id, "status": "updated"}
