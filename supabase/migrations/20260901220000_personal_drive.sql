create table if not exists public.personal_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.personal_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique,
  folder text not null default '未分类',
  category text not null default '其他',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  mime_type text not null default 'application/octet-stream',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_files_user_created_idx on public.personal_files (user_id, created_at desc);
create index if not exists personal_files_user_folder_idx on public.personal_files (user_id, folder);

create trigger personal_files_updated before update on public.personal_files
for each row execute function public.set_updated_at();

alter table public.personal_folders enable row level security;
alter table public.personal_files enable row level security;

create policy "owners manage personal folders" on public.personal_folders for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage personal files" on public.personal_files for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('personal-files', 'personal-files', false, 52428800)
on conflict (id) do nothing;

create policy "owners view personal files" on storage.objects for select
using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners upload personal files" on storage.objects for insert
with check (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update personal files" on storage.objects for update
using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete personal files" on storage.objects for delete
using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.personal_folders, public.personal_files;
exception when duplicate_object then null;
end $$;
