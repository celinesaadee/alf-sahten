drop policy if exists "Approved cooks can delete their own recipes"
on public.recipes;

create policy "Approved cooks can delete their own unpublished recipes"
on public.recipes
for delete
to authenticated
using (
  creator_id = auth.uid()
  and status <> 'approved'
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);