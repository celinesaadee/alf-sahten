create table public.cook_profiles (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  display_name text not null,
  profile_image_url text,
  cover_image_url text,

  bio text not null default '',
  location text,

  cook_type text not null
    check (
      cook_type in (
        'home_cook',
        'food_creator',
        'professional_chef'
      )
    ),

  specialties text[] not null default '{}',

  instagram_url text,
  website_url text,
  whatsapp_contact text,

  is_approved boolean not null default false,

  follower_count bigint not null default 0
    check (follower_count >= 0),

  recipe_count bigint not null default 0
    check (recipe_count >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


alter table public.cook_profiles
enable row level security;


create trigger cook_profiles_set_updated_at
before update on public.cook_profiles
for each row
execute function public.set_updated_at();


-- When someone creates their Cook profile after already
-- being approved, automatically preserve their approved status.
create or replace function public.set_initial_cook_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_approved :=
    exists (
      select 1
      from public.profiles
      where profiles.id = new.user_id
        and profiles.role in ('creator', 'admin')
    );

  return new;
end;
$$;


create trigger cook_profiles_set_initial_approval
before insert on public.cook_profiles
for each row
execute function public.set_initial_cook_approval();


-- Keep Cook profile approval synchronized with the
-- existing creator application approval process.
create or replace function private.sync_cook_profile_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.cook_profiles
  set is_approved = (new.status = 'approved')
  where user_id = new.user_id;

  return new;
end;
$$;


revoke all
on function private.sync_cook_profile_approval()
from public, anon, authenticated;


create trigger sync_cook_profile_after_application_review
after update of status
on public.creator_applications
for each row
when (old.status is distinct from new.status)
execute function private.sync_cook_profile_approval();


-- Anyone may view approved Cook profiles.
create policy "Public can view approved cook profiles"
on public.cook_profiles
for select
to anon, authenticated
using (
  is_approved = true
);


-- A signed-in user can always see their own Cook profile,
-- including while waiting for approval.
create policy "Users can view own cook profile"
on public.cook_profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "Users can create own cook profile"
on public.cook_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);


create policy "Users can update own cook profile"
on public.cook_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


revoke all
on table public.cook_profiles
from anon, authenticated;


grant select
on table public.cook_profiles
to anon, authenticated;


grant insert (
  user_id,
  display_name,
  profile_image_url,
  cover_image_url,
  bio,
  location,
  cook_type,
  specialties,
  instagram_url,
  website_url,
  whatsapp_contact
)
on public.cook_profiles
to authenticated;


grant update (
  display_name,
  profile_image_url,
  cover_image_url,
  bio,
  location,
  cook_type,
  specialties,
  instagram_url,
  website_url,
  whatsapp_contact
)
on public.cook_profiles
to authenticated;