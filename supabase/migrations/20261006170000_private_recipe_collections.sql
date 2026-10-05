-- Private recipe collections
-- Each authenticated user can create private collections and organize
-- approved recipes inside them.
--
-- This migration mirrors the Collections schema already applied to the
-- live Supabase project.

create table public.recipe_collections (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    default auth.uid()
    references auth.users(id)
    on delete cascade,

  name text not null,

  archived boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint recipe_collections_name_check
    check (
      char_length(name) >= 1
      and char_length(name) <= 120
      and name = btrim(name)
    ),

  constraint recipe_collections_id_user_id_key
    unique (id, user_id)
);


create unique index recipe_collections_active_name
  on public.recipe_collections (
    user_id,
    lower(name)
  )
  where not archived;


create index recipe_collections_user_idx
  on public.recipe_collections (
    user_id,
    archived
  );


create trigger recipe_collections_updated_at
before update on public.recipe_collections
for each row
execute function public.set_updated_at();


create table public.collection_recipes (
  collection_id uuid not null,

  user_id uuid not null
    default auth.uid(),

  recipe_id uuid not null
    references public.recipes(id)
    on delete cascade,

  created_at timestamptz not null
    default now(),

  constraint collection_recipes_pkey
    primary key (
      collection_id,
      recipe_id
    ),

  constraint collection_recipes_collection_id_user_id_fkey
    foreign key (
      collection_id,
      user_id
    )
    references public.recipe_collections(
      id,
      user_id
    )
    on delete cascade
);


create index collection_recipes_recipe_idx
  on public.collection_recipes (
    recipe_id
  );


create index collection_recipes_user_idx
  on public.collection_recipes (
    user_id
  );


alter table public.recipe_collections
  enable row level security;

alter table public.collection_recipes
  enable row level security;


-- =========================================================
-- RECIPE COLLECTION POLICIES
-- =========================================================

create policy "Read own collections"
on public.recipe_collections
for select
to authenticated
using (
  user_id = (
    select auth.uid()
  )
);


create policy "Create own collections"
on public.recipe_collections
for insert
to authenticated
with check (
  user_id = (
    select auth.uid()
  )
);


create policy "Manage own collections"
on public.recipe_collections
for update
to authenticated
using (
  user_id = (
    select auth.uid()
  )
)
with check (
  user_id = (
    select auth.uid()
  )
);


-- =========================================================
-- COLLECTION RECIPE POLICIES
-- =========================================================

create policy "Read own collection recipes"
on public.collection_recipes
for select
to authenticated
using (
  user_id = (
    select auth.uid()
  )
);


create policy "Add own collection recipes"
on public.collection_recipes
for insert
to authenticated
with check (
  user_id = (
    select auth.uid()
  )

  and exists (
    select 1
    from public.recipe_collections c
    where
      c.id = collection_recipes.collection_id
      and c.user_id = (
        select auth.uid()
      )
      and not c.archived
  )

  and exists (
    select 1
    from public.recipes r
    where
      r.id = collection_recipes.recipe_id
      and r.status = 'approved'
  )
);


create policy "Remove own collection recipes"
on public.collection_recipes
for delete
to authenticated
using (
  user_id = (
    select auth.uid()
  )
);


-- =========================================================
-- CREATE COLLECTION + ADD RECIPE ATOMICALLY
-- =========================================================

create or replace function public.create_recipe_collection_with_recipe(
  p_name text,
  p_recipe_id uuid
)
returns setof public.recipe_collections
language plpgsql
set search_path = ''
as $function$
declare
  new_id uuid;
begin
  insert into public.recipe_collections (
    name
  )
  values (
    btrim(p_name)
  )
  returning id
  into new_id;

  insert into public.collection_recipes (
    collection_id,
    recipe_id
  )
  values (
    new_id,
    p_recipe_id
  );

  return query
  select *
  from public.recipe_collections
  where id = new_id;
end;
$function$;


-- =========================================================
-- PERMISSIONS
-- =========================================================

revoke all
on table public.recipe_collections
from anon;

revoke all
on table public.collection_recipes
from anon;


revoke all
on table public.recipe_collections
from authenticated;

grant
  select,
  insert,
  update
on table public.recipe_collections
to authenticated;


revoke all
on table public.collection_recipes
from authenticated;

grant
  select,
  insert,
  delete
on table public.collection_recipes
to authenticated;


grant all
on table public.recipe_collections
to service_role;

grant all
on table public.collection_recipes
to service_role;


revoke all
on function public.create_recipe_collection_with_recipe(
  text,
  uuid
)
from public;

grant execute
on function public.create_recipe_collection_with_recipe(
  text,
  uuid
)
to authenticated;