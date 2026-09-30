create table if not exists public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.recipe_categories enable row level security;

drop policy if exists "Anyone can view active recipe categories"
on public.recipe_categories;

create policy "Anyone can view active recipe categories"
on public.recipe_categories
for select
using (
  is_active = true
);