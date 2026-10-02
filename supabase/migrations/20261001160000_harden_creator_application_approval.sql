drop policy if exists "Users can submit creator application"
on public.creator_applications;

create policy "Users can submit creator application"
on public.creator_applications
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and admin_note is null
  and reviewed_at is null
);

drop policy if exists "Users can update own nonapproved application"
on public.creator_applications;

create policy "Users can update own nonapproved application"
on public.creator_applications
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status <> 'approved'
)
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and admin_note is null
  and reviewed_at is null
);
