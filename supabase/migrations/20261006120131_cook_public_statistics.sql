-- Only aggregate counts leave the server. Follow and save identities retain their RLS.
create index if not exists saved_recipes_recipe_id_idx on public.saved_recipes (recipe_id);
create index if not exists cook_follows_cook_id_idx on public.cook_follows (cook_id);
create index if not exists recipes_approved_creator_idx on public.recipes (creator_id) where status = 'approved';

-- The server needs only these join/count columns; save-owner IDs are not needed.
grant select (follower_id, cook_id) on public.cook_follows to service_role;
grant select (recipe_id) on public.saved_recipes to service_role;

create or replace function public.get_cook_public_statistics(p_cook_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'follower_count', (select count(*) from public.cook_follows f where f.cook_id = c.user_id),
    'following_count', (select count(*) from public.cook_follows f where f.follower_id = c.user_id),
    'recipe_count', (select count(*) from public.recipes r where r.creator_id = c.user_id and r.status = 'approved'),
    'total_saves', (select count(*) from public.saved_recipes s
      join public.recipes r on s.recipe_id = r.id::text
      where r.creator_id = c.user_id and r.status = 'approved')
  )
  from public.public_cook_profiles c
  where c.user_id = p_cook_id and c.is_approved = true;
$$;

revoke all on function public.get_cook_public_statistics(uuid) from public, anon, authenticated;
grant execute on function public.get_cook_public_statistics(uuid) to service_role;

comment on function public.get_cook_public_statistics(uuid) is
  'Service-only aggregate counts for approved public cooks. No follower or saver identities are returned.';
