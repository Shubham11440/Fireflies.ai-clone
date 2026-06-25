"""Central configuration — loads .env via python-dotenv at import time."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend/ directory (one level up from app/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Settings:
    """Read-only settings populated from environment variables."""

    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    LLM_TIMEOUT_SEC: int = int(os.getenv("LLM_TIMEOUT_SEC", "60"))
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).resolve().parent.parent / "fireflies.db")
    )
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:3001,https://frontend-six-plum-32.vercel.app"
        ).split(",")
        if origin.strip()
    ]

    def is_mock(self) -> bool:
        key = self.GEMINI_API_KEY or ""
        is_placeholder = key.startswith("AIzaSyBaJEKt") or not key
        return self.LLM_PROVIDER.lower() != "gemini" or is_placeholder

    def summary_provider_name(self) -> str:
        return "mock" if self.is_mock() else "gemini"


settings = Settings()
