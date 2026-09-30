drop policy if exists "Approved cooks can upload recipe images"
on storage.objects;

drop policy if exists "Cooks can update their own recipe images"
on storage.objects;

drop policy if exists "Cooks can delete their own recipe images"
on storage.objects;


create policy "Approved cooks can upload recipe images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = auth.uid()
      and cook_profiles.is_approved = true
  )
);


create policy "Cooks can update their own recipe images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "Cooks can delete their own recipe images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);