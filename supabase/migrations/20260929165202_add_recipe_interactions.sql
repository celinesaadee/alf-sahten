-- Applied to the Alf Sahten project as the add_recipe_interactions migration.
-- Public totals contain no account identifiers. Individual activity is owner-only.
create schema if not exists private;

create table public.recipe_interaction_totals (
  recipe_id text primary key,
  like_count bigint not null default 0 check (like_count >= 0),
  made_count bigint not null default 0 check (made_count >= 0),
  rating_count bigint not null default 0 check (rating_count >= 0),
  rating_sum bigint not null default 0,
  check (rating_sum >= rating_count and rating_sum <= rating_count * 5)
);

insert into public.recipe_interaction_totals (recipe_id) values
  ('fattoush'),
  ('lemon-garlic-chicken'),
  ('labneh-breakfast'),
  ('labneh-toast'),
  ('potato-salad'),
  ('mushroom-pasta'),
  ('garlic-chicken-potatoes'),
  ('lemon-cake');

create table public.recipe_interactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null references public.recipe_interaction_totals(recipe_id),
  liked boolean not null default false,
  made boolean not null default false,
  rating smallint check (rating between 1 and 5),
  primary key (user_id, recipe_id),
  check (rating is null or made)
);

create index recipe_interactions_recipe_id_idx
on public.recipe_interactions(recipe_id);

alter table public.recipe_interactions enable row level security;
alter table public.recipe_interaction_totals enable row level security;

revoke all on public.recipe_interactions
from public, anon, authenticated;

revoke all on public.recipe_interaction_totals
from public, anon, authenticated;

grant select, insert, update, delete
on public.recipe_interactions
to authenticated;

grant select
on public.recipe_interaction_totals
to anon, authenticated;

create policy "Read public recipe totals"
on public.recipe_interaction_totals
for select
to anon, authenticated
using (true);

create policy "Read own recipe activity"
on public.recipe_interactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Create own recipe activity"
on public.recipe_interactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Update own recipe activity"
on public.recipe_interactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Delete own recipe activity"
on public.recipe_interactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create function private.update_recipe_interaction_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  like_delta bigint := 0;
  made_delta bigint := 0;
  count_delta bigint := 0;
  sum_delta bigint := 0;
  target_recipe text;
begin
  if tg_op <> 'DELETE' then
    if (select auth.uid()) is null
      or (select auth.uid()) <> new.user_id then
      raise exception
        'Authentication required for recipe activity'
        using errcode = '42501';
    end if;

    if tg_op = 'UPDATE'
      and (
        new.user_id <> old.user_id
        or new.recipe_id <> old.recipe_id
      ) then
      raise exception
        'Recipe activity identity cannot change'
        using errcode = '23514';
    end if;

    like_delta := new.liked::int;
    made_delta := new.made::int;
    count_delta := (new.rating is not null)::int;
    sum_delta := coalesce(new.rating, 0);
    target_recipe := new.recipe_id;
  end if;

  if tg_op <> 'INSERT' then
    like_delta := like_delta - old.liked::int;
    made_delta := made_delta - old.made::int;
    count_delta :=
      count_delta - (old.rating is not null)::int;
    sum_delta :=
      sum_delta - coalesce(old.rating, 0);
    target_recipe := old.recipe_id;
  end if;

  update public.recipe_interaction_totals
  set
    like_count = like_count + like_delta,
    made_count = made_count + made_delta,
    rating_count = rating_count + count_delta,
    rating_sum = rating_sum + sum_delta
  where recipe_id = target_recipe;

  return null;
end;
$$;

revoke all
on function private.update_recipe_interaction_totals()
from public, anon, authenticated, service_role;

create trigger recipe_interaction_totals_changed
after insert or update or delete
on public.recipe_interactions
for each row
execute function private.update_recipe_interaction_totals();

create function public.set_recipe_interaction(
  p_recipe_id text,
  p_action text,
  p_value integer
)
returns setof public.recipe_interactions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
begin
  if owner_id is null then
    raise exception
      'Sign in to interact with recipes'
      using errcode = '42501';
  end if;

  if p_action in ('like', 'made')
    and p_value in (0, 1) then

    insert into public.recipe_interactions (
      user_id,
      recipe_id,
      liked,
      made
    )
    values (
      owner_id,
      p_recipe_id,
      p_action = 'like' and p_value = 1,
      p_action = 'made' and p_value = 1
    )
    on conflict (user_id, recipe_id)
    do update set
      liked =
        case
          when p_action = 'like'
            then p_value = 1
          else recipe_interactions.liked
        end,
      made =
        case
          when p_action = 'made'
            then p_value = 1
          else recipe_interactions.made
        end,
      rating =
        case
          when p_action = 'made'
            and p_value = 0
            then null
          else recipe_interactions.rating
        end;

  elsif p_action = 'rating'
    and p_value between 0 and 5 then

    update public.recipe_interactions
    set rating = nullif(p_value, 0)
    where user_id = owner_id
      and recipe_id = p_recipe_id
      and made;

    if not found then
      raise exception
        'Mark the recipe as made before rating it'
        using errcode = '23514';
    end if;

  else
    raise exception
      'Invalid recipe action or value'
      using errcode = '22023';
  end if;

  return query
  select *
  from public.recipe_interactions
  where user_id = owner_id
    and recipe_id = p_recipe_id;
end;
$$;

revoke all
on function public.set_recipe_interaction(
  text,
  text,
  integer
)
from public, anon, authenticated;

grant execute
on function public.set_recipe_interaction(
  text,
  text,
  integer
)
to authenticated;
