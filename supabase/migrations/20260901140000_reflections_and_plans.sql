create table public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('总目标','工作','副业','身体','个人财务','读书清单','计划和感悟')),
  week_start date not null,
  review_text text not null default '',
  insight_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, area, week_start)
);

create table public.plan_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  note_date date not null default current_date,
  image_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger weekly_reflections_updated before update on public.weekly_reflections
for each row execute function public.set_updated_at();
create trigger plan_notes_updated before update on public.plan_notes
for each row execute function public.set_updated_at();

alter table public.weekly_reflections enable row level security;
alter table public.plan_notes enable row level security;
create policy "owners manage weekly reflections" on public.weekly_reflections for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage plan notes" on public.plan_notes for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-images', 'journal-images', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "owners view journal images" on storage.objects for select
using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners upload journal images" on storage.objects for insert
with check (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update journal images" on storage.objects for update
using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete journal images" on storage.objects for delete
using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.weekly_reflections, public.plan_notes;
exception when duplicate_object then null;
end $$;
