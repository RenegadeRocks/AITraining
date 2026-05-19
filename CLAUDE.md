# Ask the Room — AI Training Companion

## What this is

A live web app for in-person AI training sessions. Attendees join via a
4-letter code on their phone, ask questions, get an instant AI answer, and
either accept it or escalate to the instructor. The instructor sees the
escalated queue live on a private dashboard and replies — replies stream
back to the attendee's phone in real time.

The user (project owner) is **non-technical**. They will be running an
advanced AI training for their company's core group and using this app
during the session itself. Write explanations and prompts accordingly:
plain language, step-by-step setup help, no jargon dumps. They will
push back via chat if they want code changes.

## Product decisions already made

These were locked in via `AskUserQuestion` during the initial conversation
— don't relitigate without checking with the user first:

- **Visibility**: each attendee sees only their own questions (not a
  shared feed). Their question IDs are stored in `localStorage` keyed by
  `atr:qids:<attendeeId>`.
- **AI grounding**: generic Claude for v1 (no doc upload / RAG). Session
  title is passed as light context.
- **No logins**. Attendees enter a first name once, stored in
  `localStorage` keyed by `atr:name:<sessionId>`. Their attendee row id
  is stored at `atr:attendee:<sessionId>`.
- **Host auth = secret URL**. Creating a session returns a `host_key`
  (24 random bytes hex). The host dashboard lives at `/host/[hostKey]`
  and must be bookmarked. The reply endpoint validates this key via the
  `x-host-key` header.
- **Session codes**: 4 letters, alphabet excludes I and O for readability
  (`src/lib/codes.ts`).
- **Mobile-first**, "wow" aesthetic. Tailwind, glass-morphism cards,
  Inter font, smooth slide-in animations, safe-area handling.

## Stack

- **Next.js 14 App Router** (TypeScript, Node runtime for API routes)
- **Supabase** — Postgres + Realtime. Schema lives in `supabase/schema.sql`
  and must be run once in the project's SQL editor.
- **Anthropic Claude** via `@anthropic-ai/sdk`. Model: `claude-sonnet-4-6`.
  System prompt and call live in `src/lib/anthropic.ts`.
- **Tailwind CSS** with a custom palette (`ink`, `accent`) and a few
  named animations defined in `tailwind.config.ts`.
- **Netlify** for hosting (`netlify.toml` configured for the Next.js
  plugin).

## Required env vars (see `.env.example`)

```
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The browser uses `NEXT_PUBLIC_*` keys only (for Supabase realtime
subscriptions). All writes go through `src/app/api/*` routes that use
the service role key on the server.

## Architecture

### Data model (`supabase/schema.sql`)

- `sessions` — `code` (join code), `host_key` (secret), `title`, `status`
  (`live` | `ended`).
- `attendees` — `session_id`, `name`. One per (session, browser).
- `questions` — `session_id`, `attendee_id`, `attendee_name` (denormalized
  for fast host queries), `body`, `ai_answer`, `host_reply`, `status`
  (`pending` | `answered` | `resolved` | `escalated` | `replied`), plus
  timestamps per state.

RLS is enabled. Anon role has SELECT-only on all tables (the access model
is "knowing the code grants read"). All INSERT/UPDATE happen server-side
via the service role.

Realtime publication includes the `questions` table. Host subscribes
with `filter: session_id=eq.{id}`; attendee subscribes with
`filter: attendee_id=eq.{id}`.

### Routes

```
src/app/
  page.tsx                          # landing: enter code
  host/page.tsx                     # create session form
  host/[hostKey]/page.tsx           # host dashboard (SSR initial load)
  s/[code]/page.tsx                 # attendee room (SSR session lookup)
  api/
    sessions/route.ts               # POST: create session
    sessions/by-code/route.ts       # GET ?code=: lookup for join
    attendees/route.ts              # POST: register attendee
    questions/route.ts              # POST: ask question; calls Claude
    questions/[id]/resolve/route.ts # POST: mark resolved
    questions/[id]/escalate/route.ts# POST: escalate to host
    questions/[id]/reply/route.ts   # POST: host reply (x-host-key auth)
```

### Components

```
src/components/
  JoinForm.tsx              # 4-letter code entry on landing
  CreateSessionForm.tsx     # title -> POST /api/sessions
  HostDashboard.tsx         # realtime feed, filter chips, share panel
  QuestionCard.tsx          # one card in the host feed
  AttendeeRoom.tsx          # name prompt, list, composer (forwardRef)
  AttendeeQuestion.tsx      # one attendee question with state UI
```

### Question lifecycle

1. Attendee POSTs `/api/questions` → row inserted with `status='pending'`.
2. Server calls Claude inline, then UPDATEs the row with `ai_answer`
   and `status='answered'`. (Inline, not background — keeps it simple.
   Route has `maxDuration = 30`.)
3. Attendee taps either **resolve** (status → `resolved`) or **escalate**
   (status → `escalated`).
4. Host sees escalated rows in the "For you" filter, types a reply.
5. POST `/api/questions/[id]/reply` with `x-host-key` header → row gets
   `host_reply` and `status='replied'`.
6. Attendee's realtime subscription fires, reply appears on their phone.

## Setup the user still needs to do (one-time)

1. Anthropic API key from console.anthropic.com.
2. Supabase project at supabase.com — then run `supabase/schema.sql`
   in the SQL editor.
3. Deploy on Netlify, paste the 4 env vars into Site settings.

The README has the full walkthrough.

## Known gaps / candidates for next iteration

These were intentionally deferred from v1. Don't add unprompted; surface
as suggestions if the user wants to iterate:

- **No "End session" button** on the host dashboard. Sessions stay
  `live` forever. Schema already has `status='ended'` and `ended_at`.
- **No CSV/export** of session questions for review afterwards.
- **No RAG / doc upload**. AI uses generic Claude only.
- **No "top questions wall"** view to project behind the instructor.
- **No rate limiting** on `/api/questions` — relies on session being
  short-lived and friendly audience.
- **AI call is inline in the POST handler.** If Claude is slow, the
  attendee waits. Could be moved to a background job + realtime push.
- **Reply notifications** are realtime DB updates only — no browser push
  notifications, so an attendee with the tab backgrounded won't be
  pinged. Could add `Notification` API + service worker.

## Dev workflow

```bash
npm install
cp .env.example .env.local
# fill in the four env vars
npm run dev     # next dev on :3000
npm run typecheck
npm run build   # always run before pushing — Netlify will too
```

The branch for active development is `claude/ai-training-companion-Ey6b6`.
Push there unless the user says otherwise.

## House style for this codebase

- No comments unless explaining a non-obvious WHY (a tricky invariant,
  a subtle ordering requirement, etc). The code is short — names carry
  meaning.
- Tailwind utilities + the `card` / `btn-*` / `input` / `label` / `chip`
  component classes in `globals.css`. Don't introduce a UI library.
- API routes return `{ ... }` JSON; errors return `{ error: string }`
  with appropriate status codes. Keep it boring.
- Server-side Supabase access goes through `supabaseAdmin()` in
  `src/lib/supabase-server.ts`. Browser-side through `supabaseBrowser()`
  in `src/lib/supabase-browser.ts`. Don't mix.
