Implementation Plan: Media Player, LLM Config, Chapters, Notes, Notifications
Overview
Nine interconnected changes across the Next.js frontend and FastAPI backend. I'll work backend-config → adapters first (since several frontend pieces depend on provider status), then the player, then summary/notes/chapters UI, then notifications.

1. Unified Media Player (frontend)
Goal: One React component + interface that serves local video files AND YouTube links with a consistent control bar (no raw YouTube iframe).

Add dependency: react-player to frontend/package.json (wraps HTML5 <video>/<audio> and YouTube behind one API — satisfies "consistent UI throughout"). Run npm install react-player.
New shared interface in frontend/src/types/index.ts:

ts
export type MediaSourceKind = "file" | "youtube" | "audio";
export interface MediaSource {
  kind: MediaSourceKind;
  url: string;          // direct file/object URL, or YouTube watch/embed URL
  label?: string;
}
New helper frontend/src/lib/media.ts — parseMediaUrl(raw: string|null, fileName?: string): MediaSource | null:
Detects YouTube via regex (youtu.be/, youtube.com/watch, /embed/) → kind: "youtube", normalize to embeddable form.
Audio extensions (mp3/wav/m4a) → kind: "audio".
Otherwise → kind: "file" (incl. object URLs from local file picks).
Refactor frontend/src/components/transcript/AudioPlayer.tsx → MediaPlayer.tsx:
Props: { source: MediaSource | null; durationSec: number; onAddMedia?: () => void }.
Uses <ReactPlayer ref={playerRef} url={source.url} controls={false} ... /> with callbacks onProgress (→ setCurrentTime), onDuration (→ setDuration), onPlay/onPause/onEnded.
Keeps the exact same custom control bar (seek bar, play/pause, skip back/forward = seek ±15s only, speed, volume, time readout) wired to the existing playerStore so transcript-line clicks still seek.
For kind: "file"/"youtube": render a 16:9 video viewport above the controls; for "audio": render only the control bar (current behavior).
Seek-only buttons: skip(delta) already calls handleSeek → no navigation, confirms requirement.
When source is null: render an "Add media" placeholder (icon + button calling onAddMedia).
playerStore.ts: unchanged (currentTime/duration/isPlaying/seek already generic). Add a mediaObjectUrl field only if needed for session file — keep it local to the page instead.
Update frontend/src/app/m/[id]/page.tsx: replace <AudioPlayer mediaUrl=... durationSec=.../> with <MediaPlayer source={parseMediaUrl(meeting.media_url)} durationSec=... onAddMedia={...}/>. Local-file object URLs live in page state.
2. Add Media UI (video file or YouTube link)
Create page frontend/src/app/create/page.tsx form (CreateMeetingForm.tsx): replace the single "Media URL" <Input> with a media picker — two tabs/modes:
"YouTube link" → text input (persists as media_url).
"Video/audio file" → <input type="file" accept="video/*,audio/*"> → URL.createObjectURL for session playback (not persisted to backend, since no storage backend). Labelled clearly as session-only.
Meeting detail page (/m/[id]): when meeting.media_url is empty, the MediaPlayer placeholder's "Add media" opens a small AddMediaPopover (frontend/src/components/meetings/AddMediaPopover.tsx) offering the same two options. YouTube link → PATCH /api/meetings/:id (useUpdateMeeting) to persist media_url; file → object URL in page state.
EditMeetingModal: extend with the same media picker (YouTube link persists; file = session-only note).
3. Summary "awaiting" loader while polling (frontend)
Problem: In SummaryView.tsx, when summary.status === "pending"|"processing" and result is null, it wrongly falls into the !summary || status==="none" branch → shows "No summary generated yet" + Generate button instead of a loader.

Fix SummaryView.tsx: insert a branch before the "none" check:

tsx
if (summary && (summary.status === "pending" || summary.status === "processing")) {
  return <SummaryGeneratingState status={summary.status} />;
}
New SummaryGeneratingState (inline or in SummaryView.tsx): a centered, friendly loader — spinner + "Generating summary…" + rotating status copy ("Analyzing transcript…" → "Extracting action items…" → "Writing summary…") + a thin animated progress shimmer. This is the clear loader the user asked for while polling (useSummary already polls every 2s while status is pending/processing).
Keep SummaryStatusBanner as the slim top banner; the new state is the full-tab content.
4. LLM provider controllable via .env + Gemini adapter (backend)
Current: adapters hardwired to mock (generate_summary.py:14,47, chat_service.py:8,16); no config layer; backend/.env is empty.

Add python-dotenv to backend/requirements.txt.
New backend/app/config.py — central settings (loads .env via load_dotenv() at import):
LLM_PROVIDER ("mock" default; "gemini")
GEMINI_API_KEY, GEMINI_MODEL (default "gemini-2.0-flash"), LLM_TIMEOUT_SEC (default 60).
is_mock() helper, summary_provider_name().
New backend/app/adapters/factory.py:

python
def get_summary_provider() -> SummaryProvider   # mock | GeminiSummaryProvider (cached singleton)
def get_chat_provider() -> ChatProvider          # mock | GeminiChatAdapter
New backend/app/adapters/summary/gemini.py — GeminiSummaryProvider.summarize(transcript, logger) -> dict using httpx (sync) against: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent header x-goog-api-key; body {contents:[{role:"user",parts:[{text: PROMPT}]}], generationConfig:{temperature:0.3, responseMimeType:"application/json", maxOutputTokens:4096}}. Parse candidates[0].content.parts[0].text as JSON → validate the 5 sections (people/session_summary/action_items/key_decisions/next_steps) → return dict; fall back to mock-shaped result on error.
New backend/app/adapters/chat/gemini.py — GeminiChatAdapter.ask(question, transcript_text, summary_text, logger) -> str (plain-text response, no JSON mime).
Update generate_summary.py: drop MockSummaryProvider import; use get_summary_provider(); wrap the network call in await asyncio.to_thread(provider.summarize, ...) so it never blocks the event loop; record real provider name in update_status.
Update chat_service.py: use get_chat_provider(); wrap ask in asyncio.to_thread.
New endpoint GET /api/llm/status (small new router backend/app/routers/llm.py, registered in main.py) → { "provider": "mock"|"gemini", "is_mock": bool }. Frontend reads this for the mock warning.
Create backend/.env.example documenting all vars; leave backend/.env to user.
5. Mock-provider warning on "Ask AI" (frontend)
New frontend/src/api/llmApi.ts + frontend/src/api/queries/useLlmStatus.ts (useQuery(["llmStatus"]), staleTime: 5min).
In ChatPanel.tsx (rendered on /m/[id]/chat): when is_mock === true, render a prominent amber warning banner above the messages: "⚠️ Responses are mocked — these are canned answers, not real AI. Set LLM_PROVIDER=gemini and GEMINI_API_KEY in the backend .env to enable real answers." Hidden when a real provider is configured.
6. Notes UI → structured sections (frontend)
Current: single free-form BlockNote editor (MeetingNotes.tsx + BlockNoteEditor.tsx). User chose "Structured sections".

New frontend/src/components/summary/StructuredNotesEditor.tsx replacing MeetingNotes body — section cards:
Highlights · Decisions · Questions · Follow-ups (configurable list), each a card with a header (icon + title + count) and an editable bullet list (add/remove/edit items inline, Enter to add, × to delete).
Sticky toolbar: "Saved ✓" / "Saving…" indicator + last-saved time + word count.
Auto-save (debounced 1.5s) via useUpdateNotes; nicer empty states.
Storage: serialize sections to notes_json ({sections:[{id,title,items:[string]}]}) and a flattened markdown to notes_markdown. Backend PUT already accepts both fields — no backend change. Backward-compat: if notes_json parses to the new shape, hydrate; else migrate legacy markdown into a single "Notes" section.
Wire SummaryPanel to render StructuredNotesEditor in the Notes tab.
7. Chapters by timestamps + synchronous generation with summary (backend + frontend)
Current: chapters come from key_decisions blocks with start_offset = None (no timestamps).

New port backend/app/adapters/ports.py: add ChapterProvider protocol generate_chapters(transcript_lines: list[dict], *, logger) -> list[dict] ({title, start_offset, summary}).
New backend/app/adapters/chapters/mock.py — MockChapterProvider: splits transcript into ~4–6 segments by time using line start_offsets; titles from the first speaker/line of each segment; assigns real start_offset at each boundary.
New backend/app/adapters/chapters/gemini.py — prompts Gemini with timestamped transcript ([mm:ss] speaker: text) and responseMimeType: application/json → [{title, start_offset, summary}].
Factory additions in factory.py: get_chapter_provider().
New backend/app/services/generate_chapters.py — run_chapters(meeting_id, logger): load transcript lines (with offsets), call provider (via asyncio.to_thread), delete old chapters, insert new via chapters_repo.create_many.
chapters_repo: add delete_by_meeting(db, meeting_id).
Synchronous hook in summary flow: in run_summary (generate_summary.py), after the summary succeeds, call await run_chapters(meeting_id, logger) synchronously (removes the old key_decisions→chapter parsing at lines 63–77). This is the "separate API run synchronously to the summary API call."
New endpoint POST /api/meetings/{meeting_id}/chapters/generate in chapters.py router → calls run_chapters and returns the chapters (independent re-generation).
Frontend ChaptersOutline.tsx:
Timestamps now present → render mm:ss prominently per chapter (already partially there; polish styling).
Add a "Generate chapters" button when empty; show a "Generating chapters…" loader while summary.status is pending/processing (chapters are generated with the summary).
Invalidate ["chapters", meetingId] when the summary query flips to completed.
8. Notifications dropdown (frontend-only, localStorage, user-scoped)
Current: Bell button in MainNav.tsx:54-56 is non-functional. User: dropdown of most-recent notifications only — no dedicated route. Current user id = useSessionStore(s=>s.user).id ("user-default").

frontend/src/types/index.ts: add

ts
export interface AppNotification {
  id: string; user_id: string; type: string;
  title: string; message: string; meeting_id?: string;
  created_at: string; read: boolean;
}
New frontend/src/stores/notificationsStore.ts — Zustand + persist middleware (createJSONStorage(()=>localStorage)), key fireflies:notifications:${userId} (re-keyed when user changes). State: notifications, actions addNotification, markAllRead, markRead, clear, selector unreadCount. SSR-safe (skipHydration + guard).
New frontend/src/components/nav/NotificationsDropdown.tsx — Radix-free simple popover (absolute-positioned panel toggled by the Bell): header ("Notifications" + "Mark all read"), scrollable list of recent N (icon by type, title, message, relative time, unread dot), empty state, footer note. Unread count badge on the Bell.
Wire into MainNav.tsx: replace the inert Bell <button> with the dropdown trigger; show unread badge.
Event sources (push notifications into the store):
Summary completed: in useSummary/SummaryView, when status transitions processing→completed, addNotification({type:"summary", title:"Summary ready", message: meetingTitle, meeting_id}).
Meeting created: useCreateMeeting onSuccess → "Meeting imported".
Chapters ready / generation failed → corresponding notifications. (All client-side, persisted to localStorage scoped to the current user.)
9. Docs / config housekeeping
Update backend/.env.example (LLM vars) and frontend/.env docs if a NEXT_PUBLIC_* var is added (none required).
Update README "Configuration" section briefly to list the new env vars.
File change summary
Backend (new): app/config.py, app/adapters/factory.py, app/adapters/summary/gemini.py, app/adapters/chat/gemini.py, app/adapters/chapters/__init__.py, app/adapters/chapters/mock.py, app/adapters/chapters/gemini.py, app/services/generate_chapters.py, app/routers/llm.py, backend/.env.example. Backend (edit): requirements.txt, adapters/ports.py, services/generate_summary.py, services/chat_service.py, repositories/chapters.py, routers/chapters.py, main.py. Frontend (new): lib/media.ts, components/transcript/MediaPlayer.tsx, components/meetings/AddMediaPopover.tsx, components/summary/StructuredNotesEditor.tsx, components/nav/NotificationsDropdown.tsx, stores/notificationsStore.ts, api/llmApi.ts, api/queries/useLlmStatus.ts, api/queries/useChapters (generate mutation). Frontend (edit): package.json (+react-player), types/index.ts, app/m/[id]/page.tsx, components/meetings/CreateMeetingForm.tsx, components/meetings/EditMeetingModal.tsx, components/summary/SummaryPanel.tsx, components/summary/SummaryView.tsx, components/summary/ChaptersOutline.tsx, components/bonus/ChatPanel.tsx, components/nav/MainNav.tsx, api/queries/useSummary.ts (notification + chapter invalidation).

Execution order
Backend config + factory + Gemini adapters + /api/llm/status (foundation).
Backend chapters provider/service/endpoint + synchronous hook in run_summary.
Frontend install react-player → MediaPlayer + media.ts + Add-media UI.
Frontend summary generating-state loader.
Frontend Ask-AI mock warning (useLlmStatus).
Frontend structured notes editor.
Frontend chapters-outline timestamp polish + generate button.
Frontend notifications store + dropdown + event wiring.
.env.example + README touch-ups; verify build (npm run build, backend import smoke).
Notes / limitations
Local video files use browser object URLs → session-scoped (won't survive full reload) since you declined a file-storage backend. YouTube links persist to media_url. I'll label this clearly in the UI.
All real LLM calls run via asyncio.to_thread so they never block the async event loop; mock stays instant and zero-config when no provider/key is set.