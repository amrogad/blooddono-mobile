-- 20 a day was tight: one full eval run is 15 cases against the demo donor
-- account, leaving five for anything else. 50 keeps the spend cap meaningful
-- while letting the eval suite run without tripping it.
create or replace function public.bump_assistant_usage()
returns table (allowed boolean, used integer, daily_limit integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_limit constant integer := 50;
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
