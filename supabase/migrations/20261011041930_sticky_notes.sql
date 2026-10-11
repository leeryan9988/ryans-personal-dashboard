-- Applied via Supabase migration API, version 20261011041930.
-- Additive, isolated feature: no changes to existing dashboard records.
create table public.sticky_notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('note','todo')),
  title text not null default '' check (length(title) <= 200),
  content text not null default '' check (length(content) <= 100000),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 500),
  image_paths text[] not null default '{}' check (cardinality(image_paths) <= 8),
  color text not null default 'blue' check (color in ('blue','white','sand','rose')),
  pinned boolean not null default false,
  collapsed boolean not null default false,
  sort_order double precision not null default 0,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  mutation_id uuid not null
);
create index sticky_notes_user_id_idx on public.sticky_notes(user_id);
create function public.sticky_notes_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.id <> OLD.id or NEW.user_id <> OLD.user_id then
      raise exception 'Cannot change note ownership';
    end if;
    NEW.created_at := OLD.created_at;
    NEW.version := OLD.version + 1;
  else
    NEW.created_at := now();
    NEW.version := 1;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger sticky_notes_stamp before insert or update on public.sticky_notes
for each row execute function public.sticky_notes_stamp();
alter table public.sticky_notes enable row level security;
revoke all on public.sticky_notes from anon, authenticated;
grant select, insert, update on public.sticky_notes to authenticated;
create policy sticky_notes_read on public.sticky_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy sticky_notes_create on public.sticky_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sticky_notes_edit on public.sticky_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Soft deletion only. No irreversible delete endpoint is exposed by this feature.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('sticky-images','sticky-images',false,5242880,array['image/jpeg','image/png','image/webp','image/gif']);
create policy sticky_images_read on storage.objects for select to authenticated
using (bucket_id = 'sticky-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy sticky_images_create on storage.objects for insert to authenticated
with check (bucket_id = 'sticky-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
alter publication supabase_realtime add table public.sticky_notes;
