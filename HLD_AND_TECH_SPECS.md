# Fireflies.ai Clone — High-Level Design & Technical Specifications

> **Document purpose.** This is the single source of truth for the architecture, data model, and per-feature technical specifications of the Fireflies.ai clone defined in `Scaler_SDE_Fullstack_Assignment_-_Fireflies_Clone.md`.
>
> **Scope.** This document covers **only** the assignment's **Core Features (1–5)** and **Bonus Features**. Explicitly **out of scope** (placeholders / "Coming Soon" only, and therefore *not* specced here): real-time call bots, actual speech-to-text, calendar/Zoom/Meet/CRM integrations, team/sharing/collaboration, and real multi-user authentication.
>
> **Engineering baseline.** The design leans on a small set of proven, well-documented patterns — **Repository pattern, async background-job state machine, chunked LLM summarization, audio↔transcript timestamp sync fields, and React context-driven state** — chosen for fit against the **Next.js + FastAPI + SQLite** stack mandated by the assignment.

---

## Table of Contents

1. [Scope & Non-Goals](#1-scope--non-goals)
2. [Technology Stack & Rationale](#2-technology-stack--rationale)
3. [System Architecture (HLD)](#3-system-architecture-hld)
4. [Design Patterns](#4-design-patterns)
5. [Database Schema Design](#5-database-schema-design)
6. [Cross-Cutting Technical Specifications](#6-cross-cutting-technical-specifications)
7. [Core Feature 1 — Meetings Library / Dashboard](#7-core-feature-1--meetings-library--dashboard)
8. [Core Feature 2 — Meeting / Transcript Detail View](#8-core-feature-2--meeting--transcript-detail-view)
9. [Core Feature 3 — AI Summary & Notes](#9-core-feature-3--ai-summary--notes)
10. [Core Feature 4 — Meeting Management (CRUD)](#10-core-feature-4--meeting-management-crud)
11. [Core Feature 5 — Fireflies Experience (UI/UX System)](#11-core-feature-5--fireflies-experience-uiux-system)
12. [Bonus Features — Technical Specifications](#12-bonus-features--technical-specifications)
13. [Phased Delivery Roadmap](#13-phased-delivery-roadmap)
14. [Appendix A — Consolidated API Surface](#appendix-a--consolidated-api-surface)
15. [Appendix B — Project File Tree](#appendix-b--project-file-tree)

---

## 1. Scope & Non-Goals

### 1.1 In Scope (spec'd end-to-end)

**Core (Must Have):**
1. Meetings Library / Dashboard — list, search, filter, sort, navbar.
2. Meeting / Transcript Detail View — interactive transcript, media player with seek bar, bidirectional click↔seek, in-transcript search with highlight.
3. AI Summary & Notes — summary, action items, key topics/outline/chapters; seeded, mocked, or LLM-generated.
4. Meeting Management (CRUD) — create (upload/paste/form), edit metadata, delete, action-item lifecycle; all persisted.
5. Fireflies Experience — navigation/layout, panels, forms/modals/search/filters, toasts, settings placeholders.

**Bonus (Optional, specced to be ready-to-build):**
- Comments / highlights / soundbites on transcript segments.
- Export transcript or summary (PDF / Markdown / TXT).
- Global search across all meetings.
- Tags / topics and filtering by them.
- LLM-powered "ask a question about this meeting" chat.
- Dark mode.

### 1.2 Non-Goals (placeholders only — NOT specced)

Per the assignment's "Mocked / Placeholder Sections": real-time bot joining calls, real STT, Zoom/Meet/Calendar/CRM integrations, team/sharing, and real authentication. Each appears in the UI as a visible **"Coming Soon"** surface so the app *feels* complete, but no backend logic is designed for them. A single default logged-in user is assumed.

---

## 2. Technology Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + React 18 | Mandated; App Router gives file-based routing for library vs detail view. |
| **UI** | Tailwind CSS + Radix UI primitives + shadcn/ui pattern | Composable, accessible primitives; enables pixel-accurate Fireflies clone. |
| **Rich text (notes/summary editor)** | BlockNote (`@blocknote/react`, `@blocknote/shadcn`) | Structured, editable summary blocks with a clean serializable JSON model. |
| **Client state** | Zustand stores | Lightweight, hook-based, no boilerplate; one store per bounded domain (§6.2). |
| **Server state** | TanStack Query (React Query) + **axios** HTTP client | Dedicated data-fetching/caching/mutation layer; a typed axios `apiClient` (§6.8) is the single FE→BE transport. |
| **Backend** | **Python + FastAPI** | Mandated language/framework; async, Pydantic validation, native background tasks. |
| **Backend architecture** | **Tactical anemic DDD** | Bounded contexts (Meetings, Transcripts, Summaries, …), thin anemic entity/repository objects, application services orchestrating use cases (§4). |
| **API call logging** | **pino (Python port) + context-propagated `CustomLogger`** | Structured JSON logs via a custom event-based logger (`CustomLogger` + `Events`/`EventTypes`/`Messages`) that attaches request-scoped context (request id, user, route) to every log line. Since Python has no true CLS, the same correlation is achieved by passing a logger instance through the call chain / FastAPI dependency context (§6.7). |
| **AI orchestration** | Provider adapters behind a `SummaryProvider` port | Schema-constrained output; `MockSummaryProvider` and `LLMSummaryProvider` implement the **same `SummaryResponse` interface** as real data — mock and real are interchangeable (§4.4, §9.1). |
| **LLM providers** | Ollama (local) / OpenAI / Anthropic / Groq / OpenRouter | Pluggable matrix; optional for the clone (mocked summaries allowed). |
| **Database** | SQLite via `aiosqlite` | Mandated DB; we design our own schema. WAL mode for concurrency. |
| **Migrations** | Versioned SQL files (`/backend/migrations`) | Explicit, reviewable, additive schema evolution. |
| **Virtualization** | `@tanstack/react-virtual` | Renders long transcripts without jank for smooth long-meeting playback. |
| **Deployment** | Vercel (FE) + Render/Railway (BE) + persistent SQLite volume | Satisfies "hosted, working link" deliverable. |

> **Logging note.** The directive named "pino + CLS," but CLS (continuation-local storage / `AsyncLocalStorage`) is a Node.js-only primitive with no Python equivalent. We honor the *intent* by using the **Python port of pino** and a structured, event-based `CustomLogger` (mirroring the team's existing Python logging util) that carries request-scoped fields through FastAPI request state / dependency injection, so every log line is correlated exactly as CLS would provide.

---

## 3. System Architecture (HLD)

### 3.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js, TypeScript)                 │
│                                                                      │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────────┐ │
│  │ App Router    │  │ UI Components   │  │ Client State (Zustand)   │ │
│  │ /  (library)  │  │ shadcn/Radix    │  │ • useSessionStore        │ │
│  │ /m/[id]       │  │ BlockNote       │  │ • useLibraryStore        │ │
│  │ /create       │  │ AudioPlayer     │  │ • usePlayerStore         │ │
│  │ /settings     │  │ Toasts/Modals   │  │ • useSummaryStore        │ │
│  └──────┬────────┘  └────────┬────────┘  └────────────┬─────────────┘ │
│         │                      │                        │               │
│  ┌──────┴──────────────────────┴────────────────────────┴───────────┐ │
│  │  Server State: TanStack Query  ←  typed axios apiClient           │ │
│  └──────────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │ HTTPS / JSON  (REST)
┌─────────────────────────────────┼──────────────────────────────────────┐
│                                 ▼     BACKEND (Python + FastAPI)        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FastAPI middleware  →  CustomLogger (pino-python)                │  │
│  │  request-scoped context (req id / user / route) on every line     │  │
│  └───────┬──────────────┬───────────────┬──────────────┬─────────────┘  │
│          ▼              ▼               ▼              ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Application Services (use-case orchestration)  — Tactical DDD    │  │
│  │  CreateMeetingService · DeleteMeetingService · GenerateSummary …  │  │
│  └───────┬──────────────┬───────────────┬──────────────┬─────────────┘  │
│          ▼              ▼               ▼              ▼                │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Repositories│ │ Transcript   │ │ Summary  │ │ Export Service   │    │
│  │ (anemic,    │ │ Import       │ │ Provider │ │ (PDF/MD/TXT gen) │    │
│  │  SQL)       │ │ Parser       │ │ Adapter  │ │                  │    │
│  └──────┬──────┘ └──────────────┘ └────┬─────┘ └──────────────────┘    │
│         │                          ┌───┴────────────┐                   │
│         │                          ▼                ▼                   │
│         │              ┌────────────────┐ ┌──────────────────┐          │
│         │              │ summary_       │ │ SummaryProvider  │          │
│         │              │ processes      │ │ port: Mock | LLM │          │
│         │              │ (status table) │ │ (same interface) │          │
│         │              └────────────────┘ └──────────────────┘          │
│         ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │            SQLite (WAL)  +  versioned migrations                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘

NOTE: No runtime seed job. Seeding is a manual dev script (python -m backend.seed),
not part of the runtime architecture. See §6.6.
```

### 3.2 Request & Data Flow Examples

**A. Load library page**
`FE / route mounts → useMeetings() (TanStack Query) calls apiClient.get('/api/meetings') → FastAPI router → CreateOrListMeetingsService → MeetingsRepository → SQLite → JSON list (sorted desc) → table/cards render. Client-side filter/sort state lives in useLibraryStore (Zustand).`

**B. Create meeting from pasted transcript**
`/create form submit → useCreateMeeting() mutation (TanStack Query) → apiClient.post('/api/meetings') → CreateMeetingService (transactional insert of meeting + participants + transcript lines via repositories) → 201 { id } → invalidate useMeetings → redirect to /m/[id] → optionally POST /api/meetings/{id}/summary (kick off async generation).`

**C. Async summary generation (the key state machine)**
`POST /api/meetings/{id}/summary → GenerateSummaryService creates process row (status=pending) → FastAPI BackgroundTasks → SummaryProvider adapter (Mock or chunked LLM) → status=processing → merge chunks → status=completed (result=JSON) | failed (error=msg). FE useSummary() (TanStack Query) polls GET /api/meetings/{id}/summary every 2s via refetchInterval until terminal.`

This is realized through an in-process background task, a `summary_processes` status table, and a polling endpoint that returns `202` while processing and `200` when complete (detailed in §9). Every step emits a structured `CustomLogger` event (§6.6).

### 3.3 Architecture Decisions (ADR-style)

| ID | Decision | Rationale |
|---|---|---|
| ADR-1 | REST over GraphQL | Assignment emphasizes clean API design; REST is simpler to evaluate and document. (Fireflies uses GraphQL but that is out of scope to match.) |
| ADR-2 | Single SQLite file, WAL mode | Mandated DB; WAL enables concurrent read during background writes. |
| ADR-3 | Async summary via in-process BackgroundTasks + status table | Avoids Redis/Celery complexity for a single-user demo; keeps the stack minimal. |
| ADR-4 | Mockable LLM via provider adapter | Assignment allows seeded/mocked summaries; `MockSummaryProvider` returns canned structured JSON so the app works with zero API keys. |
| ADR-5 | Default logged-in user (no real auth) | Assignment says assume default user; we model `user` table for schema completeness and FK relations but seed one user. |
| ADR-6 | Timestamps stored as RFC3339 TEXT | SQLite has no native datetime type; TEXT in UTC is unambiguous and trivially sortable. |

---

## 4. Design Patterns

The backend follows **tactical anemic Domain-Driven Design**: the domain is split into **bounded contexts** (Meetings, Transcripts, Summaries, ActionItems, Topics, …), each with a thin, behavior-less (anemic) set of entities and repositories, and an **application service** that orchestrates the use case. Cross-cutting variability (mock vs. real data, LLM provider, user identity) is handled with the **strategic Adapter pattern** — ports defined in the core, concrete adapters plugged in at the composition root. These are selected for fit against the Next.js + FastAPI + SQLite stack and the assignment's single-user, post-meeting focus.

### 4.1 Tactical anemic DDD layering (backend)
The backend is layered, top-to-bottom:

```
routers/        → HTTP: parse request, call application service, shape response. No logic.
services/       → Application services: one class/function per use case
                  (CreateMeetingService, DeleteMeetingService, GenerateSummaryService).
                  They load via repositories, enforce invariants, coordinate transactions,
                  and emit structured log events. This is where business rules live.
repositories/   → Anemic persistence: pure SQL mapped to/from dataclasses/entities.
                  No business logic. One module per aggregate root.
models/entities → Anemic dataclass entities (Meeting, TranscriptLine, ActionItem, …):
                  state only, no behavior.
```

- **Why anemic?** For a CRUD-centric post-meeting app, business rules are thin and live naturally in services; rich domain models would add ceremony without payoff. Anemic entities + transactional services keep the code shallow, predictable, and easy to explain at evaluation.
- **Bounded contexts** keep each feature's data and service code isolated (e.g., the Summaries context knows nothing about Highlights), so features map 1:1 to folders and can be built/removed independently.

### 4.2 Strategic Adapter pattern (ports & adapters)
Anything that can vary behind a stable interface is a **port** with one or more **adapters**, wired at startup. This is the backbone of the "mock vs. real, zero-config" promise:

| Port (interface) | Adapters | Resolved by |
|---|---|---|
| `UserProvider` | `StaticUserAdapter` (default, returns the seeded default user) | config/env |
| `SummaryProvider` | `MockSummaryProvider`, `LLMSummaryProvider` (OpenAI/Ollama/Anthropic/…) | config/env |
| `ChatProvider` | `MockChatAdapter`, `LLMChatAdapter` | config/env |
| `Logger` | `CustomLogger` (pino-python, §6.7) | always on |

The defining rule: **mock and real data share the exact same type interface.** `SummaryProvider.summarize(transcript) -> SummaryResponse` returns an identical `SummaryResponse` dataclass/Pydantic model whether the implementation is canned JSON or a live LLM call. The application service depends only on the port, so swapping adapters changes behavior without touching use-case code — and the frontend never knows which produced the data. (See §6.1 for the `User` port and §9.1 for the summary port.)

### 4.3 Repository pattern (data access)
All SQL is isolated in `backend/app/repositories/*.py` — one module per aggregate root (meetings, transcripts, summaries, action items, topics), each exposing async functions that accept an `aiosqlite` connection/pool. **Application services are the only callers; routers never write SQL.** This keeps transport, business, and persistence concerns separated and makes the data layer trivially testable (swap in an in-memory repository adapter).

### 4.4 Transactional multi-table writes
Operations that touch more than one table — notably create-meeting (meeting row + participants + transcript lines) and delete-meeting (meeting plus every dependent row) — run inside an explicit `BEGIN … COMMIT/ROLLBACK` block orchestrated by the application service. A meeting and all of its transcripts/summaries land together, or not at all.

### 4.5 Summary state machine (background job)
Long-running summarization is modeled as a state machine rather than a synchronous request. A `summary_processes` row is keyed by `meeting_id` and carries `status ∈ {pending, processing, completed, failed}` plus `result` (JSON), `error`, `start_time`, `end_time`, `chunk_count`, and `processing_time`. The client-facing endpoint returns `202` while non-terminal and `200` once complete (or `400` on failure); the frontend polls until terminal. This avoids blocking HTTP workers on LLM calls and degrades gracefully to a recoverable error state. The chunked-LLM-with-overlap detail lives in §9.

### 4.6 Audio↔transcript timestamp sync
Each transcript line carries `start_offset` / `end_offset` (REAL seconds from recording start). This is the data-model foundation for the signature "click line → seek player" interaction: even when audio is a placeholder sample, these offsets let any media sync to transcript lines. When offsets are absent (e.g., a plain-text paste with no timing), the system falls back to sequential proportional offsets spread across `meetings.duration_sec`.

### 4.7 Client state via Zustand stores (frontend)
Cross-cutting *client* state lives in focused **Zustand stores** rather than React Context. State is partitioned by domain — session/theme/toasts, the meetings library, the transcript player, summary polling — so a change in one area does not re-render unrelated subtrees. Each store exposes actions; components subscribe with selectors. *Server* state (lists, detail documents, mutation results) is a separate concern handled by **TanStack Query** (§6.8), so Zustand holds only true client/UI state and TanStack Query is the cache for everything that lives on the server. This separation keeps data flow one-directional and debuggable.

### 4.8 Engineering boundaries
- Transport is plain HTTP REST (no IPC abstraction layer).
- Audio capture / speech-to-text are explicitly out of scope (placeholders only).
- No licensing or feature-flag machinery — the app has one configuration surface.
- CORS uses an explicit origin allow-list, never a wildcard.
- No background seed/migration worker runs in the live app; seeding is a manual dev script (§6.6).

---

## 5. Database Schema Design

> SQLite, WAL mode, foreign keys enforced (`PRAGMA foreign_keys = ON`). All PKs are TEXT UUIDs (`uuid4`). Timestamps are RFC3339 TEXT in UTC. Cascade deletes centralize cleanup — **deleting a meeting removes everything below it** via `ON DELETE CASCADE`.

### 5.1 ER Overview

```
users 1───∞ meetings 1───∞ transcript_lines
                       ├──1 summary_processes
                       ├──1 meeting_notes
                       ├──∞ action_items
                       ├──∞ topics  ──∞ meeting_topics ──┐
                       │                                 │ (tags M:N)
                       ├──∞ highlights                  │
                       ├──∞ comments                     │
                       └──∞ chat_threads 1───∞ chat_messages
```

### 5.2 DDL

```sql
-- ============================================================
-- users  (single default user; modeled for schema completeness)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,          -- 'user-default'
    name          TEXT NOT NULL,
    email         TEXT UNIQUE,
    avatar_url    TEXT,
    created_at    TEXT NOT NULL
);

-- ============================================================
-- meetings  (library + detail root)
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    -- recorded/meeting wall-clock start, drives "date" in library
    occurred_at   TEXT NOT NULL,
    duration_sec  REAL NOT NULL DEFAULT 0,   -- drives "duration" in library
    source        TEXT NOT NULL DEFAULT 'manual',  -- manual|upload|seeded|mock
    media_url     TEXT,                      -- sample/placeholder audio|video
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meetings_user_occurred ON meetings(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_title ON meetings(title);

-- ============================================================
-- transcript_lines  (interactive transcript segments)
--   start_offset/end_offset = seconds from recording start →
--   enables click-line-seeks-player (audio↔transcript sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS transcript_lines (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    seq           INTEGER NOT NULL,          -- order index
    speaker       TEXT,                      -- "Speaker 1" / "Alice"
    text          TEXT NOT NULL,
    -- wall-clock timestamp shown in UI (e.g. "14:30:05")
    timestamp     TEXT,
    -- recording-relative offsets for seek sync (REAL seconds)
    start_offset  REAL,
    end_offset    REAL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transcript_meeting_seq
    ON transcript_lines(meeting_id, seq);
CREATE INDEX IF NOT EXISTS idx_transcript_fts ON transcript_lines(text);

-- Full-text search index across transcript text (SQLite FTS5)
CREATE VIRTUAL TABLE transcript_fts USING fts5(
    line_id UNINDEXED,
    meeting_id UNINDEXED,
    text,
    content='transcript_lines',
    content_rowid='rowid'
);

-- ============================================================
-- participants  (library shows them; detached from speaker labels)
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    email         TEXT,
    role          TEXT
);
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);

-- ============================================================
-- summary_processes  (async summary state machine)
-- ============================================================
CREATE TABLE IF NOT EXISTS summary_processes (
    meeting_id      TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    status          TEXT NOT NULL,           -- pending|processing|completed|failed
    provider        TEXT,                    -- mock|openai|ollama|...
    model           TEXT,
    result          TEXT,                    -- JSON SummaryResponse blob
    error           TEXT,
    chunk_count     INTEGER NOT NULL DEFAULT 0,
    processing_time REAL NOT NULL DEFAULT 0,
    start_time      TEXT,
    end_time        TEXT,
    result_backup   TEXT,                    -- pre-regeneration snapshot
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- ============================================================
-- action_items  (first-class; CRUD + completion — Core Feat 3 & 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS action_items (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    text          TEXT NOT NULL,
    assignee      TEXT,
    due_date      TEXT,
    is_completed  INTEGER NOT NULL DEFAULT 0,  -- bool 0/1
    source_line_id TEXT REFERENCES transcript_lines(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_actions_meeting ON action_items(meeting_id);

-- ============================================================
-- topics  +  meeting_topics  (key topics/outline + tag filter bonus)
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
    id            TEXT PRIMARY KEY,
    name          TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS meeting_topics (
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    topic_id      TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_meeting_topics ON meeting_topics(topic_id);

-- ============================================================
-- chapters  (key topics / outline / chapters — Core Feat 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    start_offset  REAL,                      -- seek anchor
    summary       TEXT,
    seq           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapters_meeting ON chapters(meeting_id, seq);

-- ============================================================
-- meeting_notes  (free-form user notes via BlockNote)
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_notes (
    meeting_id      TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    notes_markdown  TEXT,
    notes_json      TEXT,                     -- BlockNote serialized blocks
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- ============================================================TRANSCRIPT BONUS: highlights (soundbites) + comments
-- ============================================================
CREATE TABLE IF NOT EXISTS highlights (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    line_id       TEXT NOT NULL REFERENCES transcript_lines(id) ON DELETE CASCADE,
    color         TEXT DEFAULT 'yellow',
    note          TEXT,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    line_id       TEXT NOT NULL REFERENCES transcript_lines(id) ON DELETE CASCADE,
    author        TEXT,
    body          TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

-- ============================================================
-- chat  (BONUS: "ask a question about this meeting")
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_threads (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
    id            TEXT PRIMARY KEY,
    thread_id     TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role          TEXT NOT NULL,             -- user|assistant
    content       TEXT NOT NULL,
    created_at    TEXT NOT NULL
);
```

### 5.3 Schema Notes (eval-relevant)

- **Normalization & relationships:** 1:N for meeting→(lines, action_items, chapters, highlights, comments, participants); M:N for meeting↔topic; 1:1 for meeting→(summary_processes, meeting_notes). FKs + cascade keep deletion atomic.
- **Indexes:** every FK and every filter/sort column (`occurred_at`, `seq`, `meeting_id`, `topic_id`) is indexed; FTS5 virtual table powers in-transcript and global search.
- **Designed-for-feature:** every assignment requirement maps to a table — e.g., "Add/edit/complete action items" → `action_items.is_completed`; "key topics/outline/chapters" → `chapters` + `topics`; "search within transcript" → `transcript_fts`.
- **Extensibility:** `source` on meetings and `provider/model` on summaries are open enum columns, and the migration policy is strictly additive (new columns/tables only, never destructive) so the schema can grow without breaking existing data — e.g., adding speaker labels or richer notes is a future `ALTER TABLE … ADD COLUMN`.

---

## 6. Cross-Cutting Technical Specifications

### 6.1 Authentication & Session (placeholder per assignment)
- **Default user via the `UserProvider` adapter (§4.2).** A `StaticUserAdapter` always returns the seeded default user (`id='user-default'`). Application services depend on the `UserProvider` port, never on a hardcoded constant — so a future real-auth adapter is a drop-in.
- **Frontend session** lives in the `useSessionStore` Zustand store (current user, theme, toasts); no login screen.
- **Settings placeholders:** `/settings` route renders Fireflies-style tabs (Profile, Integrations, Team, Notifications) with non-functional "Coming Soon" bodies — visible but inert, exactly as the assignment permits.
- **API:** there are no tokens; identity is resolved server-side through the adapter. (Documented as an assumption in README.)

### 6.2 Frontend State Management — Zustand stores (client) + TanStack Query (server)
Client/UI state and server state are deliberately separated:

**Client state → Zustand stores** (one per bounded domain, selected with fine-grained selectors to avoid re-render storms):

| Store | Owns | Consumers |
|---|---|---|
| `useSessionStore` | current user, theme (light/dark), toasts queue | root layout |
| `useLibraryStore` | search query, filter/sort selection, list view mode | library page, create modal |
| `usePlayerStore` | `currentTime`, `seek(t)`, isPlaying, active line id, in-transcript query + matches | detail page, player, transcript panel |
| `useSummaryStore` | summary-polling state, regenerate trigger, edited-summary draft | summary panel |

Stores hold only **client/UI** state — selections, drafts, player transport. Each store exposes actions; components subscribe via selectors (`usePlayerStore(s => s.currentTime)`).

**Server state → TanStack Query.** Anything that lives on the server (the meetings list, a meeting's transcript, the summary document, action items) is fetched/cached/mutated through TanStack Query hooks layered on the typed axios `apiClient` (§6.8). Mutations call `apiClient`, then `queryClient.invalidateQueries` to refetch. This keeps Zustand free of server data and makes caching/refetch/polling (e.g., summary status polling) declarative.

### 6.3 Theming & Dark Mode (Core 5 + Bonus)
- Tailwind `darkMode: 'class'`; `useSessionStore` toggles `<html class="dark">`; preference persisted to `localStorage`.
- Design tokens defined in `tailwind.config.ts` (`colors.fireflies.*`) sourced from studying Fireflies' UI (deep navy/purple chrome, white content canvas, accent yellow/teal).
- Every component built with semantic tokens (`bg-background`, `text-foreground`, `border-border`) so dark mode is automatic.

### 6.4 Error Handling
- **Backend:** repository → `AppError` hierarchy (`NotFoundError`, `ValidationError`, `SummaryError`); FastAPI exception handlers map to `{ "detail": str, "code": str }` with correct HTTP codes (404/400/409/500). Centralized handlers keep route code clean, and every error path emits a structured `CustomLogger.error(...)` event (§6.6).
- **Frontend:** the axios `apiClient` (§6.8) throws typed `ApiError`s; TanStack Query mutation `onError` surfaces user-facing messages via the toast queue in `useSessionStore`, with retry where safe.

### 6.5 Toasts / Notifications (Core 5)
- A `useToast()` hook (backed by the `useSessionStore` toast queue) + `<Toaster/>` (Radix-based) renders auto-dismissing notifications: "Meeting saved", "Summary ready", "Action item completed", "Export failed".
- Matches Fireflies' subtle toast pattern and the assignment's "Notifications / toasts" requirement.

### 6.6 API Call Logging — `CustomLogger` (pino-python)
Structured JSON logging modeled on the team's existing Python logging util: an event-based `CustomLogger` over the **Python port of pino**, with `Events` / `EventTypes` / `Messages` vocabularies and a per-request `Record` of timings.

- **Request-scoped context without CLS.** Python has no continuation-local storage, so correlation that CLS would give for free is achieved by instantiating a `CustomLogger` per request inside a FastAPI middleware, attaching `{ request_id, user_id, route, method }`, and passing it down via FastAPI dependency injection / request state. Application services and repositories accept the logger and call `logger.info({ 'event': Events.…, 'event_type': EventTypes.…, 'time_taken': (start, end), ... })`; `pino` emits one structured line with the request context merged in.
- **Shape (mirrors the reference util):**
  ```python
  class CustomLogger:
      MESSAGE = Messages; EVENT = Events; EVENT_TYPE = EventTypes
      entity = {'name': 'fireflies-clone-backend'}
      def info(self, json): ...    # also error / warning / debug
      def start_recording(self): ...          # per-request Record of timings
      def set_user(self, user): ...           # request-scoped field
  ```
  where `Events` covers both domain (`MEETING_CREATED`, `SUMMARY_COMPLETED`, `TRANSCRIPT_IMPORTED`) and API (`GET_MEETINGS`, `SUMMARY_PROVIDER_CALL`) events, and `EventTypes` classifies them (`api`, `db_update`, `internal_process`, `client`). A `time_taken` pair is converted to ms and accumulated in the request `Record`, flushed on the terminal event — exactly the reference util's behavior.
- **Payload safety:** responses/errors are run through size-capping and exception-normalization helpers before logging, so no giant bodies or raw `Exception` objects hit the log stream.
- Every outbound call from a backend service (e.g., the `LLMSummaryAdapter` calling an LLM) is logged as an `api` event with `time_taken`, status code, and capped payload — giving end-to-end observability of the request → service → adapter → external-API chain.

### 6.7 API Conventions
- Base path `/api`. Resources are nouns: `/api/meetings`, `/api/meetings/{id}/transcript`, `/api/meetings/{id}/summary`, `/api/meetings/{id}/action-items`, `/api/search`.
- **Status codes:** 200 read, 201 create, 204 delete, 202 accepted (async summary), 400 validation, 404 missing, 409 conflict, 500 server.
- **Pagination:** `?limit=&offset=` + `has_more`, used wherever a collection can grow large (meetings list, transcript lines).
- **Validation:** Pydantic request/response models for every endpoint.
- **CORS:** explicit allow-list (Vercel + localhost:3000) — never `*`.

### 6.8 HTTP Client (frontend) — typed axios `apiClient` + TanStack Query
- A single **axios instance** `frontend/src/lib/apiClient.ts` is the only FE→BE transport:
  ```ts
  export const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
  apiClient.interceptors.request.use(cfg => { /* inject trace id, auth (none) */ return cfg; });
  apiClient.interceptors.response.use(r => r, err => Promise.reject(ApiError.from(err)));
  ```
  Endpoints are grouped behind typed service modules (`meetingsApi.ts`, `summaryApi.ts`, …) that return typed response shapes — **no component calls axios directly**.
- **TanStack Query** wraps these service modules: `useMeetings(filters)`, `useMeeting(id)`, `useTranscript(id)`, `useGenerateSummary()` (with `refetchInterval` polling while status is non-terminal), etc. Keys are derived from arguments for automatic cache identity; mutations invalidate the relevant keys. This is the server-cache layer; Zustand (§6.2) owns only client state.

### 6.9 Seeding & mock data (manual dev script — not a runtime job)
There is **no background seeding job and no scheduler** in the runtime app. Sample data is provided two ways:
1. **Manual seed script** — `python -m backend.seed` (a standalone, idempotent script, not wired into app startup) inserts the default user and **≥5 meetings**, each with a full transcript (multi-speaker, with `start_offset`/`end_offset`), participants, a completed summary, 3–6 action items, 3–5 chapters, and 2–4 topics. Re-runnable: checks existence by stable seed IDs before inserting.
2. **Live mock via adapters** — when no seed data and no LLM keys are present, the `MockSummaryProvider` / `MockChatAdapter` (§4.2) return canned structured responses through the same interfaces as real data, so every feature is exercisable with zero configuration.

Both satisfy the assignment's "seed your database … immediately usable" and "summaries can be seeded, mocked, or LLM-generated" without coupling sample data to the application lifecycle.

---

## 7. Core Feature 1 — Meetings Library / Dashboard

> *"Recreate the Fireflies meetings home view."*

### 7.1 Objective
A dashboard listing past meetings with rich metadata, instant search/filter/sort, and a top navbar — the app's landing experience.

### 7.2 Phases

#### Phase 1.1 — Data & API
- **Repo:** `MeetingsRepository.list(user_id, filters)`.
- **Endpoint:** `GET /api/meetings`
  - Query params: `q` (title/participant), `participant`, `topic`, `from`, `to`, `sort=recent|title|duration`, `limit`, `offset`.
  - **Response 200:**
    ```json
    { "items": [{
        "id":"m-1","title":"Q3 Planning",
        "occurred_at":"2026-06-20T15:00:00Z",
        "duration_sec":3600,
        "participants":["Alice","Bob","Carol"],
        "topics":["Roadmap","Hiring"],
        "summary_status":"completed",
        "action_item_count":4
    }], "has_more": false }
    ```
  - SQL: `meetings` LEFT JOIN aggregated `participants`/`meeting_topics`/`action_items`; `WHERE` built from filters; `ORDER BY occurred_at DESC` default.

#### Phase 1.2 — Library UI (list/cards)
- Route `/` → `useMeetings()` (TanStack Query) feeds the grid/list toggle of `<MeetingCard/>`. Filter/sort selection lives in `useLibraryStore` (Zustand).
- Card shows: title, relative date ("2 days ago"), duration badge (`1h 0m`), participant avatars (initials), topic chips, summary-status dot, action-item count.
- Empty state: Fireflies-style "No meetings yet — add your first" CTA → `/create`.

#### Phase 1.3 — Search & Filter
- Global search box in navbar: debounced 250ms → updates `q` in `useLibraryStore` → `useMeetings({q})` (TanStack Query) refetches.
- Filter drawer: date range, participant select, topic multi-select (Bonus integration).
- Sort dropdown: Recent (default) / Title A–Z / Longest.
- All filter state lives in context so URL search params stay in sync (`?q=roadmap&sort=title`) for shareability.

#### Phase 1.4 — Sort by Recency
- Default `sort=recent`; backend `ORDER BY occurred_at DESC`. Toggle persists to `localStorage`.

#### Phase 1.5 — Navbar (profile/settings placeholders)
- `<MainNav/>`: left = Fireflies wordmark + primary nav (Meetings, Coming Soon: Integrations, Team); center = global search; right = theme toggle, notifications bell (inert), avatar dropdown (Profile/Settings → `/settings`).
- Responsive: collapses to hamburger < md.

### 7.3 Key Components
`<LibraryPage/>`, `<MeetingCard/>`, `<SearchBar/>`, `<FilterDrawer/>`, `<SortControl/>`, `<MainNav/>`, `<EmptyState/>`.

### 7.4 Acceptance
List loads < 300ms with seed data; search/filter/sort update within one debounce cycle; navbar navigates to detail and settings; visually indistinguishable layout from Fireflies home.

---

## 8. Core Feature 2 — Meeting / Transcript Detail View

> *"Interactive transcript … media player with seek bar … clicking a transcript line seeks the player (and vice versa) … search within the transcript with highlighted matches."*

### 8.1 Objective
The signature Fireflies screen: a synchronized, interactive transcript beside a media player, with in-line search.

### 8.2 Phases

#### Phase 8.1 — Data & API
- **Endpoint** `GET /api/meetings/{id}` → meeting metadata + participants.
- **Endpoint** `GET /api/meetings/{id}/transcript?limit=&offset=` → paginated `transcript_lines` ordered by `seq` (windowed fetch pairs with client-side virtualization for long meetings).
- **Response 200:**
  ```json
  { "meeting": { "id":"m-1","title":"...","duration_sec":3600,"media_url":"/sample.mp3" },
    "lines": [{ "id":"l-1","seq":1,"speaker":"Alice","text":"…",
                "start_offset":12.4,"end_offset":15.1,"timestamp":"14:30:05" }],
    "total_count": 412, "has_more": true }
  ```

#### Phase 8.2 — Layout (two/three-pane)
- Route `/m/[id]`. Fireflies layout: left rail (nav), center = transcript panel, right = summary panel (Core 3). Collapsible panels.
- `<TranscriptPanel/>` uses `@tanstack/react-virtual` to render hundreds of lines without jank.

#### Phase 8.3 — Media Player with Seek Bar
- `<AudioPlayer/>` wraps HTML5 `<audio>`/`<video>` bound to `meeting.media_url` (sample file; assignment permits placeholder).
- Custom seek bar (Fireflies style), play/pause, speed (1x/1.5x/2x), skip ±15s, time readout.
- Player reads/writes `currentTime` through `usePlayerStore.seek(t)` / `currentTime` — the **single source of truth** enabling bidirectional sync.

#### Phase 8.4 — Bidirectional Click ↔ Seek (the core interaction)
- **Line → player:** clicking a line calls `seek(line.start_offset)`. The active line is tracked in context; clicking auto-scrolls it into view.
- **Player → line:** on `timeupdate`, context computes the active line = last line with `start_offset <= currentTime`; that line is highlighted + auto-scrolled (only when playing, to avoid fighting manual scroll).
- Implementation detail: binary-search the sorted `start_offset` array each `timeupdate` (throttled to 250ms) — O(log n), smooth for long meetings.
- This is exactly the purpose of the `start_offset`/`end_offset` columns — line timing is stored as recording-relative seconds so seeking is a direct index lookup.

#### Phase 8.5 — In-Transcript Search with Highlight
- Search box above transcript (debounced). Query hits backend `GET /api/meetings/{id}/transcript/search?q=` → FTS5 match → returns line ids + match positions.
- Frontend highlights matches (Fireflies yellow) and shows a "3 of 12 matches" navigator with up/down arrows that seek + scroll to each.
- Highlight via `<mark>` wrappers on matched substrings.

### 8.3 Key Components
`<MeetingDetailPage/>`, `<AudioPlayer/>`, `<SeekBar/>`, `<TranscriptPanel/>`, `<TranscriptLine/>`, `<TranscriptSearchBox/>`, `<MatchNavigator/>`.

### 8.4 Edge Cases
- Lines without `start_offset`: fall back to proportional offsets across `duration_sec`.
- No media: player shows "Sample audio" placeholder but seek simulation still works off a timer (so click-line still highlights).
- Very long meetings: paginated + virtualized; "load more" on scroll.

### 8.5 Acceptance
Clicking any line seeks the player; playing advances the active-line highlight and auto-scroll; seeking the bar updates the active line; in-transcript search highlights all matches and navigates them.

---

## 9. Core Feature 3 — AI Summary & Notes

> *"AI-generated summary, action items, key topics/outline/chapters. Summaries can be seeded, mocked, or LLM-generated."*

### 9.1 Objective
A structured, editable AI summary panel plus extracted action items and chapters/outline.

### 9.2 Phases

#### Phase 9.1 — Summary Data Model & Provider Adapter
- Summary stored in `summary_processes.result` as a JSON `SummaryResponse`:
  ```json
  { "meeting_name":"Q3 Planning",
    "people":          {"title":"People","blocks":[…]},
    "session_summary": {"title":"Session Summary","blocks":[…]},
    "action_items":    {"title":"Immediate Action Items","blocks":[…]},
    "key_decisions":   {"title":"Key Items & Decisions","blocks":[…]},
    "next_steps":      {"title":"Next Steps","blocks":[…]} }
  ```
  where `Block = { id, type:'bullet'|'text'|'heading1'|'heading2', content, color }`.
- **`SummaryProvider` port (strategic adapter, §4.2):**
  ```python
  class SummaryProvider(Protocol):
      def summarize(self, transcript: TranscriptText, *, logger: CustomLogger) -> SummaryResponse: ...
  ```
  Two adapters, both returning the **identical `SummaryResponse` type**:
  - `MockSummaryProvider` — returns canned, deterministic structured JSON. Default; zero config. (No LLM, no chunking.)
  - `LLMSummaryProvider` — chunks the transcript (size 5000, overlap 1000) and calls an LLM (OpenAI/Ollama/Anthropic/Groq/OpenRouter) with the `SummaryResponse` schema as the enforced output shape, then merges per-section blocks.
  The `GenerateSummaryService` depends only on the port; selection is by env/config at the composition root. **Because mock and real share one interface, the frontend, storage, and UI code are identical regardless of source** — the assignment's "seeded, mocked, or LLM-generated" collapses to one code path.

#### Phase 9.2 — Async Generation State Machine
- `POST /api/meetings/{id}/summary` → `GenerateSummaryService`:
  1. Upsert `summary_processes` row `status='pending'`.
  2. `BackgroundTasks.add_task(run_summary, meeting_id, logger)`.
  3. Return `202 { process_id, status:'pending' }`.
- `run_summary(meeting_id, logger)` (application service):
  1. `status='processing'`, `start_time=now`; emit `SUMMARY_STARTED`.
  2. Load transcript lines via repository; build `TranscriptText`.
  3. Call `provider.summarize(...)` (port) → `SummaryResponse`; `logger` records each adapter call's `time_taken`.
  4. Persist: action_items extracted into `action_items` table; chapters derived from topics/section headings into `chapters`; final JSON into `result`.
  5. `status='completed'`, `end_time=now`, `processing_time`, `chunk_count`, emit `SUMMARY_COMPLETED` — or `status='failed'`, `error=msg`, emit `SUMMARY_FAILED`.
- `GET /api/meetings/{id}/summary`: returns `202` while non-terminal, `200` + result when complete, `400` + error when failed. FE polls every 2s (TanStack Query `refetchInterval`).

#### Phase 9.3 — Summary Panel UI
- Right pane `<SummaryPanel/>` with tabs: **Summary | Action Items | Outline | Notes**.
- Summary tab renders the BlockNote editor (`<BlockNoteSummaryView/>`) loaded from `result`; user can edit inline → `PUT /api/meetings/{id}/summary` persists updated JSON.
- "Regenerate" button → re-runs Phase 9.2, snapshots prior result into `result_backup` before overwrite.

#### Phase 9.4 — Action Items Panel
- Renders `action_items` as a checklist with assignee/due chips; "complete" toggles `is_completed` (optimistic UI + `PATCH`).
- "Add action item" form (Core 4 CRUD). Items surfaced in library card count and (Bonus) export.

#### Phase 9.5 — Key Topics / Outline / Chapters
- `<ChaptersOutline/>`: list of `chapters` (title + start_offset); clicking seeks the player to that offset (reuses Feature 2 seek bus). Acts as the Fireflies "outline."
- Topics chips rendered from `meeting_topics`; shared with Feature 1 filter and the Bonus tag system.

#### Phase 9.6 — Notes
- `<MeetingNotes/>` BlockNote editor bound to `meeting_notes.notes_json`; autosaves (debounced) via `PUT /api/meetings/{id}/notes`.

### 9.3 Key Components
`<SummaryPanel/>`, `<BlockNoteSummaryView/>`, `<SummaryStatusBanner/>`, `<ActionItemsList/>`, `<ChaptersOutline/>`, `<MeetingNotes/>`.

### 9.4 Acceptance
Summary generates (mock by default) and reaches `completed`; action items are completable/editable; chapters seek the player; summary edits persist and reload; a failure shows a recoverable error banner.

---

## 10. Core Feature 4 — Meeting Management (CRUD)

> *"Create, edit metadata, delete; add/edit/complete action items; everything persists."*

### 10.1 Objective
Full CRUD over meetings, transcripts, summaries, and action items.

### 10.2 Phases

#### Phase 10.1 — Create Meeting (upload / paste / form)
- Route `/create` → `<CreateMeetingModal/>`/page with three entry modes:
  1. **Paste transcript** — textarea; `TranscriptImportParser` splits into lines.
  2. **Upload file** — `.txt`, `.vtt`, `.json` accepted (assignment explicitly allows these). Parsers:
     - `.vtt`: regex over `WEBVTT` cue blocks → lines with `start_offset`/`end_offset` from cue timestamps.
     - `.json`: accept `[{speaker,text,start,end}]` or a full transcript object.
     - `.txt`: split on newlines; assign sequential proportional offsets.
  3. **Form** — title, date, duration, participants, optional media URL.
- `POST /api/meetings` (transactional): insert meeting + participants + parsed `transcript_lines`. Return `201 { id }`.
- Post-create: offer "Generate summary now" → triggers Feature 9.2.

#### Phase 10.2 — Read (covered by Features 1 & 2)
Library list + detail view constitute Read. Pagination and search are first-class.

#### Phase 10.3 — Edit Meeting Metadata
- Inline-editable title on detail header (Fireflies pattern).
- `<EditMeetingModal/>`: title, occurred_at, duration, participants (add/remove).
- `PATCH /api/meetings/{id}` → repository updates + bumps `updated_at` (transactional with `transcript_chunks`-style denormalized title if needed).

#### Phase 10.4 — Delete Meeting
- `<DeleteConfirmModal/>` (Radix dialog) → `DELETE /api/meetings/{id}`.
- Transactional cascade delete: removes transcript_lines, summary_processes, action_items, chapters, topic links, notes, highlights, comments, chat, then the meeting itself — all within one transaction (see §4.2).
- Optimistic removal from library list + toast "Meeting deleted" (with undo disabled — acceptable scope).

#### Phase 10.5 — Action Item CRUD
- **Add:** `POST /api/meetings/{id}/action-items`.
- **Edit:** `PATCH /api/action-items/{id}` (text, assignee, due_date).
- **Complete:** `PATCH /api/action-items/{id} { is_completed:true }`.
- **Delete:** `DELETE /api/action-items/{id}`.
- All update `updated_at`; FE uses optimistic updates + TanStack Query `invalidateQueries` for revalidation.

#### Phase 10.6 — Persistence guarantee
All writes go through transactions; reads always reflect committed state (WAL). No data is lost on refresh — the explicit assignment requirement "must persist."

### 10.3 Key Components
`<CreateMeetingModal/>`, `<UploadDropzone/>`, `<EditMeetingModal/>`, `<DeleteConfirmModal/>`, `<ActionItemRow/>`, `<AddActionItemForm/>`.

### 10.4 Acceptance
A meeting can be created from each of the three inputs, edited, and deleted with all related data removed; action items can be added, edited, completed, and deleted; everything survives a full page reload.

---

## 11. Core Feature 5 — Fireflies Experience (UI/UX System)

> *"Resemble the Fireflies experience … navigation/layout, panels, forms/modals/search/filters, toasts, settings placeholders."*

### 11.1 Objective
A cohesive design system so the product *feels* like Fireflies, not a generic notes app.

### 11.2 Phases

#### Phase 11.1 — Visual Design System
- Study Fireflies: deep navy/indigo chrome (`#0E1117`-family sidebar), light content canvas, accent yellow `#F6C344` + teal, generous spacing, rounded cards, subtle shadows.
- Tokens in `tailwind.config.ts`: `fireflies.navy`, `fireflies.yellow`, semantic `background/foreground/muted/border/accent` for dark-mode parity.
- Typography: Inter/system stack; transcript uses monospace-ish for timestamps.

#### Phase 11.2 — App Shell & Navigation
- Persistent left `<Sidebar/>` (collapsible) + `<MainNav/>` top bar (Feature 1).
- Routes: `/` library, `/m/[id]` detail, `/create`, `/settings`, plus `/search` (Bonus global search) and `/m/[id]/chat` (Bonus).
- Active-route highlighting; keyboard nav (⌘K command palette — Bonus-friendly).

#### Phase 11.3 — Panels & Layout
- Detail page three-pane (nav | transcript | summary) with draggable/collapsible dividers — matches Fireflies.
- Consistent panel headers, tabs, scroll areas (Radix ScrollArea).

#### Phase 11.4 — Forms, Modals, Search, Filters
- Shared form primitives (`<FormInput/>`, `<FormSelect/>`, `<FormSwitch/>`) — small composable wrappers so every form stays visually and behaviorally consistent.
- All dialogs via Radix `<Dialog/>`/`<AlertDialog/>` (create, edit, delete confirm).
- Search and filter components reused between library (Feature 1) and global search (Bonus).

#### Phase 11.5 — Toasts & Notifications
- Centralized `<Toaster/>` + `useToast()` (Section 6.5) used by every mutation.

#### Phase 11.6 — Settings Placeholders
- `/settings` with tabs Profile, Notifications, Integrations, Team, Playback — bodies render "Coming Soon" placeholders (per assignment). Theme toggle (Bonus dark mode) is functional.

### 11.3 Acceptance
Side-by-side with Fireflies, the layout, spacing, color, and interaction patterns (modals, toasts, panels) read as the same product family.

---

## 12. Bonus Features — Technical Specifications

> Each is specced so it can be built directly; each is additive (independent tables/components) and degrades gracefully if disabled.

### 12.1 Comments / Highlights / Soundbites on Transcript Segments

**Goal:** annotate and bookmark transcript lines.

**Data:** `highlights` (line_id, color, note) and `comments` (line_id, author, body) — already in schema (§5.2).

**API:**
- `POST/GET/DELETE /api/meetings/{id}/highlights`
- `POST/GET/DELETE /api/meetings/{id}/comments`

**UI:**
- Selecting transcript text opens a radial/inline menu: Highlight (color), Comment, **Soundbite** (creates a highlight tagged `soundbite` with the line's `start_offset` so it can be replayed via the player seek bus).
- Highlighted lines render a colored left border; comments show a count badge that expands a thread popover anchored to the line.

**Phase plan:** (1) highlight storage + color render; (2) comment threads; (3) soundbite = highlight + "play from here."

### 12.2 Export Transcript or Summary (PDF / Markdown / TXT)

**Goal:** one-click export of a meeting's content.

**Backend service:** `ExportService` in `backend/app/services/export.py`.
- **Markdown/TXT:** render Jinja2 templates from transcript lines + summary blocks + action items + chapters.
- **PDF:** `weasyprint` (HTML→PDF) or `reportlab`; Fireflies-style header (title, date, participants), then Summary, Action Items, Chapters, full Transcript.

**API:**
- `GET /api/meetings/{id}/export?format=pdf|md|txt&content=all|transcript|summary` → streams file with `Content-Disposition: attachment`.

**UI:** "Export" dropdown in detail header; on success, toast with download; on failure, error toast. (Reuse for action-items-only export later.)

**Phase plan:** (1) Markdown/TXT; (2) PDF; (3) content-scope toggle.

### 12.3 Global Search Across All Meetings

**Goal:** search every meeting's transcript + summaries + action items from the navbar.

**Data:** `transcript_fts` (FTS5) covers transcripts; add a second FTS over meeting titles/summaries/action_items text, or a unified `search_index` FTS5 table populated by triggers.

**API:** `GET /api/search?q=&type=all|transcript|summary|action_item&limit=` → ranked hits:
```json
{ "items": [{ "meeting_id":"m-1","title":"Q3 Planning",
              "type":"transcript","line_id":"l-42",
              "snippet":"…roadmap for <mark>Q3</mark>…","offset":1230.0 }],
  "total": 27 }
```
`snippet` produced by FTS5 `snippet()` with `<mark>` delimiters.

**UI:** `/search` results page grouped by meeting, each hit seeks the detail player on click (reuses Feature 2 seek bus). Reuses Feature 1's `<SearchBar/>` with a "global" mode.

**Phase plan:** (1) transcript FTS search; (2) unified index incl. summaries/actions; (3) grouped UI + click-to-seek.

### 12.4 Tags / Topics and Filtering by Them

**Goal:** tag meetings, filter the library by tag.

**Data:** `topics` + `meeting_topics` (M:N) already in schema.

**API:**
- `POST/DELETE /api/meetings/{id}/topics { name }`
- `GET /api/topics` (with meeting counts)
- Feature 1 `GET /api/meetings?topic=` already supports filtering.

**UI:** topic chips on cards; multi-select filter in Feature 1's `<FilterDrawer/>`; tag editor on detail page (add/remove). Topics double as the Feature 3 "key topics."

**Phase plan:** (1) assign/list topics; (2) library filter; (3) auto-suggest from summary extraction.

### 12.5 LLM-Powered "Ask a Question About This Meeting" Chat

**Goal:** a per-meeting Q&A grounded in the transcript.

**Data:** `chat_threads` + `chat_messages` (schema §5.2).

**Backend:** `ChatService` (application service) builds a retrieval context = full transcript (chunked if long) + summary, then calls the **`ChatProvider` adapter** — `MockChatAdapter` returns canned answers (zero-config), `LLMChatAdapter` calls an LLM. Same port pattern as `SummaryProvider` (§4.2, §9.1); mock and real share one response interface. Each user message is stored; the assistant reply is streamed (SSE) and persisted.

**API:**
- `POST /api/meetings/{id}/chat` (create thread) → `{ thread_id }`
- `POST /api/chat/{thread_id}/messages` (SSE stream of assistant tokens) then persisted
- `GET /api/chat/{thread_id}/messages` (history)

**UI:** `/m/[id]/chat` drawer/panel; messages list + composer; citations link back to source `transcript_lines` (clicking seeks the player — reuses Feature 2 bus).

**Phase plan:** (1) thread + non-streaming Q&A with mock provider; (2) streaming + citations; (3) "suggested questions" from summary action items.

### 12.6 Dark Mode

**Goal:** system-wide dark theme.

**Implementation:** `darkMode:'class'` in Tailwind; `useSessionStore` reads `localStorage`/`prefers-color-scheme`, toggles `<html class="dark">`; toggle in navbar + settings. Because all components use semantic tokens (Core 5.1), dark mode works automatically.

**Phase plan:** tokens (done in Core 5.1) + toggle + persistence (single small phase).

---

## 13. Phased Delivery Roadmap

Mapped to the assignment's ~24-hour estimate. Each phase is independently shippable.

| Phase | Scope (features) | Key deliverables | Status gate |
|---|---|---|---|
| **P0 — Foundation** | Stack, schema, seed, app shell, design tokens | Repo skeleton (FE/BE), migrations, seed (5 meetings), MainNav/Sidebar, theming | App boots with seeded library |
| **P1 — Core 1** | Meetings Library | `GET /api/meetings`, library UI, search/filter/sort | Library browsable + searchable |
| **P2 — Core 2** | Transcript Detail + Player | transcript API, player, click↔seek, in-transcript search | Interactive sync works |
| **P3 — Core 3** | Summary & Notes | summary orchestrator (mock+LLM), summary panel, action items, chapters, notes | Summary generates & editable |
| **P4 — Core 4** | CRUD | create (paste/upload/form), edit, delete, action-item CRUD | Full lifecycle persists |
| **P5 — Core 5** | Fireflies UX polish | design-system pass, modals, toasts, settings placeholders | Pixel-close to Fireflies |
| **P6 — Bonus** | Pick any subset | highlights/comments, export, global search, tags, chat, dark mode | Each additive & behind its own route |
| **P7 — Deploy & Docs** | README + hosting | Vercel + Render deploy, README (setup/arch/schema/API) | Public links work |

---

## Appendix A — Consolidated API Surface

```
# Meetings (Core 1, 4)
GET    /api/meetings                      # list w/ filters: q,participant,topic,from,to,sort,limit,offset
POST   /api/meetings                      # create (paste/upload/form) → 201 {id}
GET    /api/meetings/{id}                 # metadata + participants
PATCH  /api/meetings/{id}                 # edit metadata
DELETE /api/meetings/{id}                 # cascade delete

# Transcript (Core 2)
GET    /api/meetings/{id}/transcript      # paginated lines
GET    /api/meetings/{id}/transcript/search?q=   # FTS matches

# Summary & notes (Core 3)
POST   /api/meetings/{id}/summary         # kick off async → 202
GET    /api/meetings/{id}/summary         # status + result (202/200/400)
PUT    /api/meetings/{id}/summary         # persist edited summary JSON
PUT    /api/meetings/{id}/notes           # BlockNote notes

# Action items (Core 3, 4)
GET    /api/meetings/{id}/action-items
POST   /api/meetings/{id}/action-items
PATCH  /api/action-items/{id}
DELETE /api/action-items/{id}

# Topics / chapters (Core 3 + Bonus tags)
GET    /api/meetings/{id}/chapters
POST   /api/meetings/{id}/topics          # { name }
DELETE /api/meetings/{id}/topics/{topicId}
GET    /api/topics

# Bonus
GET    /api/search?q=&type=               # global search
GET    /api/meetings/{id}/export?format=  # pdf|md|txt
POST/GET/DELETE /api/meetings/{id}/highlights
POST/GET/DELETE /api/meetings/{id}/comments
POST   /api/meetings/{id}/chat            # create thread
POST   /api/chat/{threadId}/messages      # SSE stream
GET    /api/chat/{threadId}/messages      # history
```

---

## Appendix B — Project File Tree

```
fireflies-clone/
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx             # QueryClientProvider + Zustand providers + <Toaster/>
│   │   │   ├── page.tsx               # Core 1: library
│   │   │   ├── m/[id]/page.tsx        # Core 2/3: detail
│   │   │   ├── create/page.tsx        # Core 4: create
│   │   │   ├── settings/page.tsx      # Core 5: settings placeholders
│   │   │   ├── search/page.tsx        # Bonus: global search
│   │   │   └── m/[id]/chat/page.tsx   # Bonus: ask-LLM chat
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/Radix primitives
│   │   │   ├── library/               # Core 1: MeetingCard, SearchBar, FilterDrawer…
│   │   │   ├── transcript/            # Core 2: AudioPlayer, TranscriptPanel…
│   │   │   ├── summary/               # Core 3: SummaryPanel, ActionItems, Chapters…
│   │   │   ├── meetings/              # Core 4: Create/Edit/Delete modals
│   │   │   ├── nav/                   # Core 5: Sidebar, MainNav
│   │   │   ├── bonus/                 # highlights, export, chat
│   │   │   └── molecules/form-components/
│   │   ├── stores/                    # Zustand: sessionStore, libraryStore, playerStore, summaryStore
│   │   ├── api/                       # apiClient (axios) + typed service modules + TanStack Query hooks
│   │   │   ├── client.ts              # axios instance + interceptors (§6.8)
│   │   │   ├── meetingsApi.ts
│   │   │   ├── summaryApi.ts
│   │   │   └── queries/               # useMeetings, useMeeting, useSummary, …
│   │   └── types/                     # TS interfaces mirroring backend schemas (single source shared)
│   ├── tailwind.config.ts             # Fireflies design tokens
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS allow-list, router wiring, composition root
│   │   ├── routers/                   # HTTP layer (thin): meetings, transcript, summary, actions, search, bonus
│   │   ├── services/                  # Application services (use cases) — Tactical DDD
│   │   │   ├── create_meeting.py
│   │   │   ├── delete_meeting.py
│   │   │   ├── generate_summary.py    # GenerateSummaryService (state machine)
│   │   │   ├── transcript_import.py   # .txt/.vtt/.json parsers
│   │   │   └── export.py              # md/txt/pdf generators
│   │   ├── adapters/                  # Strategic Adapter pattern — ports + impls
│   │   │   ├── ports.py               # SummaryProvider, ChatProvider, UserProvider (Protocols)
│   │   │   ├── summary/mock.py        # MockSummaryProvider
│   │   │   ├── summary/llm.py         # LLM adapter (OpenAI/Ollama/...)
│   │   │   ├── chat/mock.py · chat/llm.py
│   │   │   └── user/static.py         # StaticUserAdapter (default user)
│   │   ├── repositories/              # Anemic persistence: meeting.py, transcript.py, summary.py, action_item.py, topic.py
│   │   ├── models/                    # Anemic entities: Meeting, TranscriptLine, ActionItem, …
│   │   ├── logging/                   # CustomLogger (pino-python), Events/EventTypes/Messages, Record, middleware
│   │   │   ├── logger.py              # CustomLogger (info/error/warning/debug)
│   │   │   ├── events.py              # Events, EventTypes, Messages vocabularies
│   │   │   └── middleware.py          # per-request logger w/ request_id/user/route
│   │   ├── schemas.py                 # Pydantic request/response models (SummaryResponse etc.)
│   │   ├── db.py                      # aiosqlite pool, PRAGMA foreign_keys/WAL
│   │   └── errors.py                  # AppError hierarchy + handlers
│   ├── seed.py                        # manual dev seed script (NOT wired to runtime) — python -m backend.seed
│   ├── migrations/
│   │   └── 0001_initial.sql …         # versioned, additive
│   └── requirements.txt
│
├── README.md                          # setup, architecture, schema, API, assumptions
└── HLD_AND_TECH_SPECS.md              # this document
```

> **Type sharing.** `frontend/src/types` and `backend/app/schemas.py` describe the same shapes (e.g. `SummaryResponse`, `Block`, `MeetingDTO`). In practice these are kept in sync by review; optionally a codegen step can emit the TS interfaces from the Pydantic models so mock and real, FE and BE, all share one contract.

---

*End of document. Every phase of every in-scope feature (Core 1–5 and the six Bonus features) carries an objective, phase breakdown, data model, API, components, and acceptance criteria — ready to drive implementation.*
