-- The assistant was sign-in only, which meant the one feature worth showing a
-- first-time visitor was the one they could not reach. Opening it up needs a
-- quota that works without auth.uid(), so anonymous callers are counted against
-- a hash of their IP instead of a user id.
--
-- The hash is computed in the edge function, not here, and the raw address is
-- never sent to Postgres. Only the digest is stored.
create table public.assistant_anon_usage (
  client_key text not null,
  day date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  primary key (client_key, day)
);

alter table public.assistant_anon_usage enable row level security;

-- Deliberately no policies: nothing reaches this table except the definer
-- function below, which only the service role may call.

-- Lower than the 50/day signed-in cap. An IP is a much weaker identity than an
-- account — offices and mobile carriers share them — so this is sized to let a
-- visitor try the assistant, not to be somebody's daily driver.
create function public.bump_anon_assistant_usage(p_client_key text)
returns table (allowed boolean, used integer, daily_limit integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_limit constant integer := 10;
  v_count integer;
begin
  if p_client_key is null or length(p_client_key) = 0 then
    raise exception 'client key required';
  end if;

  insert into public.assistant_anon_usage as u (client_key, day, request_count)
  values (p_client_key, (now() at time zone 'utc')::date, 1)
  on conflict (client_key, day)
  do update set request_count = u.request_count + 1
  returning u.request_count into v_count;

  return query select v_count <= v_limit, v_count, v_limit;
end;
$$;

-- Callable only with the service role key, which lives in the edge function's
-- environment. If anon could call it directly, a caller could pass any string
-- as the key and hand themselves a fresh quota on every request.
revoke all on function public.bump_anon_assistant_usage(text) from public, anon, authenticated;
grant execute on function public.bump_anon_assistant_usage(text) to service_role;

-- Yesterday's rows are dead weight; nothing reads them after the day rolls over.
create index assistant_anon_usage_day_idx on public.assistant_anon_usage (day);
