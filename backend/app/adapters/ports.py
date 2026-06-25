"""Port definitions (Protocol interfaces) for the Adapter pattern."""
from __future__ import annotations

from typing import Protocol, runtime_checkable

from backend.app.logging.logger import CustomLogger


@runtime_checkable
class UserProvider(Protocol):
    def get_default_user(self) -> dict: ...


@runtime_checkable
class SummaryProvider(Protocol):
    def summarize(self, transcript: str, *, logger: CustomLogger) -> dict: ...


@runtime_checkable
class ChatProvider(Protocol):
    def ask(
        self,
        question: str,
        transcript_text: str,
        summary_text: str,
        *,
        logger: CustomLogger,
    ) -> str: ...

