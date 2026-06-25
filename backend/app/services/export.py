"""Export service — generates Markdown, TXT, and HTML (print-to-PDF) exports."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

import aiosqlite

from backend.app.repositories import (
    meetings,
    transcript,
    summary,
    action_items,
    chapters,
    participants,
    topics,
)


async def _gather_meeting_data(db: aiosqlite.Connection, meeting_id: str) -> dict:
    """Load all meeting data needed for export."""
    meeting = await meetings.get_by_id(db, meeting_id)
    if not meeting:
        raise ValueError(f"Meeting {meeting_id} not found")

    parts = await participants.list_by_meeting(db, meeting_id)
    lines = await transcript.list_by_meeting(db, meeting_id, limit=10000, offset=0)
    summary_row = await summary.get_by_meeting(db, meeting_id)
    action_items_list = await action_items.list_by_meeting(db, meeting_id)
    chapters_list = await chapters.list_by_meeting(db, meeting_id)
    topic_list = await topics.list_for_meeting(db, meeting_id)

    summary_data = None
    if summary_row and summary_row.get("result"):
        try:
            summary_data = json.loads(summary_row["result"])
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "meeting": meeting,
        "participants": parts,
        "transcript": lines,
        "summary": summary_data,
        "action_items": action_items_list,
        "chapters": chapters_list,
        "topics": topic_list,
    }


def _format_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except (ValueError, AttributeError):
        return iso


def _render_markdown(data: dict) -> str:
    m = data["meeting"]
    lines = []
    lines.append(f"# {m['title']}")
    lines.append("")
    lines.append(f"**Date:** {_format_date(m['occurred_at'])}  ")
    lines.append(f"**Duration:** {int(m['duration_sec'] // 60)} minutes  ")
    if data["participants"]:
        names = ", ".join(p["name"] for p in data["participants"])
        lines.append(f"**Participants:** {names}  ")
    if data["topics"]:
        topic_names = ", ".join(t["name"] for t in data["topics"])
        lines.append(f"**Topics:** {topic_names}  ")
    lines.append("")

    # Summary
    if data["summary"]:
        s = data["summary"]
        for section_key in ["session_summary", "key_decisions", "next_steps", "action_items", "people"]:
            section = s.get(section_key)
            if section and section.get("blocks"):
                lines.append(f"## {section['title']}")
                lines.append("")
                for block in section["blocks"]:
                    btype = block.get("type", "text")
                    content = block.get("content", "")
                    if btype == "bullet":
                        lines.append(f"- {content}")
                    elif btype == "heading1":
                        lines.append(f"# {content}")
                    elif btype == "heading2":
                        lines.append(f"## {content}")
                    else:
                        lines.append(content)
                lines.append("")

    # Action items
    if data["action_items"]:
        lines.append("## Action Items")
        lines.append("")
        for item in data["action_items"]:
            status = "[x]" if item.get("is_completed") else "[ ]"
            assignee = f" (@{item['assignee']})" if item.get("assignee") else ""
            lines.append(f"- {status} {item['text']}{assignee}")
        lines.append("")

    # Chapters
    if data["chapters"]:
        lines.append("## Chapters / Outline")
        lines.append("")
        for ch in data["chapters"]:
            offset = ch.get("start_offset")
            time_str = f" ({int(offset // 60)}:{int(offset % 60):02d})" if offset else ""
            lines.append(f"- **{ch['title']}**{time_str}")
            if ch.get("summary"):
                lines.append(f"  {ch['summary']}")
        lines.append("")

    # Transcript
    if data["transcript"]:
        lines.append("## Transcript")
        lines.append("")
        for tl in data["transcript"]:
            speaker = tl.get("speaker") or "Unknown"
            offset = tl.get("start_offset")
            time_str = f"[{int(offset // 60)}:{int(offset % 60):02d}] " if offset else ""
            lines.append(f"**{speaker}** {time_str}")
            lines.append(f"{tl['text']}")
            lines.append("")

    return "\n".join(lines)


def _render_txt(data: dict) -> str:
    m = data["meeting"]
    lines = []
    lines.append(m["title"])
    lines.append("=" * len(m["title"]))
    lines.append("")
    lines.append(f"Date: {_format_date(m['occurred_at'])}")
    lines.append(f"Duration: {int(m['duration_sec'] // 60)} minutes")
    if data["participants"]:
        names = ", ".join(p["name"] for p in data["participants"])
        lines.append(f"Participants: {names}")
    if data["topics"]:
        topic_names = ", ".join(t["name"] for t in data["topics"])
        lines.append(f"Topics: {topic_names}")
    lines.append("")

    if data["summary"]:
        s = data["summary"]
        for section_key in ["session_summary", "key_decisions", "next_steps", "action_items", "people"]:
            section = s.get(section_key)
            if section and section.get("blocks"):
                lines.append(section["title"])
                lines.append("-" * len(section["title"]))
                for block in section["blocks"]:
                    content = block.get("content", "")
                    if block.get("type") == "bullet":
                        lines.append(f"  * {content}")
                    else:
                        lines.append(content)
                lines.append("")

    if data["action_items"]:
        lines.append("ACTION ITEMS")
        lines.append("-" * 12)
        for item in data["action_items"]:
            status = "DONE" if item.get("is_completed") else "TODO"
            assignee = f" ({item['assignee']})" if item.get("assignee") else ""
            lines.append(f"  [{status}] {item['text']}{assignee}")
        lines.append("")

    if data["chapters"]:
        lines.append("CHAPTERS / OUTLINE")
        lines.append("-" * 18)
        for ch in data["chapters"]:
            offset = ch.get("start_offset")
            time_str = f" ({int(offset // 60)}:{int(offset % 60):02d})" if offset else ""
            lines.append(f"  * {ch['title']}{time_str}")
        lines.append("")

    if data["transcript"]:
        lines.append("TRANSCRIPT")
        lines.append("-" * 10)
        for tl in data["transcript"]:
            speaker = tl.get("speaker") or "Unknown"
            offset = tl.get("start_offset")
            time_str = f" [{int(offset // 60)}:{int(offset % 60):02d}]" if offset else ""
            lines.append(f"{speaker}{time_str}: {tl['text']}")
        lines.append("")

    return "\n".join(lines)


def _render_html(data: dict) -> str:
    """Render a styled HTML document suitable for print-to-PDF."""
    m = data["meeting"]
    participants = ", ".join(p["name"] for p in data["participants"]) if data["participants"] else ""
    topic_names = ", ".join(t["name"] for t in data["topics"]) if data["topics"] else ""

    summary_html = ""
    if data["summary"]:
        s = data["summary"]
        for section_key in ["session_summary", "key_decisions", "next_steps", "action_items", "people"]:
            section = s.get(section_key)
            if section and section.get("blocks"):
                summary_html += f"<h2>{section['title']}</h2>\n<ul>\n"
                for block in section["blocks"]:
                    content = block.get("content", "")
                    if block.get("type") == "bullet":
                        summary_html += f"  <li>{content}</li>\n"
                    else:
                        summary_html += f"  <p>{content}</p>\n"
                summary_html += "</ul>\n"

    actions_html = ""
    if data["action_items"]:
        actions_html = "<h2>Action Items</h2>\n<ul>\n"
        for item in data["action_items"]:
            checked = "checked" if item.get("is_completed") else ""
            assignee = f" ({item['assignee']})" if item.get("assignee") else ""
            actions_html += f'  <li><input type="checkbox" {checked} disabled> {item["text"]}{assignee}</li>\n'
        actions_html += "</ul>\n"

    transcript_html = ""
    if data["transcript"]:
        transcript_html = "<h2>Transcript</h2>\n"
        for tl in data["transcript"]:
            speaker = tl.get("speaker") or "Unknown"
            offset = tl.get("start_offset")
            time_str = f"<small>{int(offset // 60)}:{int(offset % 60):02d}</small> " if offset else ""
            transcript_html += f'<p><strong>{speaker}</strong> {time_str}<br>{tl["text"]}</p>\n'

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{m["title"]}</title>
<style>
  body {{ font-family: Inter, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #0E1117; }}
  h1 {{ border-bottom: 2px solid #F6C344; padding-bottom: 0.5rem; }}
  h2 {{ color: #0E1117; margin-top: 1.5rem; }}
  .meta {{ color: #64748B; font-size: 0.9rem; margin-bottom: 1.5rem; }}
  .meta span {{ margin-right: 1.5rem; }}
  ul {{ padding-left: 1.5rem; }}
  li {{ margin-bottom: 0.25rem; }}
  p {{ line-height: 1.6; }}
  small {{ color: #94A3B8; }}
  @media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
<h1>{m["title"]}</h1>
<div class="meta">
  <span>Date: {_format_date(m["occurred_at"])}</span>
  <span>Duration: {int(m["duration_sec"] // 60)} min</span>
  {f'<span>Participants: {participants}</span>' if participants else ''}
  {f'<span>Topics: {topic_names}</span>' if topic_names else ''}
</div>
{summary_html}
{actions_html}
{transcript_html}
</body>
</html>"""


async def export_meeting(
    db: aiosqlite.Connection, meeting_id: str, fmt: str, content: str = "all"
) -> tuple[str, str, str]:
    """
    Export a meeting. Returns (content_str, content_type, file_extension).
    """
    data = await _gather_meeting_data(db, meeting_id)

    if fmt == "md":
        return _render_markdown(data), "text/markdown; charset=utf-8", "md"
    elif fmt == "txt":
        return _render_txt(data), "text/plain; charset=utf-8", "txt"
    elif fmt == "pdf":
        return _render_html(data), "text/html; charset=utf-8", "html"
    else:
        raise ValueError(f"Unsupported format: {fmt}")
