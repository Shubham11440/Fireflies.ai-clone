"""Export router — GET /api/meetings/{id}/export"""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import Response

from backend.app.db import get_db
from backend.app.services import export

router = APIRouter(tags=["export"])


@router.get("/api/meetings/{meeting_id}/export")
async def export_meeting(
    meeting_id: str,
    format: str = Query("md", regex="^(md|txt|pdf)$"),
    content: str = Query("all", regex="^(all|transcript|summary)$"),
):
    db = await get_db()
    try:
        body, content_type, ext = await export.export_meeting(db, meeting_id, format, content)
    except ValueError as e:
        from backend.app.errors import NotFoundError
        raise NotFoundError("Meeting", meeting_id)

    meeting = await db.execute("SELECT title FROM meetings WHERE id = ?", (meeting_id,))
    row = await meeting.fetchone()
    title = row["title"] if row else "meeting"
    safe_title = "".join(c if c.isalnum() or c in " -_" else "" for c in title).strip().replace(" ", "_")

    return Response(
        content=body,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_title}.{ext}"'
        },
    )
