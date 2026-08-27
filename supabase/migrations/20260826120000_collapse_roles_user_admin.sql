-- Collapse the three-role model (admin/donor/volunteer) into two (admin/user).
-- Volunteers only ever did content moderation, which is now admin-only; every
-- other signed-in account is a plain "user" who can request blood and donate.

-- Existing rows: donor and volunteer both become user.
update public.profiles set role = 'user' where role in ('donor', 'volunteer');

-- New signups take the default (handle_new_user inserts without a role).
alter table public.profiles alter column role set default 'user';

-- Constrain the column to the two valid roles.
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

-- is_staff() meant "admin or volunteer" and now collapses into is_admin().
-- Repoint every policy that referenced it, then drop the redundant function.
alter policy "anyone can read published blogs" on public.blogs
  using ((status = 'published') or public.is_admin());
alter policy "staff can create blogs" on public.blogs
  with check (public.is_admin());
alter policy "staff can update blogs" on public.blogs
  using (public.is_admin());
alter policy "staff can delete blogs" on public.blogs
  using (public.is_admin());
alter policy "owner or staff can view requests" on public.blood_donation_requests
  using ((requester_id = auth.uid()) or public.is_admin());
alter policy "staff upload blog images" on storage.objects
  with check ((bucket_id = 'blog-images') and public.is_admin());

drop function if exists public.is_staff();

-- admin_set_role validates against the two-role domain.
create or replace function public.admin_set_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('admin', 'user') then
    raise exception 'invalid role';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;
