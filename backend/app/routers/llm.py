"""LLM status router — exposes provider configuration to the frontend."""
from __future__ import annotations

from fastapi import APIRouter

from backend.app.config import settings

router = APIRouter()


@router.get("/api/llm/status")
async def llm_status():
    return {
        "provider": settings.summary_provider_name(),
        "is_mock": settings.is_mock(),
    }
