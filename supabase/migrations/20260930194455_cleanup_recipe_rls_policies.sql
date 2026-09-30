drop policy if exists "Anyone can view published recipes"
on public.recipes;

drop policy if exists "Creators can view own recipes"
on public.recipes;

drop policy if exists "Creators can create recipes"
on public.recipes;

drop policy if exists "Creators can update own unpublished recipes"
on public.recipes;

drop policy if exists "Creators can delete own unpublished recipes"
on public.recipes;
