-- Admins may moderate recipes written by other people,
-- but never their own recipes.

drop policy if exists "Admins can update all recipes"
on public.recipes;

create policy "Admins can moderate other cooks pending recipes"
on public.recipes
for update
to authenticated
using (
  creator_id <> (select auth.uid())
  and status = 'pending'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  creator_id <> (select auth.uid())
  and status in (
    'approved',
    'declined',
    'changes_requested'
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

-- An admin can create/edit their own draft and publish it directly.
-- The admin-publishing trigger converts "pending" into "approved"
-- before RLS checks the final row.

create policy "Admins can update own draft recipes"
on public.recipes
for update
to authenticated
using (
  creator_id = (select auth.uid())
  and status = 'draft'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  creator_id = (select auth.uid())
  and status in ('draft', 'approved')
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);