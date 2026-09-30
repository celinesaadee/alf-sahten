create policy "Approved cooks read own service photo objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'service-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = (select auth.uid())
      and cook_profiles.is_approved
  )
);

create policy "Approved cooks update own service photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = (select auth.uid())
      and cook_profiles.is_approved
  )
)
with check (
  bucket_id = 'service-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = (select auth.uid())
      and cook_profiles.is_approved
  )
);

create policy "Approved cooks delete own service photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = (select auth.uid())
      and cook_profiles.is_approved
  )
);