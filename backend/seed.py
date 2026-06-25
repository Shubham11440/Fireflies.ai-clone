"""
Manual dev seed script: python -m backend.seed
Idempotent — checks existence by stable seed IDs before inserting.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta

import aiosqlite

from backend.app.db import get_db, init_db
from backend.app.repositories import meetings, transcript, participants, topics, chapters, action_items
from backend.app.models.entities import (
    Meeting, TranscriptLine, Participant, ActionItem, Chapter, SummaryProcess,
)


def now_rfc3339() -> str:
    return datetime.now(tz=__import__("datetime").timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def uid() -> str:
    return str(uuid.uuid4())


# ── Stable seed IDs ──────────────────────────────────────────
USER_ID = "user-default"
MEETING_IDS = [f"seed-meeting-{i}" for i in range(1, 6)]
LINE_ID_BASE = "seed-line"
PARTICIPANT_ID_BASE = "seed-participant"
ACTION_ID_BASE = "seed-action"
CHAPTER_ID_BASE = "seed-chapter"
TOPIC_IDS = {
    "Product Roadmap": "seed-topic-roadmap",
    "Q3 Planning": "seed-topic-q3",
    "Hiring": "seed-topic-hiring",
    "Engineering": "seed-topic-engineering",
    "Design": "seed-topic-design",
    "Marketing": "seed-topic-marketing",
    "Budget": "seed-topic-budget",
    "Customer Feedback": "seed-topic-feedback",
    "Performance": "seed-topic-performance",
    "Sprint Review": "seed-topic-sprint",
}

# ── Meeting data ─────────────────────────────────────────────
MEETINGS = [
    {
        "id": MEETING_IDS[0],
        "title": "Q3 Product Roadmap Planning",
        "occurred_at": "2026-06-20T15:00:00Z",
        "duration_sec": 3600,
        "source": "seeded",
        "media_url": "/sample.mp3",
        "participants": ["Alice Chen", "Bob Martinez", "Carol Williams", "David Kim"],
        "topics": ["Product Roadmap", "Q3 Planning", "Engineering"],
        "transcript": [
            {"speaker": "Alice Chen", "text": "Welcome everyone. Let's kick off our Q3 roadmap planning session. We've had a strong Q2 with the launch of our analytics dashboard.", "start": 0, "end": 8},
            {"speaker": "Bob Martinez", "text": "Thanks Alice. I think the analytics dashboard was a great success. We saw a 40% increase in daily active users since launch.", "start": 8, "end": 15},
            {"speaker": "Carol Williams", "text": "That's impressive. For Q3, I'd like to propose we focus on three main areas: the mobile experience, API v2, and our enterprise features.", "start": 15, "end": 24},
            {"speaker": "David Kim", "text": "I agree with Carol. The mobile experience has been our biggest pain point. Our app store rating dropped to 3.2 stars last month.", "start": 24, "end": 32},
            {"speaker": "Alice Chen", "text": "Let's dive deeper into the mobile experience. What are the top complaints?", "start": 32, "end": 37},
            {"speaker": "David Kim", "text": "The main issues are performance on older devices, the offline mode being unreliable, and the notification system. We've collected over 2000 support tickets on these topics.", "start": 37, "end": 48},
            {"speaker": "Bob Martinez", "text": "For the API v2, we need to think about backward compatibility. Our enterprise clients are still on v1 and we can't break their integrations.", "start": 48, "end": 57},
            {"speaker": "Carol Williams", "text": "Good point Bob. We should plan a deprecation timeline. Maybe 6 months of parallel running before we sunset v1.", "start": 57, "end": 64},
            {"speaker": "Alice Chen", "text": "Let's also discuss the enterprise features. We've been losing deals to competitors because we lack SSO and advanced audit logs.", "start": 64, "end": 73},
            {"speaker": "David Kim", "text": "I've talked to our sales team and they say SSO is the number one blocker for enterprise deals. We should prioritize that.", "start": 73, "end": 80},
            {"speaker": "Carol Williams", "text": "For the mobile work, I think we should start with a performance audit. David, can your team lead that?", "start": 80, "end": 87},
            {"speaker": "David Kim", "text": "Absolutely. We can have the audit done by end of next week. I'll set up profiling on our CI pipeline to catch regressions early.", "start": 87, "end": 95},
            {"speaker": "Bob Martinez", "text": "For API v2, I'll work with the platform team on the design doc. We should have a proposal ready by July 1st.", "start": 95, "end": 103},
            {"speaker": "Alice Chen", "text": "Great. Let me summarize the action items. David will lead the mobile performance audit, Bob will draft the API v2 proposal, and Carol will scope the SSO implementation.", "start": 103, "end": 114},
            {"speaker": "Carol Williams", "text": "I'll also set up user interviews for the mobile experience. We should talk to at least 10 power users.", "start": 114, "end": 121},
            {"speaker": "Alice Chen", "text": "Perfect. Let's reconvene next Thursday with our findings. Meeting adjourned.", "start": 121, "end": 126},
        ],
        "action_items": [
            {"text": "Complete mobile performance audit by end of next week", "assignee": "David Kim"},
            {"text": "Draft API v2 design proposal by July 1st", "assignee": "Bob Martinez"},
            {"text": "Scope SSO implementation for enterprise tier", "assignee": "Carol Williams"},
            {"text": "Schedule 10 user interviews for mobile experience", "assignee": "Carol Williams"},
            {"text": "Set up CI performance profiling pipeline", "assignee": "David Kim"},
        ],
        "chapters": [
            {"title": "Q2 Recap", "start_offset": 0, "seq": 1},
            {"title": "Q3 Focus Areas", "start_offset": 15, "seq": 2},
            {"title": "Mobile Experience Deep Dive", "start_offset": 32, "seq": 3},
            {"title": "API v2 Discussion", "start_offset": 48, "seq": 4},
            {"title": "Enterprise Features", "start_offset": 64, "seq": 5},
            {"title": "Action Items & Next Steps", "start_offset": 103, "seq": 6},
        ],
        "summary_status": "completed",
    },
    {
        "id": MEETING_IDS[1],
        "title": "Weekly Engineering Standup",
        "occurred_at": "2026-06-22T09:00:00Z",
        "duration_sec": 1800,
        "source": "seeded",
        "media_url": "/sample.mp3",
        "participants": ["Alice Chen", "David Kim", "Eve Johnson"],
        "topics": ["Engineering", "Sprint Review"],
        "transcript": [
            {"speaker": "Alice Chen", "text": "Good morning team. Let's do a quick standup. David, you first.", "start": 0, "end": 5},
            {"speaker": "David Kim", "text": "Yesterday I finished the authentication refactor. The new OAuth flow is live in staging. Today I'll start on the notification system overhaul.", "start": 5, "end": 14},
            {"speaker": "Eve Johnson", "text": "I'm still working on the search indexing pipeline. The FTS5 migration took longer than expected because we had to rebuild all existing indexes.", "start": 14, "end": 23},
            {"speaker": "Alice Chen", "text": "How close are you to finishing the search work?", "start": 23, "end": 27},
            {"speaker": "Eve Johnson", "text": "About 70% done. I should have the backend ready by EOD today. The frontend search component will take another day.", "start": 27, "end": 34},
            {"speaker": "Alice Chen", "text": "Good. I've been reviewing the code for the payment integration. I found a few issues with the webhook handling that we need to address before going live.", "start": 34, "end": 44},
            {"speaker": "David Kim", "text": "What kind of issues?", "start": 44, "end": 46},
            {"speaker": "Alice Chen", "text": "The retry logic isn't handling idempotency correctly. If a webhook gets delivered twice, we might process the payment twice. I'll push a fix today.", "start": 46, "end": 56},
            {"speaker": "Eve Johnson", "text": "That's a critical bug. Good catch. Should we do a security review of the payment flow?", "start": 56, "end": 62},
            {"speaker": "Alice Chen", "text": "Yes, let's schedule that for tomorrow. David, can you join?", "start": 62, "end": 67},
            {"speaker": "David Kim", "text": "Definitely. I'll clear my afternoon for it.", "start": 67, "end": 71},
        ],
        "action_items": [
            {"text": "Fix payment webhook idempotency bug", "assignee": "Alice Chen"},
            {"text": "Complete FTS5 search indexing migration", "assignee": "Eve Johnson"},
            {"text": "Schedule payment flow security review", "assignee": "Alice Chen"},
        ],
        "chapters": [
            {"title": "Standup Updates", "start_offset": 0, "seq": 1},
            {"title": "Search Indexing Progress", "start_offset": 14, "seq": 2},
            {"title": "Payment Integration Issues", "start_offset": 34, "seq": 3},
            {"title": "Security Review Planning", "start_offset": 56, "seq": 4},
        ],
        "summary_status": "completed",
    },
    {
        "id": MEETING_IDS[2],
        "title": "Design Review — New Dashboard UI",
        "occurred_at": "2026-06-23T14:00:00Z",
        "duration_sec": 2400,
        "source": "seeded",
        "media_url": "/sample.mp3",
        "participants": ["Carol Williams", "Frank Lee", "Grace Park"],
        "topics": ["Design", "Product Roadmap"],
        "transcript": [
            {"speaker": "Carol Williams", "text": "Welcome to the design review. Frank, take us through the new dashboard concepts.", "start": 0, "end": 6},
            {"speaker": "Frank Lee", "text": "Thanks Carol. We've been exploring three different layout approaches for the dashboard. The first is a card-based layout with drag-and-drop widgets.", "start": 6, "end": 15},
            {"speaker": "Grace Park", "text": "I like the card approach. It gives users flexibility to customize their view. What about the other options?", "start": 15, "end": 21},
            {"speaker": "Frank Lee", "text": "The second option is a fixed grid layout with predefined sections. It's simpler but less flexible. The third is a hybrid — fixed header with a customizable widget area below.", "start": 21, "end": 31},
            {"speaker": "Carol Williams", "text": "The hybrid approach sounds promising. Can you walk us through the mockups?", "start": 31, "end": 36},
            {"speaker": "Frank Lee", "text": "Sure. The fixed header shows key metrics — meetings this week, action items due, upcoming events. Below that, users can add, remove, and rearrange widgets like recent meetings, team activity, and AI insights.", "start": 36, "end": 50},
            {"speaker": "Grace Park", "text": "What about mobile? How does this layout adapt to smaller screens?", "start": 50, "end": 55},
            {"speaker": "Frank Lee", "text": "On mobile, the widget area becomes a single column with swipe navigation between widgets. The fixed header collapses into a summary card.", "start": 55, "end": 63},
            {"speaker": "Carol Williams", "text": "I have concerns about the drag-and-drop on mobile. It's often clunky on touch devices.", "start": 63, "end": 69},
            {"speaker": "Frank Lee", "text": "That's valid. We could replace drag-and-drop with a long-press menu for reordering on mobile. That's actually more accessible too.", "start": 69, "end": 77},
            {"speaker": "Grace Park", "text": "I'd also like to see some data visualization in the widgets. Maybe a chart showing meeting frequency over time.", "start": 77, "end": 84},
            {"speaker": "Carol Williams", "text": "Good idea Grace. Let's prioritize the core layout first, then add the data viz layer in a follow-up sprint.", "start": 84, "end": 91},
        ],
        "action_items": [
            {"text": "Finalize hybrid dashboard layout mockups", "assignee": "Frank Lee"},
            {"text": "Create mobile interaction spec for widget reordering", "assignee": "Frank Lee"},
            {"text": "Research chart libraries for data visualization widgets", "assignee": "Grace Park"},
        ],
        "chapters": [
            {"title": "Dashboard Concepts Overview", "start_offset": 0, "seq": 1},
            {"title": "Layout Options Deep Dive", "start_offset": 6, "seq": 2},
            {"title": "Mobile Adaptation", "start_offset": 50, "seq": 3},
            {"title": "Data Visualization", "start_offset": 77, "seq": 4},
        ],
        "summary_status": "completed",
    },
    {
        "id": MEETING_IDS[3],
        "title": "Customer Success Sync",
        "occurred_at": "2026-06-24T11:00:00Z",
        "duration_sec": 2700,
        "source": "seeded",
        "media_url": "/sample.mp3",
        "participants": ["Bob Martinez", "Henry Wang", "Ivy Zhang"],
        "topics": ["Customer Feedback", "Marketing"],
        "transcript": [
            {"speaker": "Bob Martinez", "text": "Let's review the customer feedback from last week. Henry, what are we hearing from enterprise clients?", "start": 0, "end": 7},
            {"speaker": "Henry Wang", "text": "Enterprise clients are mostly happy with the product, but they're asking for better reporting capabilities. Three Fortune 500 companies specifically mentioned this.", "start": 7, "end": 17},
            {"speaker": "Ivy Zhang", "text": "On the SMB side, we're getting a lot of requests for integration with Slack and Microsoft Teams. It's the number one feature request in our feedback portal.", "start": 17, "end": 27},
            {"speaker": "Bob Martinez", "text": "What's our current Slack integration status?", "start": 27, "end": 30},
            {"speaker": "Ivy Zhang", "text": "We have a basic webhook integration, but users want two-way sync — sending meeting summaries to channels and creating meetings from Slack commands.", "start": 30, "end": 39},
            {"speaker": "Henry Wang", "text": "For enterprise reporting, they want custom dashboards and the ability to export data to their BI tools. Some are using Tableau and Power BI.", "start": 39, "end": 49},
            {"speaker": "Bob Martinez", "text": "These are both significant features. Let's categorize them by effort and impact.", "start": 49, "end": 55},
            {"speaker": "Ivy Zhang", "text": "Slack two-way sync is medium effort but high impact. The reporting dashboard is high effort but also high impact for enterprise retention.", "start": 55, "end": 64},
            {"speaker": "Henry Wang", "text": "We should also address the onboarding flow. New enterprise clients are taking too long to get set up. The average time to first value is 14 days.", "start": 64, "end": 74},
            {"speaker": "Bob Martinez", "text": "Good point. Let me draft a prioritization document based on revenue impact and engineering effort. I'll share it by end of day.", "start": 74, "end": 82},
        ],
        "action_items": [
            {"text": "Draft feature prioritization document with revenue impact analysis", "assignee": "Bob Martinez"},
            {"text": "Create Slack two-way sync technical specification", "assignee": "Ivy Zhang"},
            {"text": "Document enterprise reporting requirements from top 10 clients", "assignee": "Henry Wang"},
            {"text": "Analyze onboarding flow bottlenecks and propose improvements", "assignee": "Henry Wang"},
        ],
        "chapters": [
            {"title": "Enterprise Client Feedback", "start_offset": 0, "seq": 1},
            {"title": "SMB Feature Requests", "start_offset": 17, "seq": 2},
            {"title": "Reporting Requirements", "start_offset": 39, "seq": 3},
            {"title": "Onboarding Improvements", "start_offset": 64, "seq": 4},
        ],
        "summary_status": "completed",
    },
    {
        "id": MEETING_IDS[4],
        "title": "Budget Review — H2 Planning",
        "occurred_at": "2026-06-24T16:00:00Z",
        "duration_sec": 2100,
        "source": "seeded",
        "media_url": "/sample.mp3",
        "participants": ["Alice Chen", "Bob Martinez", "Carol Williams"],
        "topics": ["Budget", "Hiring"],
        "transcript": [
            {"speaker": "Alice Chen", "text": "Welcome to the H2 budget review. Let's start with our current burn rate and runway.", "start": 0, "end": 6},
            {"speaker": "Bob Martinez", "text": "We're currently burning $420K per month. Our runway is about 18 months at current rate, but that assumes no revenue growth.", "start": 6, "end": 15},
            {"speaker": "Carol Williams", "text": "Revenue is growing at 15% month-over-month. If we maintain that trajectory, we should reach profitability by Q1 next year.", "start": 15, "end": 24},
            {"speaker": "Alice Chen", "text": "Let's discuss the hiring plan. We need to fill 8 positions in H2: 4 engineers, 2 designers, and 2 customer success managers.", "start": 24, "end": 34},
            {"speaker": "Bob Martinez", "text": "The engineering hires are critical. We're falling behind on our roadmap because we don't have enough bandwidth. The 4 engineers will cost approximately $80K per month.", "start": 34, "end": 46},
            {"speaker": "Carol Williams", "text": "For design, we need to support the dashboard redesign and the mobile experience overhaul. Two designers will add about $30K per month.", "start": 46, "end": 56},
            {"speaker": "Alice Chen", "text": "And the customer success hires are needed to support our enterprise growth. Henry's team is at capacity.", "start": 56, "end": 64},
            {"speaker": "Bob Martinez", "text": "Total additional monthly cost for all 8 hires is about $140K. That brings our burn to $560K per month, reducing runway to 14 months.", "start": 64, "end": 74},
            {"speaker": "Carol Williams", "text": "We should consider phasing the hires. Maybe bring on engineers first since they directly impact revenue-generating features.", "start": 74, "end": 83},
            {"speaker": "Alice Chen", "text": "Good idea. Let's prioritize the 4 engineers in July, designers in August, and CS managers in September. That spreads the cost increase over Q3.", "start": 83, "end": 93},
        ],
        "action_items": [
            {"text": "Finalize H2 hiring timeline and offer letters for first 4 engineers", "assignee": "Alice Chen"},
            {"text": "Update financial model with phased hiring plan", "assignee": "Bob Martinez"},
            {"text": "Coordinate with Henry on CS team capacity and ramp timeline", "assignee": "Carol Williams"},
        ],
        "chapters": [
            {"title": "Financial Overview", "start_offset": 0, "seq": 1},
            {"title": "Revenue Trajectory", "start_offset": 15, "seq": 2},
            {"title": "Hiring Plan — Engineering", "start_offset": 24, "seq": 3},
            {"title": "Hiring Plan — Design & CS", "start_offset": 46, "seq": 4},
            {"title": "Phased Approach & Timeline", "start_offset": 74, "seq": 5},
        ],
        "summary_status": "completed",
    },
]


async def seed_data(db: aiosqlite.Connection) -> None:
    """Idempotent seed — safe to call on any existing db connection."""
    # ── User ──
    cursor = await db.execute("SELECT id FROM users WHERE id = ?", (USER_ID,))
    if not await cursor.fetchone():
        await db.execute(
            "INSERT INTO users (id, name, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)",
            (USER_ID, "Default User", "user@fireflies.local", None, now_rfc3339()),
        )
        print(f"  Seeded user: {USER_ID}")

    # ── Topics ──
    for name, tid in TOPIC_IDS.items():
        cursor = await db.execute("SELECT id FROM topics WHERE id = ?", (tid,))
        if not await cursor.fetchone():
            await db.execute("INSERT INTO topics (id, name) VALUES (?, ?)", (tid, name))
    await db.commit()
    print(f"  Seeded {len(TOPIC_IDS)} topics")

    line_counter = 0
    participant_counter = 0
    action_counter = 0
    chapter_counter = 0

    for m in MEETINGS:
        # ── Meeting ──
        cursor = await db.execute("SELECT id FROM meetings WHERE id = ?", (m["id"],))
        if await cursor.fetchone():
            print(f"  Skipping existing meeting: {m['title']}")
            continue

        ts = now_rfc3339()
        await meetings.create(
            db,
            Meeting(
                id=m["id"],
                user_id=USER_ID,
                title=m["title"],
                occurred_at=m["occurred_at"],
                duration_sec=m["duration_sec"],
                source=m["source"],
                media_url=m.get("media_url"),
                created_at=ts,
                updated_at=ts,
            ),
        )

        # ── Participants ──
        parts = []
        for pname in m["participants"]:
            participant_counter += 1
            parts.append(
                Participant(
                    id=f"{PARTICIPANT_ID_BASE}-{participant_counter}",
                    meeting_id=m["id"],
                    name=pname,
                )
            )
        await participants.create_many(db, parts)

        # ── Transcript lines ──
        lines = []
        for i, t in enumerate(m["transcript"]):
            line_counter += 1
            lines.append(
                TranscriptLine(
                    id=f"{LINE_ID_BASE}-{line_counter}",
                    meeting_id=m["id"],
                    seq=i + 1,
                    speaker=t["speaker"],
                    text=t["text"],
                    start_offset=float(t["start"]),
                    end_offset=float(t["end"]),
                )
            )
        await transcript.create_many(db, lines)

        # ── FTS index ──
        for line in lines:
            await db.execute(
                "INSERT INTO transcript_fts (line_id, meeting_id, text) VALUES (?, ?, ?)",
                (line.id, line.meeting_id, line.text),
            )

        # ── Topics link ──
        for tname in m["topics"]:
            tid = TOPIC_IDS.get(tname)
            if tid:
                await topics.link_to_meeting(db, m["id"], tid)

        # ── Action items ──
        for ai in m["action_items"]:
            action_counter += 1
            a_ts = now_rfc3339()
            await action_items.create(
                db,
                ActionItem(
                    id=f"{ACTION_ID_BASE}-{action_counter}",
                    meeting_id=m["id"],
                    text=ai["text"],
                    assignee=ai.get("assignee"),
                    created_at=a_ts,
                    updated_at=a_ts,
                ),
            )

        # ── Chapters ──
        chaps = []
        for c in m["chapters"]:
            chapter_counter += 1
            chaps.append(
                Chapter(
                    id=f"{CHAPTER_ID_BASE}-{chapter_counter}",
                    meeting_id=m["id"],
                    title=c["title"],
                    start_offset=float(c["start_offset"]),
                    seq=c["seq"],
                )
            )
        await chapters.create_many(db, chaps)

        # ── Summary process (completed with mock result) ──
        summary_result = {
            "meeting_name": m["title"],
            "people": {
                "title": "People",
                "blocks": [
                    {"id": uid(), "type": "bullet", "content": p}
                    for p in m["participants"]
                ],
            },
            "session_summary": {
                "title": "Session Summary",
                "blocks": [
                    {"id": uid(), "type": "text", "content": f"Discussion on {', '.join(m['topics']).lower()}."},
                ],
            },
            "action_items": {
                "title": "Immediate Action Items",
                "blocks": [
                    {"id": uid(), "type": "bullet", "content": ai["text"]}
                    for ai in m["action_items"]
                ],
            },
            "key_decisions": {
                "title": "Key Items & Decisions",
                "blocks": [
                    {"id": uid(), "type": "bullet", "content": c["title"]}
                    for c in m["chapters"]
                ],
            },
            "next_steps": {
                "title": "Next Steps",
                "blocks": [
                    {"id": uid(), "type": "bullet", "content": f"Follow up on {m['topics'][0].lower()} action items"}
                ],
            },
        }
        sp_ts = now_rfc3339()
        await db.execute(
            "INSERT INTO summary_processes "
            "(meeting_id, status, provider, result, chunk_count, processing_time, start_time, end_time, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                m["id"],
                "completed",
                "mock",
                json.dumps(summary_result),
                1,
                0.5,
                sp_ts,
                sp_ts,
                sp_ts,
                sp_ts,
            ),
        )

        # ── Meeting notes (empty) ──
        await db.execute(
            "INSERT INTO meeting_notes (meeting_id, created_at, updated_at) VALUES (?, ?, ?)",
            (m["id"], sp_ts, sp_ts),
        )

        await db.commit()
        print(f"  Seeded meeting: {m['title']} ({len(m['transcript'])} lines, {len(m['action_items'])} actions)")

    print("\nSeed complete!")


async def seed():
    """CLI entry point: init db then seed, then close connection."""
    db = await get_db()
    await init_db()
    await seed_data(db)
    await db.close()


if __name__ == "__main__":
    asyncio.run(seed())
