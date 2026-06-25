"""Adapter factory — returns the correct provider singleton based on config."""
from __future__ import annotations

from backend.app.config import settings
from backend.app.adapters.ports import SummaryProvider, ChatProvider, ChapterProvider
from backend.app.adapters.summary.mock import MockSummaryProvider
from backend.app.adapters.chat.mock import MockChatAdapter
from backend.app.adapters.chapters.mock import MockChapterProvider

_summary_provider: SummaryProvider | None = None
_chat_provider: ChatProvider | None = None
_chapter_provider: ChapterProvider | None = None


def get_summary_provider() -> SummaryProvider:
    global _summary_provider
    if _summary_provider is None:
        if settings.is_mock():
            _summary_provider = MockSummaryProvider()
        else:
            from backend.app.adapters.summary.gemini import GeminiSummaryProvider
            _summary_provider = GeminiSummaryProvider()
    return _summary_provider


def get_chat_provider() -> ChatProvider:
    global _chat_provider
    if _chat_provider is None:
        if settings.is_mock():
            _chat_provider = MockChatAdapter()
        else:
            from backend.app.adapters.chat.gemini import GeminiChatAdapter
            _chat_provider = GeminiChatAdapter()
    return _chat_provider


def get_chapter_provider() -> ChapterProvider:
    global _chapter_provider
    if _chapter_provider is None:
        if settings.is_mock():
            _chapter_provider = MockChapterProvider()
        else:
            from backend.app.adapters.chapters.gemini import GeminiChapterProvider
            _chapter_provider = GeminiChapterProvider()
    return _chapter_provider
