"""Gemini chapter provider — calls the Gemini API for timestamped chapter generation."""
from __future__ import annotations

import json

import httpx

from backend.app.config import settings
from backend.app.adapters.chapters.mock import MockChapterProvider
from backend.app.logging.logger import CustomLogger

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_PROMPT = """\
You are an expert meeting analyst. Analyze the following timestamped meeting transcript \
and divide it into logical chapters. Return ONLY valid JSON — an array of objects:

[
  {
    "title": "short descriptive title for this chapter",
    "start_offset": 120.5,
    "summary": "1-2 sentence summary of what this chapter covers"
  }
]

Rules:
- "start_offset" is the number of SECONDS from the start where this chapter begins.
- Each chapter should be 2-5 minutes long (adjust based on natural topic breaks).
- Use the [mm:ss] timestamps in the transcript to place chapter boundaries accurately.
- Aim for 3-8 chapters depending on meeting length.
- "title" should be concise and descriptive (e.g. "Project Roadmap Discussion").
- "summary" should capture the key points of that chapter.
- Chapters must be ordered chronologically by start_offset.
"""

_FALLBACK = MockChapterProvider()


class GeminiChapterProvider:
    """Calls the Gemini generateContent API for chapter generation."""

    def generate_chapters(
        self, transcript_lines: list[dict], *, logger: CustomLogger
    ) -> list[dict]:
        # Format transcript with timestamps
        formatted = []
        for line in transcript_lines:
            offset = line.get("start_offset", 0) or 0
            minutes = int(offset // 60)
            seconds = int(offset % 60)
            speaker = line.get("speaker", "Speaker")
            text = line.get("text", "")
            formatted.append(f"[{minutes:02d}:{seconds:02d}] {speaker}: {text}")

        transcript_text = "\n".join(formatted)

        url = API_URL.format(model=settings.GEMINI_MODEL)
        headers = {"x-goog-api-key": settings.GEMINI_API_KEY}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"{SYSTEM_PROMPT}\n\n--- TRANSCRIPT ---\n\n{transcript_text[:30000]}"
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
            chapters = json.loads(raw_text)

            if not isinstance(chapters, list) or len(chapters) == 0:
                raise ValueError("Empty or invalid chapters response")

            validated = []
            for i, ch in enumerate(chapters):
                validated.append({
                    "title": ch.get("title", f"Chapter {i + 1}"),
                    "start_offset": float(ch.get("start_offset", 0)),
                    "summary": ch.get("summary"),
                })

            return validated

        except Exception as exc:
            logger.warning(
                {
                    "event": "GEMINI_CHAPTERS_FAILED",
                    "event_type": "adapter_error",
                    "error": str(exc),
                }
            )
            return _FALLBACK.generate_chapters(transcript_lines, logger=logger)
