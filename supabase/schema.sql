-- Studyin Supabase schema (attempts, sessions, analytics_snapshots, evidence_chunks)
-- Safe to run in the SQL editor. Requires pgcrypto + pgvector extensions.

-- Enable extension if not present
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Attempts table
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  schema_version text not null,
  app_version text not null,
  session_id text not null,
  user_id text not null,
  item_id text not null,
  lo_ids text[] not null,
  ts_start bigint not null,
  ts_submit bigint not null,
  duration_ms integer not null,
  mode text not null check (mode in ('learn','exam','drill','spotter')),
  choice char(1) not null check (choice in ('A','B','C','D','E')),
  correct boolean not null,
  confidence smallint,
  opened_evidence boolean not null default false,
  flagged boolean,
  rationale_opened boolean,
  keyboard_only boolean,
  device_class text,
  net_state text,
  paused_ms integer,
  hint_used boolean,
  constraint confidence_range check (confidence is null or confidence between 1 and 3),
  constraint device_class_range check (device_class is null or device_class in ('mobile','tablet','desktop')),
  constraint net_state_range check (net_state is null or net_state in ('online','offline'))
);

create index if not exists attempts_item_id_idx on public.attempts (item_id);
create index if not exists attempts_user_id_idx on public.attempts (user_id);
create index if not exists attempts_ts_submit_idx on public.attempts (ts_submit);
create index if not exists attempts_lo_ids_gin on public.attempts using gin (lo_ids);

-- Sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  schema_version text not null,
  app_version text not null,
  session_id text not null,
  user_id text not null,
  mode text not null check (mode in ('learn','exam','drill','spotter')),
  blueprint_id text,
  start_ts bigint not null,
  end_ts bigint,
  completed boolean,
  mastery_by_lo jsonb
);

create unique index if not exists sessions_session_id_unique on public.sessions (session_id);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

-- Analytics snapshots table
create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  generated_at timestamptz not null,
  schema_version text not null,
  payload jsonb not null
);

create index if not exists analytics_snapshots_generated_idx on public.analytics_snapshots (generated_at desc);

-- Evidence chunks (Temporal RAG)
create table if not exists public.evidence_chunks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_id text not null,
  lo_ids text[] not null,
  source_file text not null,
  page integer,
  version text,
  ts bigint,
  text text not null,
  embedding vector(64) not null
);

create index if not exists evidence_chunks_item_idx on public.evidence_chunks (item_id);
create index if not exists evidence_chunks_ts_idx on public.evidence_chunks (ts desc);
create index if not exists evidence_chunks_lo_ids_gin on public.evidence_chunks using gin (lo_ids);
create unique index if not exists evidence_chunks_item_unique on public.evidence_chunks (item_id);
