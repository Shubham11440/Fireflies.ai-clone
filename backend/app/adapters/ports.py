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
