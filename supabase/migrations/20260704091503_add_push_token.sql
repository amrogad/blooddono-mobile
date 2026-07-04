-- Store each donor's Expo push token so matching new requests can notify them.
alter table public.profiles
  add column if not exists push_token text;
