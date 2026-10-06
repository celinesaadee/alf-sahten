create policy "Approved cooks can update their own approved recipes"
on public.recipes
for update
to authenticated
using (
  creator_id = auth.uid()
  and status = 'approved'
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
)
with check (
  creator_id = auth.uid()
  and status = 'approved'
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);
