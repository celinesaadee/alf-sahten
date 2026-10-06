# Cook profile statistics and customization

Public profiles show published recipe, follower, following, and current recipe-save counts. Following identities remain private and appear only on the signed-in user's **Profile → Cooks you follow** list. Saved-user identities are never exposed. Instagram and website cards show the actual handle/domain and reject unsafe link protocols.

**Profile → Edit cook profile** opens the existing profile form, including bio, specialties, social links, profile photo and cover. Approved cooks can upload JPG/PNG/WebP images through the existing owner-scoped `recipe-images` bucket. Uploaded images are compressed with the existing image utility. A photo URL can also be used. Removing a photo clears its profile reference; existing files are preserved. Save the profile to publish changes.

## Backend

The `cook-statistics` Edge Function is deployed and intentionally public: it validates a cook UUID and returns four counts only for an approved public cook. Its gateway JWT check is disabled for guest access. It calls `get_cook_public_statistics(uuid)` using a server-side service key. The SQL function uses `SECURITY INVOKER`, and direct execution is granted only to `service_role`.

The generated migration `20261006120131_cook_public_statistics.sql` records the SQL deployed to the live project. Follow/save RLS policies remain unchanged. The service role receives only the columns needed for counting/joining; it does not receive save-owner IDs. Indexes support creator, recipe-save and follower lookups.

Recipe saves count rows linked to currently approved recipes. Guest device-only saves and bundled demo recipes cannot be attributed to a database cook and are excluded. This is a current save count, not a cumulative historical analytics measure. Counts refresh when profiles load, and follower counts refresh after follow/unfollow. Query errors show unavailable/retry states rather than fabricated zeros.

## Verification

- `npm run test:cook-profile`: URL normalization, unsafe-link rejection, public endpoint validation and aggregate response shape.
- `npm run test:nutrition`: retained nutrition regression tests.
- Production build and ESLint for touched files.
- Live anonymous endpoint checks: approved cook returns counts; unknown cook returns 404; malformed ID returns 400.
- Live RLS and privilege checks confirm follows/saves are owner-only and aggregate RPC execution is server-only.
- Isolated interface checks use test data for public/guest profiles, private following, form saving, photo URL controls, mobile layout and Arabic labels.

The frontend source changes are local; the SQL and statistics endpoint are live. No photos, profiles, or follows belonging to users were changed during testing.
