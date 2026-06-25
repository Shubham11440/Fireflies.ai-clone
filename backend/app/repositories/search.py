"""Search repository — FTS5-powered global search across transcripts, summaries, and action items."""
from __future__ import annotations

import json
from typing import Literal

import aiosqlite

SearchType = Literal["all", "transcript", "summary", "action_item"]


async def global_search(
    db: aiosqlite.Connection,
    q: str,
    search_type: SearchType = "all",
    limit: int = 30,
) -> list[dict]:
    """
    Search across transcripts (FTS5), meeting titles, summary result text, and action items.
    Returns ranked hits with snippet excerpts.
    """
    results: list[dict] = []
    seen: set[str] = set()

    q_lower = q.lower()

    # ── Transcript search via FTS5 ────────────────────────────────────
    if search_type in ("all", "transcript"):
        cursor = await db.execute(
            """
            SELECT
                tl.id AS line_id,
                tl.meeting_id,
                tl.text,
                tl.start_offset,
                m.title AS meeting_title
            FROM transcript_fts fts
            JOIN transcript_lines tl ON tl.rowid = fts.rowid
            JOIN meetings m ON m.id = tl.meeting_id
            WHERE transcript_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (q, limit),
        )
        rows = await cursor.fetchall()
        for row in rows:
            hit_id = f"transcript:{row['line_id']}"
            if hit_id in seen:
                continue
            seen.add(hit_id)

            # Build a short snippet around the first match position
            text: str = row["text"] or ""
            idx = text.lower().find(q_lower)
            if idx >= 0:
                start = max(0, idx - 40)
                end = min(len(text), idx + len(q) + 40)
                snippet = (
                    ("…" if start > 0 else "")
                    + text[start:idx]
                    + f"<mark>{text[idx:idx + len(q)]}</mark>"
                    + text[idx + len(q):end]
                    + ("…" if end < len(text) else "")
                )
            else:
                snippet = text[:80] + ("…" if len(text) > 80 else "")

            results.append(
                {
                    "meeting_id": row["meeting_id"],
                    "title": row["meeting_title"],
                    "type": "transcript",
                    "line_id": row["line_id"],
                    "snippet": snippet,
                    "offset": row["start_offset"],
                }
            )

    # ── Meeting title search ──────────────────────────────────────────
    if search_type in ("all", "summary"):
        cursor = await db.execute(
            "SELECT id, title FROM meetings WHERE LOWER(title) LIKE ? LIMIT ?",
            (f"%{q_lower}%", limit),
        )
        rows = await cursor.fetchall()
        for row in rows:
            hit_id = f"title:{row['id']}"
            if hit_id in seen:
                continue
            seen.add(hit_id)
            results.append(
                {
                    "meeting_id": row["id"],
                    "title": row["title"],
                    "type": "summary",
                    "line_id": None,
                    "snippet": f"Meeting: <mark>{row['title']}</mark>",
                    "offset": None,
                }
            )

    # ── Summary content search ────────────────────────────────────────
    if search_type in ("all", "summary"):
        cursor = await db.execute(
            """
            SELECT sp.meeting_id, sp.result, m.title
            FROM summary_processes sp
            JOIN meetings m ON m.id = sp.meeting_id
            WHERE sp.status = 'completed' AND sp.result IS NOT NULL
            """,
        )
        rows = await cursor.fetchall()
        for row in rows:
            try:
                summary = json.loads(row["result"] or "{}")
            except (json.JSONDecodeError, TypeError):
                continue

            # Search through all text blocks in summary
            for section_key in ["session_summary", "key_decisions", "next_steps", "action_items", "people"]:
                section = summary.get(section_key, {})
                for block in section.get("blocks", []):
                    content: str = block.get("content", "")
                    if q_lower in content.lower():
                        hit_id = f"summary:{row['meeting_id']}:{section_key}"
                        if hit_id in seen:
                            continue
                        seen.add(hit_id)
                        idx = content.lower().find(q_lower)
                        start = max(0, idx - 40)
                        end = min(len(content), idx + len(q) + 40)
                        snippet = (
                            ("…" if start > 0 else "")
                            + content[start:idx]
                            + f"<mark>{content[idx:idx + len(q)]}</mark>"
                            + content[idx + len(q):end]
                            + ("…" if end < len(content) else "")
                        )
                        results.append(
                            {
                                "meeting_id": row["meeting_id"],
                                "title": row["title"],
                                "type": "summary",
                                "line_id": None,
                                "snippet": snippet,
                                "offset": None,
                            }
                        )
                        break

    # ── Action items search ───────────────────────────────────────────
    if search_type in ("all", "action_item"):
        cursor = await db.execute(
            """
            SELECT ai.id, ai.text, ai.meeting_id, m.title AS meeting_title
            FROM action_items ai
            JOIN meetings m ON m.id = ai.meeting_id
            WHERE LOWER(ai.text) LIKE ?
            LIMIT ?
            """,
            (f"%{q_lower}%", limit),
        )
        rows = await cursor.fetchall()
        for row in rows:
            hit_id = f"action:{row['id']}"
            if hit_id in seen:
                continue
            seen.add(hit_id)
            text: str = row["text"]
            idx = text.lower().find(q_lower)
            snippet = text[:idx] + f"<mark>{text[idx:idx + len(q)]}</mark>" + text[idx + len(q):]
            results.append(
                {
                    "meeting_id": row["meeting_id"],
                    "title": row["meeting_title"],
                    "type": "action_item",
                    "line_id": None,
                    "snippet": snippet,
                    "offset": None,
                }
            )

    return results[:limit]
