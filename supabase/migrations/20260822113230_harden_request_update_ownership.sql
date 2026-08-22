-- The update policy on blood_donation_requests had a USING clause and no WITH
-- CHECK. In Postgres RLS those answer different questions: USING decides which
-- rows you may update, WITH CHECK decides what the row is allowed to look like
-- afterwards. With only the first, an owner could pass the ownership test on
-- their own row and then set requester_id to somebody else's id, moving the
-- request into another account. It would appear under that account's My
-- Requests, carrying their name and email, and the real owner would lose it.
--
-- is_admin() stays on both sides so admin moderation keeps working.
drop policy if exists "owner or admin can update requests" on public.blood_donation_requests;

create policy "owner or admin can update requests"
  on public.blood_donation_requests
  for update
  to authenticated
  using ((requester_id = (select auth.uid())) or is_admin())
  with check ((requester_id = (select auth.uid())) or is_admin());
