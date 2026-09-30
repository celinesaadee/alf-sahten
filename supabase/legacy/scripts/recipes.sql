create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text,

  cover_image_url text,

  prep_time integer,
  cook_time integer,
  servings integer,

  difficulty text
    check (difficulty in ('easy', 'medium', 'hard')),

  category text,
  cuisine text,

  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,

  notes text,

  status text not null default 'draft'
    check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);