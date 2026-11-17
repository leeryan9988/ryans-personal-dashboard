-- Private article drafts for the signed-in dashboard owner.
create table public.wechat_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_date date not null,
  title text not null check (length(title) between 1 and 200),
  markdown text not null,
  html text not null,
  created_at timestamptz not null default now(),
  unique (user_id, article_date)
);

create index wechat_articles_user_date_idx on public.wechat_articles (user_id, article_date desc);
alter table public.wechat_articles enable row level security;
revoke all on public.wechat_articles from anon, authenticated;
grant select, insert, update on public.wechat_articles to authenticated;
create policy wechat_articles_read on public.wechat_articles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy wechat_articles_create on public.wechat_articles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy wechat_articles_edit on public.wechat_articles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

