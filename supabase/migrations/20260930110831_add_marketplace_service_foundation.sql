-- Additive marketplace step 1. Existing cooks stay recipe-only by default.
alter table public.cook_profiles
  add column plan_tier text not null default 'free'
  constraint cook_profiles_plan_tier_check check (plan_tier in ('free', 'pro'));

comment on column public.cook_profiles.plan_tier is
  'Platform-managed entitlement only. No billing or feature limits in this phase.';

revoke insert (plan_tier), update (plan_tier)
on public.cook_profiles
from anon, authenticated;

create table public.cook_services (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references public.cook_profiles(user_id) on delete restrict,

  service_type text not null check (
    service_type in (
      'homemade_food',
      'catering',
      'cakes_desserts',
      'meal_prep',
      'private_cooking',
      'cooking_classes',
      'digital_recipe_books',
      'meal_plans',
      'other'
    )
  ),

  title text not null
    check (char_length(btrim(title)) between 1 and 100),

  description text not null default ''
    check (char_length(description) <= 1000),

  starting_price numeric(12,2),
  currency text,

  photo_url text
    check (
      photo_url is null
      or (
        char_length(photo_url) <= 2048
        and photo_url ~ '^https://[^[:space:]]+$'
      )
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'available',
        'paused',
        'archived'
      )
    ),

  availability_note text not null default ''
    check (char_length(availability_note) <= 250),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cook_services_price_currency_check
    check (
      (
        starting_price is null
        and currency is null
      )
      or
      (
        starting_price is not null
        and currency is not null
        and starting_price >= 0
        and starting_price <= 9999999999.99
        and currency ~ '^[A-Z]{3}$'
      )
    )
);

comment on table public.cook_services is
  'Optional cook offers. Archive instead of deleting to preserve future request references. A starting price is an estimate, not a payment or binding quote.';

create index cook_services_cook_status_created_idx
on public.cook_services(
  cook_id,
  status,
  created_at desc
);

create trigger cook_services_set_updated_at
before update on public.cook_services
for each row
execute function public.set_updated_at();

alter table public.cook_services
enable row level security;

revoke all
on public.cook_services
from public, anon, authenticated;

grant select
on public.cook_services
to anon, authenticated;

grant insert (
  cook_id,
  service_type,
  title,
  description,
  starting_price,
  currency,
  photo_url,
  status,
  availability_note
)
on public.cook_services
to authenticated;

grant update (
  service_type,
  title,
  description,
  starting_price,
  currency,
  photo_url,
  status,
  availability_note
)
on public.cook_services
to authenticated;

create policy "Read available services or own listings"
on public.cook_services
for select
to anon, authenticated
using (
  cook_id = (select auth.uid())
  or (
    status = 'available'
    and exists (
      select 1
      from public.cook_profiles cp
      where cp.user_id = cook_services.cook_id
        and cp.is_approved
    )
  )
);

create policy "Approved cooks create own services"
on public.cook_services
for insert
to authenticated
with check (
  cook_id = (select auth.uid())
  and exists (
    select 1
    from public.cook_profiles cp
    where cp.user_id = (select auth.uid())
      and cp.is_approved
  )
);

create policy "Approved cooks update own services"
on public.cook_services
for update
to authenticated
using (
  cook_id = (select auth.uid())
  and exists (
    select 1
    from public.cook_profiles cp
    where cp.user_id = (select auth.uid())
      and cp.is_approved
  )
)
with check (
  cook_id = (select auth.uid())
  and exists (
    select 1
    from public.cook_profiles cp
    where cp.user_id = (select auth.uid())
      and cp.is_approved
  )
);
