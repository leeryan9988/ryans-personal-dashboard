create table public.session_handoffs (
  id uuid primary key,
  encrypted_session text,
  expires_at timestamptz not null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.session_handoffs enable row level security;

create policy "create short lived login handoff"
on public.session_handoffs
for insert
to anon, authenticated
with check (
  encrypted_session is null
  and expires_at > now()
  and expires_at <= now() + interval '10 minutes'
);

create policy "read short lived login handoff"
on public.session_handoffs
for select
to anon, authenticated
using (expires_at > now());

create policy "approve short lived login handoff"
on public.session_handoffs
for update
to authenticated
using (expires_at > now())
with check (expires_at > now() and encrypted_session is not null);

create policy "remove approved login handoff"
on public.session_handoffs
for delete
to authenticated
using (true);
