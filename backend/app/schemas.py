"""Pydantic request/response models for the API."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


# ── Meetings ─────────────────────────────────────────────────
class MeetingListItem(BaseModel):
    id: str
    title: str
    occurred_at: str
    duration_sec: float
    source: str
    media_url: Optional[str] = None
    created_at: str
    updated_at: str
    participant_names: Optional[str] = None  # comma-separated from GROUP_CONCAT
    topic_names: Optional[str] = None
    summary_status: Optional[str] = None
    action_item_count: int = 0


class MeetingListResponse(BaseModel):
    items: list[MeetingListItem]
    has_more: bool
    total: int


class MeetingDetailResponse(BaseModel):
    id: str
    title: str
    occurred_at: str
    duration_sec: float
    source: str
    media_url: Optional[str] = None
    created_at: str
    updated_at: str


# ── Transcript ───────────────────────────────────────────────
class TranscriptLineResponse(BaseModel):
    id: str
    meeting_id: str
    seq: int
    speaker: Optional[str] = None
    text: str
    timestamp: Optional[str] = None
    start_offset: Optional[float] = None
    end_offset: Optional[float] = None


class TranscriptResponse(BaseModel):
    lines: list[TranscriptLineResponse]
    total_count: int
    has_more: bool


# ── Participants ─────────────────────────────────────────────
class ParticipantResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    role: Optional[str] = None


# ── Action Items ─────────────────────────────────────────────
class ActionItemResponse(BaseModel):
    id: str
    meeting_id: str
    text: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: bool = False
    source_line_id: Optional[str] = None
    created_at: str
    updated_at: str


class ActionItemCreateRequest(BaseModel):
    text: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ActionItemUpdateRequest(BaseModel):
    text: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: Optional[bool] = None


# ── Summary ──────────────────────────────────────────────────
class Block(BaseModel):
    id: str
    type: str
    content: str
    color: Optional[str] = None


class SummarySection(BaseModel):
    title: str
    blocks: list[Block]


class SummaryResponse(BaseModel):
    meeting_name: str
    people: SummarySection
    session_summary: SummarySection
    action_items: SummarySection
    key_decisions: SummarySection
    next_steps: SummarySection


class SummaryProcessResponse(BaseModel):
    meeting_id: str
    status: str
    provider: Optional[str] = None
    result: Optional[SummaryResponse] = None
    error: Optional[str] = None
    chunk_count: int = 0
    processing_time: float = 0.0


# ── Chapters ─────────────────────────────────────────────────
class ChapterResponse(BaseModel):
    id: str
    title: str
    start_offset: Optional[float] = None
    summary: Optional[str] = None
    seq: int


# ── Topics ───────────────────────────────────────────────────
class TopicResponse(BaseModel):
    id: str
    name: str
    meeting_count: int = 0


class TopicCreateRequest(BaseModel):
    name: str


# ── Create / Update Meeting ───────────────────────────────────
class CreateMeetingRequest(BaseModel):
    title: str
    occurred_at: str
    duration_sec: float = 0.0
    source: str = "manual"
    media_url: Optional[str] = None
    participant_names: list[str] = []
    transcript_content: Optional[str] = None
    transcript_format: str = "txt"  # txt | vtt | json


class UpdateMeetingRequest(BaseModel):
    title: Optional[str] = None
    occurred_at: Optional[str] = None
    duration_sec: Optional[float] = None
    media_url: Optional[str] = None
    participant_names: Optional[list[str]] = None


class CreateMeetingResponse(BaseModel):
    id: str
    title: str
    transcript_lines: int = 0
