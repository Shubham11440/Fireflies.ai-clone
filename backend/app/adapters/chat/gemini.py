"""Gemini chat adapter — answers meeting questions using the Gemini API."""
from __future__ import annotations

import httpx

from backend.app.config import settings
from backend.app.logging.logger import CustomLogger

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_PROMPT = """\
You are a helpful meeting assistant. You have been given a meeting transcript \
and an AI-generated summary. Answer the user's question concisely and accurately \
based on the provided context. If the answer is not in the context, say so.

Rules:
- Answer in plain text (no markdown, no JSON).
- Be concise — 1-3 sentences unless more detail is needed.
- Reference specific moments from the transcript when possible.
- If you are unsure, say "I don't have enough information to answer that."
"""


class GeminiChatAdapter:
    """Calls the Gemini generateContent API for meeting Q&A chat."""

    def ask(
        self,
        question: str,
        transcript_text: str,
        summary_text: str,
        *,
        logger: CustomLogger,
    ) -> str:
        url = API_URL.format(model=settings.GEMINI_MODEL)
        headers = {"x-goog-api-key": settings.GEMINI_API_KEY}

        context = f"--- SUMMARY ---\n{summary_text}\n\n--- TRANSCRIPT ---\n{transcript_text}"
        user_message = f"{context}\n\n--- QUESTION ---\n{question}"

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"{SYSTEM_PROMPT}\n\n{user_message}"
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1024,
            },
        }

        try:
            resp = httpx.post(
                url, json=payload, headers=headers, timeout=settings.LLM_TIMEOUT_SEC
            )
            resp.raise_for_status()
            data = resp.json()

            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return raw_text.strip()

        except Exception as exc:
            logger.warning(
                {
                    "event": "GEMINI_CHAT_FAILED",
                    "event_type": "adapter_error",
                    "error": str(exc),
                }
            )
            return (
                "I'm sorry, I encountered an error processing your question. "
                "Please try again or check that the Gemini API key is configured correctly."
            )
