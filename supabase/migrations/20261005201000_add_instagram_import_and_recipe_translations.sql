-- Instagram import + automatic recipe translations
--
-- This migration mirrors the database changes that were originally
-- applied directly in Supabase while building these features.
--
-- No Instagram or DeepL secrets are stored here.

-- ============================================================
-- INSTAGRAM CONNECTIONS
-- ============================================================

create table if not exists public.instagram_connections (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  instagram_user_id text not null,
  instagram_username text,
  access_token text not null,
  token_expires_at timestamptz,

  scopes text[] not null
    default '{}'::text[],

  connected_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

alter table public.instagram_connections
  enable row level security;

-- Instagram access tokens must never be exposed directly to
-- browser clients. Only Edge Functions using service_role
-- should access this table.

revoke all privileges
  on table public.instagram_connections
  from anon;

revoke all privileges
  on table public.instagram_connections
  from authenticated;

grant all privileges
  on table public.instagram_connections
  to service_role;


-- ============================================================
-- INSTAGRAM OAUTH STATES
-- ============================================================

create table if not exists public.instagram_oauth_states (
  state_hash text primary key,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  expires_at timestamptz not null
    default (
      now() + interval '10 minutes'
    ),

  used_at timestamptz,

  created_at timestamptz not null
    default now()
);

create index if not exists
  instagram_oauth_states_expires_at_idx
on public.instagram_oauth_states (
  expires_at
);

alter table public.instagram_oauth_states
  enable row level security;

revoke all privileges
  on table public.instagram_oauth_states
  from anon;

revoke all privileges
  on table public.instagram_oauth_states
  from authenticated;

grant all privileges
  on table public.instagram_oauth_states
  to service_role;


-- ============================================================
-- INSTAGRAM FIELDS ON RECIPES
-- ============================================================

alter table public.recipes
  add column if not exists
    instagram_media_id text;

alter table public.recipes
  add column if not exists
    instagram_permalink text;

create unique index if not exists
  recipes_creator_instagram_media_unique
on public.recipes (
  creator_id,
  instagram_media_id
)
where instagram_media_id is not null;


-- ============================================================
-- RECIPE TRANSLATIONS
-- ============================================================

create table if not exists public.recipe_translations (
  id uuid primary key
    default gen_random_uuid(),

  recipe_id uuid not null
    references public.recipes(id)
    on delete cascade,

  language text not null
    check (
      language in (
        'en',
        'fr',
        'ar'
      )
    ),

  title text not null
    default '',

  description text not null
    default '',

  ingredients jsonb not null
    default '[]'::jsonb,

  instructions jsonb not null
    default '[]'::jsonb,

  source_updated_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    recipe_id,
    language
  )
);

create index if not exists
  recipe_translations_recipe_id_idx
on public.recipe_translations (
  recipe_id
);

alter table public.recipe_translations
  enable row level security;


-- ============================================================
-- RECIPE TRANSLATION PERMISSIONS
-- ============================================================

-- Browser users may read translations when allowed by RLS
-- but may never create or modify translations directly.

revoke all privileges
  on table public.recipe_translations
  from anon;

revoke all privileges
  on table public.recipe_translations
  from authenticated;

grant select
  on table public.recipe_translations
  to anon;

grant select
  on table public.recipe_translations
  to authenticated;

grant all privileges
  on table public.recipe_translations
  to service_role;


-- ============================================================
-- RECIPE TRANSLATION RLS
-- ============================================================

drop policy if exists
  "Anyone can view translations of approved recipes"
on public.recipe_translations;

create policy
  "Anyone can view translations of approved recipes"
on public.recipe_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.recipes r
    where
      r.id =
        recipe_translations.recipe_id
      and r.status = 'approved'
  )
);


drop policy if exists
  "Cooks can view translations of own recipes"
on public.recipe_translations;

create policy
  "Cooks can view translations of own recipes"
on public.recipe_translations
for select
to authenticated
using (
  exists (
    select 1
    from public.recipes r
    where
      r.id =
        recipe_translations.recipe_id
      and r.creator_id =
        auth.uid()
  )
);


drop policy if exists
  "Admins can view all recipe translations"
on public.recipe_translations;

create policy
  "Admins can view all recipe translations"
on public.recipe_translations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where
      p.id = auth.uid()
      and p.role = 'admin'
  )
);


-- ============================================================
-- EDGE FUNCTION SERVICE ROLE ACCESS
-- ============================================================

-- These SELECT grants are required by the Edge Functions when
-- validating Cook access and admin translation access.

grant select
  on table public.cook_profiles
  to service_role;

grant select
  on table public.profiles
  to service_role;

grant select
  on table public.recipes
  to service_role;