"""MockChatAdapter — returns canned, meeting-aware answers for the chat feature.

This adapter is the default (zero-config). It recognizes a small set of common
question patterns and returns structured answers that feel relevant to the meeting
context, making the chat feature usable without any LLM API keys.
"""
from __future__ import annotations

import re

from backend.app.logging.logger import CustomLogger


CANNED_RESPONSES = [
    (r"\bsummary|summarize|overview\b", "Based on the meeting transcript, the key discussion points include the main agenda items, decisions made by the team, and any outstanding concerns raised during the session. The meeting covered several important topics that are captured in the AI summary panel."),
    (r"\baction item|task|todo|follow.up\b", "The meeting produced several action items for the team. Key tasks identified include follow-up on decisions made, assignments to specific team members, and next steps to be completed before the next meeting. Check the Action Items tab in the summary panel for the full list."),
    (r"\bwho|participant|attend|speaker\b", "The meeting had multiple participants including various speakers who contributed to the discussion. You can see the full participant list in the meeting header. Each speaker's contributions are labeled in the transcript."),
    (r"\bwhen|time|date|schedule|deadline\b", "The meeting occurred at the date and time shown in the meeting header. For specific deadlines discussed, please review the action items and the full transcript for any timeline commitments made during the session."),
    (r"\bdecision|decided|agree|conclusion\b", "Several key decisions were made during this meeting. The team reached consensus on the main discussion points and agreed on the path forward. Refer to the 'Key Decisions' section in the AI summary for a structured list of what was decided."),
    (r"\bchapter|section|topic|outline\b", "The meeting covered multiple topics organized into chapters as shown in the Outline tab of the summary panel. Each chapter corresponds to a different phase of the meeting discussion and is linked to the timestamp in the recording."),
    (r"\bnext step|future|plan|upcoming\b", "The next steps from this meeting are captured in the 'Next Steps' section of the AI summary. The team agreed on specific follow-up actions and timelines to ensure progress on the discussed initiatives."),
]

FALLBACK = (
    "That's a great question about this meeting. Based on the transcript, "
    "the discussion touched on this topic during the session. "
    "For the most accurate answer, I recommend reviewing the full transcript "
    "or the AI-generated summary which captures all key points discussed. "
    "The action items panel also contains any follow-up tasks related to your question."
)


class MockChatAdapter:
    """Canned chat adapter — deterministic, zero-config, meeting-aware."""

    def ask(
        self,
        question: str,
        transcript_text: str,
        summary_text: str,
        *,
        logger: CustomLogger,
    ) -> str:
        q_lower = question.lower()

        for pattern, response in CANNED_RESPONSES:
            if re.search(pattern, q_lower):
                return response

        # If the question contains a word that appears in the transcript, acknowledge it
        words = re.findall(r"\b\w{4,}\b", q_lower)
        for word in words:
            if word in transcript_text.lower():
                return (
                    f"The topic of '{word}' came up during this meeting. "
                    "You can find the relevant discussion by searching the transcript "
                    f"(click the search icon and type '{word}'). "
                    "The AI summary also highlights this in the key discussion points."
                )

        return FALLBACK
