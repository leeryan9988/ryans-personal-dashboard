create extension if not exists pgcrypto;

create table public.work_products (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, margin numeric(7,2) not null default 0,
  supply_chain text not null default '', patent_review text not null default '', review_insights text not null default '',
  stage text not null default '类目调研', status text not null default '进行中', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project text not null check (project in ('自媒体','网盘拉新','抖音电商')), platform text not null,
  week_label text not null, week_start date not null, revenue numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0, profit numeric(12,2) not null default 0, created_at timestamptz not null default now()
);
create table public.health_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date_label text not null, logged_at date not null, weight numeric(6,2) not null, body_fat numeric(5,2) not null,
  workouts integer not null default 0 check (workouts >= 0), created_at timestamptz not null default now()
);
create table public.finance_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date_label text not null, occurred_at date not null, type text not null check (type in ('收入','支出')),
  category text not null, amount numeric(12,2) not null check (amount >= 0), note text not null default '', created_at timestamptz not null default now()
);
create table public.books (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, author text not null default '', status text not null check (status in ('想读','在读','已读')),
  progress integer not null default 0 check (progress between 0 and 100), rating numeric(2,1) check (rating between 0 and 5),
  notes text not null default '', finished_at date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('工作','副业','身体','个人财务','读书清单')), title text not null, metric text not null,
  current_value numeric(14,2), target_value numeric(14,2), unit text not null, started_at date not null, deadline date not null,
  status text not null default '进行中' check (status in ('进行中','已达成','已归档')), result text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger work_products_updated before update on public.work_products for each row execute function public.set_updated_at();
create trigger books_updated before update on public.books for each row execute function public.set_updated_at();
create trigger goals_updated before update on public.goals for each row execute function public.set_updated_at();

alter table public.work_products enable row level security;
alter table public.profit_logs enable row level security;
alter table public.health_logs enable row level security;
alter table public.finance_logs enable row level security;
alter table public.books enable row level security;
alter table public.goals enable row level security;

create policy "owners manage work products" on public.work_products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage profit logs" on public.profit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage health logs" on public.health_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage finance logs" on public.finance_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage books" on public.books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.work_products, public.profit_logs, public.health_logs, public.finance_logs, public.books, public.goals;
exception when duplicate_object then null;
end $$;
