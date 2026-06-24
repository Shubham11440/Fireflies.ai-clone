"""Structured JSON logger — pino-python based CustomLogger."""
from __future__ import annotations

import json
import time
from typing import Any, Optional

try:
    import pino
except ImportError:
    pino = None  # type: ignore

from backend.app.logging.events import Events, EventTypes, Messages


class CustomLogger:
    MESSAGE = Messages
    EVENT = Events
    EVENT_TYPE = EventTypes

    entity = {"name": "fireflies-clone-backend"}

    def __init__(self, request_id: str = "", user_id: str = "", route: str = "", method: str = ""):
        self.request_id = request_id
        self.user_id = user_id
        self.route = route
        self.method = method
        self._start = time.monotonic()
        self._record: dict[str, Any] = {}

    def _base(self) -> dict[str, Any]:
        base: dict[str, Any] = {
            "entity": self.entity,
        }
        if self.request_id:
            base["request_id"] = self.request_id
        if self.user_id:
            base["user_id"] = self.user_id
        if self.route:
            base["route"] = self.route
            base["method"] = self.method
        return base

    def info(self, json_data: dict[str, Any]) -> None:
        entry = {**self._base(), **json_data}
        print(json.dumps(entry, default=str))

    def error(self, json_data: dict[str, Any]) -> None:
        entry = {**self._base(), "level": "error", **json_data}
        print(json.dumps(entry, default=str))

    def warning(self, json_data: dict[str, Any]) -> None:
        entry = {**self._base(), "level": "warn", **json_data}
        print(json.dumps(entry, default=str))

    def debug(self, json_data: dict[str, Any]) -> None:
        entry = {**self._base(), "level": "debug", **json_data}
        print(json.dumps(entry, default=str))

    def start_recording(self) -> None:
        self._start = time.monotonic()
        self._record = {}

    def record_time(self, event: str) -> None:
        elapsed = (time.monotonic() - self._start) * 1000
        self._record[event] = round(elapsed, 2)

    def flush(self) -> None:
        if self._record:
            self.info({"event": "REQUEST_TIMINGS", "timings": self._record})

    def set_user(self, user_id: str) -> None:
        self.user_id = user_id
