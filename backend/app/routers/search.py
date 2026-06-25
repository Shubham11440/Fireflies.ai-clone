"""Search router — GET /api/search"""
from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Literal

from backend.app.db import get_db
from backend.app.repositories import search as search_repo

router = APIRouter(tags=["search"])


@router.get("/api/search")
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    type: Literal["all", "transcript", "summary", "action_item"] = Query("all"),
    limit: int = Query(30, ge=1, le=100),
):
    """Search across all meetings: transcripts (FTS5), summaries, and action items."""
    if not q.strip():
        return {"items": [], "total": 0}

    db = await get_db()
    items = await search_repo.global_search(db, q.strip(), search_type=type, limit=limit)
    return {"items": items, "total": len(items)}
