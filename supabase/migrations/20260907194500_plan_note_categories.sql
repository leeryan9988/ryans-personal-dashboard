alter table public.plan_notes
add column if not exists category text not null default '未分类';

create index if not exists plan_notes_user_category_idx
on public.plan_notes (user_id, category);
