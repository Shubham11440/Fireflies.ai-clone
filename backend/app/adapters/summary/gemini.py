"""Gemini summary provider — calls the Gemini API to generate structured meeting summaries."""
from __future__ import annotations

import json
import uuid

import httpx

from backend.app.config import settings
from backend.app.logging.logger import CustomLogger

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_PROMPT = """\
You are an expert meeting assistant. Analyze the following meeting transcript \
and produce a structured JSON summary. Return ONLY valid JSON with exactly these keys:

{
  "meeting_name": "string — short descriptive title for the meeting",
  "people": {
    "title": "People",
    "blocks": [{"id": "uuid", "type": "bullet", "content": "person name — role/contribution"}]
  },
  "session_summary": {
    "title": "Session Summary",
    "blocks": [{"id": "uuid", "type": "text", "content": "2-4 sentence paragraph"}]
  },
  "action_items": {
    "title": "Immediate Action Items",
    "blocks": [{"id": "uuid", "type": "bullet", "content": "action item text"}]
  },
  "key_decisions": {
    "title": "Key Items & Decisions",
    "blocks": [{"id": "uuid", "type": "bullet", "content": "decision text"}]
  },
  "next_steps": {
    "title": "Next Steps",
    "blocks": [{"id": "uuid", "type": "bullet", "content": "next step text"}]
  }
}

Rules:
- Each "id" must be a unique UUID string.
- "type" is always "bullet" except session_summary which uses "text".
- Extract real names, real action items, real decisions from the transcript.
- If the transcript is empty or too short, return a minimal valid structure.
"""


def _uid() -> str:
    return str(uuid.uuid4())


class GeminiSummaryProvider:
    """Calls the Gemini generateContent API for meeting summarization."""

    def summarize(self, transcript: str, *, logger: CustomLogger) -> dict:
        url = API_URL.format(model=settings.GEMINI_MODEL)
        headers = {"x-goog-api-key": settings.GEMINI_API_KEY}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"{SYSTEM_PROMPT}\n\n--- TRANSCRIPT ---\n\n{transcript[:30000]}"
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json",
                "maxOutputTokens": 4096,
            },
        }

        try:
            resp = httpx.post(
                url, json=payload, headers=headers, timeout=settings.LLM_TIMEOUT_SEC
            )
            resp.raise_for_status()
            data = resp.json()

            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(raw_text)
            return self._validate(result, transcript)

        except Exception as exc:
            logger.warning(
                {
                    "event": "GEMINI_SUMMARY_FAILED",
                    "event_type": "adapter_error",
                    "error": str(exc),
                }
            )
            return self._fallback(transcript)

    # ------------------------------------------------------------------
    # Validation / fallback
    # ------------------------------------------------------------------

    def _validate(self, result: dict, transcript: str) -> dict:
        required = ["people", "session_summary", "action_items", "key_decisions", "next_steps"]
        for key in required:
            if key not in result:
                return self._fallback(transcript)
            section = result[key]
            if "blocks" not in section:
                section["blocks"] = []
            if "title" not in section:
                section["title"] = key.replace("_", " ").title()
        if "meeting_name" not in result:
            result["meeting_name"] = "Meeting Summary"
        return result

    def _fallback(self, transcript: str) -> dict:
        speakers = []
        for line in transcript.split("\n"):
            if ": " in line:
                speaker = line.split(": ")[0].strip()
                if speaker and speaker not in speakers:
                    speakers.append(speaker)
        if not speakers:
            speakers = ["Speaker 1"]

        return {
            "meeting_name": "Meeting Summary",
            "people": {
                "title": "People",
                "blocks": [
                    {"id": _uid(), "type": "bullet", "content": s}
                    for s in speakers
                ],
            },
            "session_summary": {
                "title": "Session Summary",
                "blocks": [
                    {
                        "id": _uid(),
                        "type": "text",
                        "content": "This meeting covered key discussion points and action items.",
                    }
                ],
            },
            "action_items": {
                "title": "Immediate Action Items",
                "blocks": [
                    {"id": _uid(), "type": "bullet", "content": "Follow up on action items from the meeting"},
                ],
            },
            "key_decisions": {
                "title": "Key Items & Decisions",
                "blocks": [
                    {"id": _uid(), "type": "bullet", "content": "Decisions were made regarding the project timeline and deliverables"},
                ],
            },
            "next_steps": {
                "title": "Next Steps",
                "blocks": [
                    {"id": _uid(), "type": "bullet", "content": "Review meeting notes and action items"},
                ],
            },
        }
