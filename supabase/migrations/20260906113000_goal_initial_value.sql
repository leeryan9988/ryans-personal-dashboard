alter table public.goals
  add column if not exists initial_value numeric(14,2);

update public.goals
set initial_value = current_value
where initial_value is null;
