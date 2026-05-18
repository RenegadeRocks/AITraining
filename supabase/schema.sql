-- AI Training Companion — database schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_key text unique not null,
  title text not null,
  status text not null default 'live' check (status in ('live', 'ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists attendees_session_idx on attendees(session_id);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  attendee_name text not null,
  body text not null,
  ai_answer text,
  status text not null default 'pending'
    check (status in ('pending', 'answered', 'resolved', 'escalated', 'replied')),
  host_reply text,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  resolved_at timestamptz,
  escalated_at timestamptz,
  replied_at timestamptz
);

create index if not exists questions_session_idx on questions(session_id, created_at desc);
create index if not exists questions_attendee_idx on questions(attendee_id, created_at desc);
create index if not exists questions_status_idx on questions(session_id, status);

-- Realtime: the host dashboard subscribes to changes on questions for their session;
-- attendees subscribe to changes on their own question rows (filtered by id).
alter publication supabase_realtime add table questions;

-- Row-level security: the access model is "knowing the code grants read".
-- All writes go through the server (service role), which enforces scoping.
alter table sessions enable row level security;
alter table attendees enable row level security;
alter table questions enable row level security;

-- Permissive read for anon (clients only ever query with explicit id/session filters
-- and only know IDs they were given). Writes are blocked from anon.
drop policy if exists "anon read sessions" on sessions;
create policy "anon read sessions" on sessions for select using (true);

drop policy if exists "anon read attendees" on attendees;
create policy "anon read attendees" on attendees for select using (true);

drop policy if exists "anon read questions" on questions;
create policy "anon read questions" on questions for select using (true);
