# Fireflies.ai Clone

A full-stack clone of [Fireflies.ai](https://fireflies.ai) — a meeting assistant platform for browsing, transcribing, and summarizing meetings. Built as an SDE Fullstack Assignment.

---

## Live Demo

> Deploy links go here after hosting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, React 18 |
| **Styling** | Tailwind CSS, Radix UI primitives |
| **Rich text** | BlockNote (`@blocknote/react`) |
| **Client state** | Zustand stores |
| **Server state** | TanStack Query (React Query) + Axios |
| **Backend** | Python 3.11+, FastAPI |
| **Database** | SQLite (WAL mode) via `aiosqlite` |
| **AI/LLM** | Mock provider (zero-config) — pluggable for real LLMs |

---

## Features

### Core
- **Meetings Library** — list, search, filter, sort all meetings
- **Transcript Detail** — interactive transcript with speaker labels, bidirectional audio↔transcript seek
- **AI Summary** — AI-generated summary, action items, key decisions, chapters/outline, editable notes
- **Full CRUD** — create (paste/upload/form), edit, delete meetings and action items
- **Fireflies UX** — pixel-close design system, dark mode, toasts, modals, settings placeholders

### Bonus
- ✅ **Highlights & Comments** — annotate transcript lines with 5 colors and threaded comments
- ✅ **Export** — one-click export as Markdown, plain text, or HTML (print to PDF)
- ✅ **Global Search** — FTS5-powered search across transcripts, summaries, and action items
- ✅ **Tags / Topics** — tag meetings and filter the library by topic
- ✅ **Ask AI Chat** — per-meeting Q&A grounded in transcript + summary context
- ✅ **Dark Mode** — full dark/light toggle with `localStorage` persistence

---

## Setup & Running

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**

### Backend

```bash
# From project root
cd backend

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python -m backend.migrate

# Seed sample data (5 meetings with full transcripts, summaries, action items)
python -m backend.seed

# Start the API server
uvicorn backend.app.main:app --reload --port 8000
```

> API available at `http://localhost:8000`  
> Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

> App available at `http://localhost:3000`

> **Note:** The `frontend/.env.local` already sets `NEXT_PUBLIC_API_URL=http://localhost:8000`.  
> Run the backend first, then the frontend. Both must run concurrently.

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js 14, App Router)       │
│                                         │
│  /              → Meetings Library       │
│  /m/[id]        → Meeting Detail        │
│  /m/[id]/chat   → Ask AI Chat           │
│  /create        → Create Meeting        │
│  /search        → Global Search         │
│  /settings      → Settings (placeholder)│
│                                         │
│  State: Zustand (client) + TanStack     │
│         Query (server cache)            │
│  HTTP:  typed axios apiClient           │
└──────────────────┬──────────────────────┘
                   │ REST / JSON
┌──────────────────▼──────────────────────┐
│  Backend (Python + FastAPI)              │
│                                         │
│  Routers → Application Services         │
│          → Repositories (SQL)           │
│          → Adapters (ports & adapters)  │
│                                         │
│  Adapters:                              │
│    MockSummaryProvider (default)        │
│    MockChatAdapter (default)            │
│    StaticUserAdapter (default user)     │
│                                         │
│  CustomLogger (pino-python, structured) │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  SQLite (WAL mode) + FTS5               │
│  Versioned migrations (/migrations/)    │
└─────────────────────────────────────────┘
```

### Design Patterns

- **Tactical anemic DDD** — routers → services → repositories → entities
- **Adapter pattern (ports & adapters)** — `SummaryProvider`, `ChatProvider`, `UserProvider` are protocols; mock and real adapters implement the same interface, making them interchangeable without changing application code
- **Repository pattern** — all SQL isolated in `backend/app/repositories/`; services are the only callers
- **Summary state machine** — `pending → processing → completed | failed` in `summary_processes` table; client polls every 2s
- **Transcript sync** — `start_offset`/`end_offset` on each line enables bidirectional audio↔transcript seek with binary search

---

## Database Schema

```
users 1────∞ meetings 1────∞ transcript_lines  (FTS5 index)
                        ├──1 summary_processes (state machine)
                        ├──1 meeting_notes
                        ├──∞ action_items
                        ├──∞ chapters
                        ├──∞ participants
                        ├──∞ highlights       (transcript annotations)
                        ├──∞ comments         (threaded comments on lines)
                        ├──∞ chat_threads 1──∞ chat_messages
                        └──∞ meeting_topics ──∞ topics (M:N)
```

**Key decisions:**
- All PKs are UUID TEXT; timestamps are RFC3339 TEXT in UTC
- `ON DELETE CASCADE` from meetings ensures atomic cleanup
- SQLite WAL mode for concurrent read/write
- FTS5 virtual table on `transcript_lines.text` for full-text search
- `source` column on meetings and `provider/model` on summaries are open enums for extensibility

---

## API Reference

```
# Meetings
GET    /api/meetings                       # list (q, topic, sort, limit, offset)
POST   /api/meetings                       # create → 201 {id}
GET    /api/meetings/{id}                  # detail + participants
PATCH  /api/meetings/{id}                  # edit metadata
DELETE /api/meetings/{id}                  # cascade delete

# Transcript
GET    /api/meetings/{id}/transcript       # paginated lines
GET    /api/meetings/{id}/transcript/search?q=  # FTS matches

# Summary & Notes
POST   /api/meetings/{id}/summary          # trigger async → 202
GET    /api/meetings/{id}/summary          # poll (202/200/400)
PUT    /api/meetings/{id}/summary          # persist edited JSON
PUT    /api/meetings/{id}/notes            # BlockNote notes

# Action Items
GET    /api/meetings/{id}/action-items
POST   /api/meetings/{id}/action-items
PATCH  /api/action-items/{id}
DELETE /api/action-items/{id}

# Topics & Chapters
GET    /api/meetings/{id}/chapters
POST   /api/meetings/{id}/topics
DELETE /api/meetings/{id}/topics/{topicId}
GET    /api/topics

# Bonus
GET    /api/search?q=&type=all|transcript|summary|action_item
GET    /api/meetings/{id}/export?format=md|txt|pdf
POST   /api/meetings/{id}/highlights
GET    /api/meetings/{id}/highlights
DELETE /api/meetings/{id}/highlights/{id}
POST   /api/meetings/{id}/comments
GET    /api/meetings/{id}/comments
DELETE /api/meetings/{id}/comments/{id}
POST   /api/meetings/{id}/chat             # create/get thread
POST   /api/chat/{threadId}/messages       # Q&A
GET    /api/chat/{threadId}/messages       # history

# Health
GET    /api/health
```

---

## Assumptions

1. **Single default user** — no real authentication. A default user (`id='user-default'`) is seeded. The `UserProvider` adapter always returns this user.
2. **Mock AI by default** — summaries and chat use `MockSummaryProvider` and `MockChatAdapter` respectively (zero config, no API keys needed). To enable real LLM, set `SUMMARY_PROVIDER=llm` and the appropriate provider env vars.
3. **PDF export** — the export endpoint returns a print-ready HTML document (the browser's native print-to-PDF works on it). A headless PDF engine like `weasyprint` can be wired in optionally.
4. **Audio placeholder** — real speech-to-text is out of scope. Media can be a sample `.mp3`/`.mp4` URL; all seek/sync logic works off the stored `start_offset` values.

---

## Project Structure

```
fireflies-clone/
├── frontend/src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # UI components (library, transcript, summary, bonus, nav, ui)
│   ├── api/           # Typed axios apiClient + TanStack Query hooks
│   ├── stores/        # Zustand stores (session, library, player, summary, search)
│   └── types/         # Shared TypeScript interfaces
├── backend/
│   ├── app/
│   │   ├── routers/       # FastAPI routers (thin HTTP layer)
│   │   ├── services/      # Application services (use-case orchestration)
│   │   ├── repositories/  # SQL persistence (anemic)
│   │   ├── adapters/      # Ports & adapters (summary, chat, user)
│   │   ├── models/        # Anemic entity dataclasses
│   │   └── logging/       # CustomLogger (pino-python, structured)
│   ├── migrations/    # Versioned SQL migration files
│   └── seed.py        # Manual dev seed script
└── HLD_AND_TECH_SPECS.md
```
