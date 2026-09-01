alter table public.books
  add column if not exists category text not null default '其他',
  add column if not exists start_date date,
  add column if not exists planned_end_date date,
  add column if not exists planned_hours numeric(8,1) not null default 0 check (planned_hours >= 0),
  add column if not exists daily_minutes integer not null default 0 check (daily_minutes >= 0);

comment on column public.books.category is '阅读分类，例如历史、人文、商业、投资';
comment on column public.books.start_date is '计划或实际开始阅读日期';
comment on column public.books.planned_end_date is '预计结束阅读日期';
comment on column public.books.planned_hours is '预计完成全书所需小时数';
comment on column public.books.daily_minutes is '每日计划阅读分钟数';
