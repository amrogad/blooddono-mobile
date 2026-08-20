-- The pending-requests board is public by design: the home page hero, the
-- /blood-donation-request route and the login page all read it while signed
-- out, and that public discovery is the point of the product. But it was
-- returning the patient's full name next to their city and donation date to
-- anyone holding the anon key, which ships in the frontend bundle.
--
-- So the board stays public and the name gets masked to "Mona K." for signed-out
-- callers. Signed-in users still see the full name, which is what the card was
-- always showing. Not SECURITY DEFINER: it is a pure string function with no
-- table access, so it has nothing to elevate.
create or replace function public.mask_recipient_name(full_name text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select case
    when full_name is null or btrim(full_name) = '' then full_name
    when position(' ' in btrim(full_name)) = 0 then btrim(full_name)
    else split_part(btrim(full_name), ' ', 1) || ' ' ||
         upper(left(split_part(btrim(full_name), ' ', 2), 1)) || '.'
  end;
$$;

create or replace function public.get_pending_requests()
returns table (
  id uuid,
  recipient_name text,
  recipient_governorate text,
  recipient_city text,
  blood_group text,
  donation_date date,
  donation_time time without time zone
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select r.id,
         case
           when auth.uid() is null then public.mask_recipient_name(r.recipient_name)
           else r.recipient_name
         end,
         r.recipient_governorate,
         r.recipient_city,
         r.blood_group,
         r.donation_date,
         r.donation_time
  from public.blood_donation_requests r
  where r.donation_status = 'pending'
  order by r.created_at desc;
$$;

-- The detail view additionally returns hospital_name and full_address, which is
-- the patient's exact location. Both apps already gate this screen behind auth
-- (web wraps the route in PrivateRoute, mobile puts the whole app inside
-- Stack.Protected), so requiring a session here changes no working flow.
create or replace function public.get_request_details(p_id uuid)
returns table (
  id uuid,
  recipient_name text,
  recipient_governorate text,
  recipient_city text,
  hospital_name text,
  full_address text,
  blood_group text,
  donation_date date,
  donation_time time without time zone,
  request_message text,
  donation_status text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
    select r.id, r.recipient_name, r.recipient_governorate, r.recipient_city,
           r.hospital_name, r.full_address, r.blood_group, r.donation_date,
           r.donation_time, r.request_message, r.donation_status
    from public.blood_donation_requests r
    where r.id = p_id;
end;
$$;

revoke all on function public.get_request_details(uuid) from public, anon;
grant execute on function public.get_request_details(uuid) to authenticated;
