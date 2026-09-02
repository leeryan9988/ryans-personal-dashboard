alter table public.profit_logs
add column if not exists note text not null default '';
