alter table public.recipes enable row level security;

-- Remove old versions first so this script can safely be run again
drop policy if exists "Anyone can view approved recipes"
on public.recipes;

drop policy if exists "Cooks can view their own recipes"
on public.recipes;

drop policy if exists "Approved cooks can create recipes"
on public.recipes;

drop policy if exists "Approved cooks can update their own recipes"
on public.recipes;

drop policy if exists "Approved cooks can delete their own recipes"
on public.recipes;


-- Anyone can see published recipes
create policy "Anyone can view approved recipes"
on public.recipes
for select
using (
status = 'approved'
);


-- Logged-in cooks can see all of their own recipes,
-- including drafts
create policy "Cooks can view their own recipes"
on public.recipes
for select
to authenticated
using (
  creator_id = auth.uid()
);


-- Only approved cooks can create recipes
create policy "Approved cooks can create recipes"
on public.recipes
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and status in ('draft', 'pending')
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);


create policy "Approved cooks can update their own recipes"
on public.recipes
for update
to authenticated
using (
  creator_id = auth.uid()
  and status in (
    'draft',
    'changes_requested',
    'declined'
  )
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
)
with check (
  creator_id = auth.uid()
  and status in (
    'draft',
    'pending'
  )
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);


-- Approved cooks can delete only their own recipes
create policy "Approved cooks can delete their own recipes"
on public.recipes
for delete
to authenticated
using (
  creator_id = auth.uid()
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);

-- Admins can view every recipe, including pending,
-- declined and changes requested
drop policy if exists "Admins can view all recipes"
on public.recipes;

create policy "Admins can view all recipes"
on public.recipes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- Admins can update recipe moderation status
drop policy if exists "Admins can update all recipes"
on public.recipes;

create policy "Admins can update all recipes"
on public.recipes
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);