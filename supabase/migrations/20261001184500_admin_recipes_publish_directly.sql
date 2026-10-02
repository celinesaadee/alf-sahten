-- Admin-authored recipes do not require moderation.
-- Drafts are still allowed.
-- When an admin submits their own recipe as "pending",
-- it is automatically published instead.

create or replace function public.publish_admin_authored_recipe()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_is_admin boolean;
begin
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
  into actor_is_admin;

  if actor_is_admin
     and new.creator_id = auth.uid()
     and new.status = 'pending'
  then
    new.status := 'approved';
    new.published_at := coalesce(new.published_at, now());
    new.admin_note := null;
  end if;

  return new;
end;
$$;

revoke execute
on function public.publish_admin_authored_recipe()
from public, anon, authenticated;

drop trigger if exists publish_admin_authored_recipe_trigger
on public.recipes;

create trigger publish_admin_authored_recipe_trigger
before insert or update
on public.recipes
for each row
execute function public.publish_admin_authored_recipe();


-- Allow admins to create their own recipes.
-- The trigger above converts "pending" to "approved"
-- before the row is checked.

drop policy if exists "Admins can create their own recipes"
on public.recipes;

create policy "Admins can create their own recipes"
on public.recipes
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and status in ('draft', 'approved')
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);