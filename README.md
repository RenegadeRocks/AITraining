# Ask the Room — AI Training Companion

A live web app for AI training sessions. Attendees scan a code, ask a question,
get an instant AI answer, and either accept it or escalate it to the instructor.
The instructor sees the escalated queue in real time on a private dashboard.

## How it works

1. **Instructor** opens `/host`, types a session title, gets a 4-letter code
   (e.g. `KITE`) and a private dashboard URL — bookmark it.
2. **Attendees** open the app, enter the code, type their first name once.
3. They ask questions; the AI answers in seconds.
4. They tap **"Got it — thanks"** (resolved) or **"I need a human"** (escalated).
5. Escalated questions stream into the instructor's dashboard live. The
   instructor replies; the attendee sees the reply on their phone instantly.

Attendees only see their own questions and answers. The instructor sees
everything.

## Setup (one-time, ~10 minutes)

You need three things: an Anthropic API key, a Supabase project, and a
Netlify site. All have free tiers.

### 1. Anthropic API key

1. Sign in at https://console.anthropic.com
2. Settings → API Keys → Create Key
3. Copy the key — you'll paste it as `ANTHROPIC_API_KEY` later.

### 2. Supabase project

1. Sign in at https://supabase.com
2. New Project → pick any name and region close to you.
3. Once the project is ready, go to **SQL Editor → New query**, paste the
   contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
4. In **Project Settings → API**, copy three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
     (keep this secret — never paste it into client code or commit it)

### 3. Deploy on Netlify

1. Push this repo to GitHub.
2. On https://app.netlify.com → **Add new site → Import an existing project**.
3. Pick the repo. Build settings auto-detect from `netlify.toml`.
4. Under **Site settings → Environment variables**, add the four values
   from steps 1 and 2.
5. Deploy. The site will be at `https://<your-site>.netlify.app`.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the four values
npm run dev
```

Then open http://localhost:3000.

## Stack

- Next.js 14 (App Router) on Netlify
- Supabase (Postgres + Realtime) for storage and live updates
- Anthropic Claude for AI answers
- Tailwind CSS for styling

## Project structure

```
src/
  app/
    page.tsx              # landing: enter session code
    host/                 # create + dashboard
    s/[code]/             # attendee room
    api/                  # serverless routes
  components/             # UI
  lib/                    # supabase + anthropic clients
supabase/
  schema.sql              # run once in Supabase SQL editor
```
