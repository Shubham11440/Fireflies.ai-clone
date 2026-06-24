from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class User:
    id: str
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str = ""


@dataclass
class Meeting:
    id: str
    user_id: str
    title: str
    occurred_at: str
    duration_sec: float = 0.0
    source: str = "manual"
    media_url: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class TranscriptLine:
    id: str
    meeting_id: str
    seq: int
    text: str
    speaker: Optional[str] = None
    timestamp: Optional[str] = None
    start_offset: Optional[float] = None
    end_offset: Optional[float] = None


@dataclass
class Participant:
    id: str
    meeting_id: str
    name: str
    email: Optional[str] = None
    role: Optional[str] = None


@dataclass
class SummaryProcess:
    meeting_id: str
    status: str = "pending"
    provider: Optional[str] = None
    model: Optional[str] = None
    result: Optional[str] = None
    error: Optional[str] = None
    chunk_count: int = 0
    processing_time: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    result_backup: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class ActionItem:
    id: str
    meeting_id: str
    text: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: bool = False
    source_line_id: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Topic:
    id: str
    name: str


@dataclass
class Chapter:
    id: str
    meeting_id: str
    title: str
    seq: int
    start_offset: Optional[float] = None
    summary: Optional[str] = None


@dataclass
class MeetingNote:
    meeting_id: str
    notes_markdown: Optional[str] = None
    notes_json: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Highlight:
    id: str
    meeting_id: str
    line_id: str
    color: str = "yellow"
    note: Optional[str] = None
    created_at: str = ""


@dataclass
class Comment:
    id: str
    meeting_id: str
    line_id: str
    body: str
    author: Optional[str] = None
    created_at: str = ""


@dataclass
class ChatThread:
    id: str
    meeting_id: str
    created_at: str = ""


@dataclass
class ChatMessage:
    id: str
    thread_id: str
    role: str
    content: str
    created_at: str = ""
