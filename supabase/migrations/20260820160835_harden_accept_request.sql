-- accept_request ran as SECURITY DEFINER with no check that the caller was
-- signed in, and Postgres grants EXECUTE to PUBLIC by default, so the anon role
-- could reach it through /rest/v1/rpc/accept_request. Paired with
-- get_pending_requests, which is also anon-callable and returns request ids,
-- anyone holding the public anon key could walk every pending request and flip
-- it to 'inprogress' with a null donor, taking it off the board for real donors.
create or replace function public.accept_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me_id uuid := auth.uid();
  me_name text;
  me_email text;
begin
  if me_id is null then
    raise exception 'not authenticated';
  end if;

  select p.display_name, u.email into me_name, me_email
  from public.profiles p join auth.users u on u.id = p.id
  where p.id = me_id;

  update public.blood_donation_requests
    set donor_id = me_id,
        donor_name = me_name,
        donor_email = me_email,
        donation_status = 'inprogress'
  where id = request_id and donation_status = 'pending';
end;
$$;

revoke all on function public.accept_request(uuid) from public, anon;
grant execute on function public.accept_request(uuid) to authenticated;
