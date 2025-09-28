-- Row Level Security policies for Studyin tables

-- Enable RLS
alter table public.attempts enable row level security;
alter table public.sessions enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.evidence_chunks enable row level security;

-- Attempts: allow insert from anon/authenticated, no select/update/delete by default
drop policy if exists attempts_insert_anon on public.attempts;
create policy attempts_insert_anon
  on public.attempts as permissive
  for insert
  to anon, authenticated
  with check (true);

-- Sessions: allow insert from anon/authenticated, no select/update/delete by default
drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon
  on public.sessions as permissive
  for insert
  to anon, authenticated
  with check (true);

-- Analytics snapshots: allow public read; service role bypasses RLS for inserts
drop policy if exists analytics_select_public on public.analytics_snapshots;
create policy analytics_select_public
  on public.analytics_snapshots as permissive
  for select
  to anon, authenticated
  using (true);

-- Evidence chunks: public read; inserts via service role
drop policy if exists evidence_select_public on public.evidence_chunks;
create policy evidence_select_public
  on public.evidence_chunks as permissive
  for select
  to anon, authenticated
  using (true);

-- No other policies are defined; updates/deletes are denied by default.
