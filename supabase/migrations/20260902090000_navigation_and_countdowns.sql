create table if not exists public.dashboard_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nav_order text[] not null default array['总目标','工作','副业','身体','个人财务','读书清单','个人网盘','计划和感悟'],
  updated_at timestamptz not null default now()
);

create table if not exists public.target_countdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  target_date date not null,
  note text not null default '' check (char_length(note) <= 1000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists target_countdowns_user_date_idx
on public.target_countdowns (user_id, target_date, completed_at);

create trigger dashboard_preferences_updated before update on public.dashboard_preferences
for each row execute function public.set_updated_at();

create trigger target_countdowns_updated before update on public.target_countdowns
for each row execute function public.set_updated_at();

alter table public.dashboard_preferences enable row level security;
alter table public.target_countdowns enable row level security;

create policy "owners manage dashboard preferences" on public.dashboard_preferences for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owners manage target countdowns" on public.target_countdowns for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.dashboard_preferences, public.target_countdowns;
exception when duplicate_object then null;
end $$;
