create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  social_link text,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','declined','changes_requested')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'Other',
  image_url text,
  prep_minutes integer not null default 0 check (prep_minutes >= 0),
  cook_minutes integer not null default 0 check (cook_minutes >= 0),
  servings integer not null default 1 check (servings > 0),
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  original_language text not null default 'en' check (original_language in ('en','fr','ar')),
  status text not null default 'draft' check (status in ('draft','pending','approved','declined','changes_requested')),
  admin_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_ingredients_is_array check (jsonb_typeof(ingredients) = 'array'),
  constraint recipes_instructions_is_array check (jsonb_typeof(instructions) = 'array')
);

alter table public.creator_applications enable row level security;
alter table public.recipes enable row level security;

grant select, insert, update on public.creator_applications to authenticated;
grant select on public.recipes to anon;
grant select, insert, update, delete on public.recipes to authenticated;

create policy "Users can view own creator application"
on public.creator_applications
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Users can submit creator application"
on public.creator_applications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own nonapproved application"
on public.creator_applications
for update
to authenticated
using (
  auth.uid() = user_id
  and status <> 'approved'
)
with check (
  auth.uid() = user_id
  and status in ('pending','changes_requested','declined')
);

create policy "Admins can update creator applications"
on public.creator_applications
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Anyone can view approved recipes"
on public.recipes
for select
to anon, authenticated
using (status = 'approved');

create policy "Creators can view own recipes"
on public.recipes
for select
to authenticated
using (auth.uid() = creator_id);

create policy "Admins can view all recipes"
on public.recipes
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Creators can create recipes"
on public.recipes
for insert
to authenticated
with check (
  auth.uid() = creator_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('creator','admin')
  )
  and status in ('draft','pending')
);

create policy "Creators can update own unpublished recipes"
on public.recipes
for update
to authenticated
using (
  auth.uid() = creator_id
  and status <> 'approved'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('creator','admin')
  )
)
with check (
  auth.uid() = creator_id
  and status in ('draft','pending','declined','changes_requested')
);

create policy "Admins can update all recipes"
on public.recipes
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Creators can delete own unpublished recipes"
on public.recipes
for delete
to authenticated
using (
  auth.uid() = creator_id
  and status <> 'approved'
);

create policy "Admins can delete recipes"
on public.recipes
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create trigger creator_applications_set_updated_at
before update on public.creator_applications
for each row execute function public.set_updated_at();

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create or replace function public.sync_creator_role_from_application()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    update public.profiles
    set role = 'creator'
    where id = new.user_id and role <> 'admin';

    new.reviewed_at = coalesce(new.reviewed_at, now());
  elsif new.status in ('declined','changes_requested') and old.status is distinct from new.status then
    new.reviewed_at = coalesce(new.reviewed_at, now());
  end if;

  return new;
end;
$$;

revoke all on function public.sync_creator_role_from_application() from public, anon, authenticated;

drop trigger if exists sync_creator_role_after_application_review on public.creator_applications;

create trigger sync_creator_role_after_application_review
before update on public.creator_applications
for each row execute function public.sync_creator_role_from_application();
