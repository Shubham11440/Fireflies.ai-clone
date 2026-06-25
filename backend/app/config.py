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

    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    LLM_TIMEOUT_SEC: int = int(os.getenv("LLM_TIMEOUT_SEC", "60"))

    def is_mock(self) -> bool:
        return self.LLM_PROVIDER.lower() != "gemini" or not self.GEMINI_API_KEY

    def summary_provider_name(self) -> str:
        return "mock" if self.is_mock() else "gemini"


settings = Settings()
