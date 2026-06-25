"""Mock summary provider — returns canned structured JSON. Zero config."""
from __future__ import annotations

import uuid

from backend.app.logging.logger import CustomLogger


def _uid() -> str:
    return str(uuid.uuid4())


class MockSummaryProvider:
    def summarize(self, transcript: str, *, logger: CustomLogger) -> dict:
        """Return a deterministic SummaryResponse from the transcript text."""
        # Extract speakers from transcript
        speakers = []
        for line in transcript.split("\n"):
            if ": " in line:
                speaker = line.split(": ")[0].strip()
                if speaker and speaker not in speakers:
                    speakers.append(speaker)

        if not speakers:
            speakers = ["Speaker 1"]

        meeting_name = "Meeting Summary"

        return {
            "meeting_name": meeting_name,
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
                        "content": "This meeting covered key discussion points and action items. The participants engaged in a productive conversation about the topics at hand.",
                    },
                ],
            },
            "action_items": {
                "title": "Immediate Action Items",
                "blocks": [
                    {"id": _uid(), "type": "bullet", "content": "Follow up on action items from the meeting"},
                    {"id": _uid(), "type": "bullet", "content": "Schedule next sync to review progress"},
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
                    {"id": _uid(), "type": "bullet", "content": "Schedule follow-up meeting"},
                ],
            },
        }
