-- Applied hosted migration recipe_tags, version 20261005184612. Source backup.
alter table public.recipes add column tags text[] not null default '{}'::text[];
alter table public.recipes add constraint recipes_supported_tags check (
  cardinality(tags) <= 4 and tags <@ array['vegetarian','quick-meals','budget-friendly','one-pot']::text[]
  and array_position(tags, null) is null
);
-- Existing recipe RLS continues to control publication and owner/admin edits.
grant select(tags) on public.recipes to anon, authenticated, service_role;
grant insert(tags), update(tags) on public.recipes to authenticated;
