insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'service-photos',
  'service-photos',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
);

create policy "Approved cooks upload own service photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-photos'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
  and exists (
    select 1
    from public.cook_profiles
    where user_id = (select auth.uid())
      and is_approved
  )
);

-- Unique immutable paths: no client update or delete grants/policies
-- for this bucket.
-- Removing a photo from an offer clears its reference,
-- not the stored asset.
