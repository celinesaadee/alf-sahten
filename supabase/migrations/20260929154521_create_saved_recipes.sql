create table if not exists public.saved_recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.saved_recipes enable row level security;

grant select, insert, delete on table public.saved_recipes to authenticated;

create policy "Users can view own saved recipes"
on public.saved_recipes
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save own recipes"
on public.saved_recipes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove own saved recipes"
on public.saved_recipes
for delete
to authenticated
using (auth.uid() = user_id);
