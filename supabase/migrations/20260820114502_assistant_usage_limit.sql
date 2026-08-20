create table public.assistant_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  primary key (user_id, day)
);

alter table public.assistant_usage enable row level security;

create policy "Users read own assistant usage"
  on public.assistant_usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Counts one assistant request against the caller's daily quota and reports
-- whether it is still under the cap. No insert or update policy exists on the
-- table, so this function is the only way rows are written.
create function public.bump_assistant_usage()
returns table (allowed boolean, used integer, daily_limit integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_limit constant integer := 20;
  v_count integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.assistant_usage as u (user_id, day, request_count)
  values (v_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
  do update set request_count = u.request_count + 1
  returning u.request_count into v_count;

  return query select v_count <= v_limit, v_count, v_limit;
end;
$$;

revoke all on function public.bump_assistant_usage() from public, anon;
grant execute on function public.bump_assistant_usage() to authenticated;
