alter table public.recipes
add column nutrition jsonb not null
default '{}'::jsonb;

alter table public.recipes
add constraint recipes_nutrition_is_object
check (
  jsonb_typeof(nutrition) = 'object'
);