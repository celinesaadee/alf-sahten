# Recipe translation review

Recipe approval still invokes `translate-recipe`. Generated rows are explicitly
`pending`; a database trigger also forces service-role writes back to pending.
Original recipe fields are never changed by translation review.

Approved Cooks open **My recipes → Review translations**. Admins open
**Recipe review → Review translations**, or the review link on a public recipe.
The original and original-language tab are read-only. Other language tabs allow
editing title, description, ingredient names/quantities/units and instruction text.
Save draft removes approval; Approve translation saves the reviewed content and
records reviewer/time. Missing languages can be generated/retried by admins.
Generation continues to skip current versions, preserving human corrections.

Public list/detail/Cook queries filter approved, current translations and fall
back to original content. Database SELECT policies also hide pending/stale rows
from non-reviewers. Review updates use an updated_at comparison to reject stale
editor submissions. Browser grants prohibit changing identity/source/review audit
columns. Approval rejects translations for an outdated original.

## Existing live content

The migration preserves the two translations already public on 2026-10-05 as
legacy approvals. They have no reviewed_at/reviewed_by and must not be described
as human-reviewed. They remain visible until saved as drafts or regenerated.
Every newly generated version requires review. Original recipes remain available.

The migration file follows the existing consolidated backend backup in local
filename order. The hosted MCP migration history records `recipe_translation_review`
as version `20261005174506`; the consolidated older local migration also differs
from hosted history. Do not blindly push this backup directory as a fresh history
against production; reconcile migration versions first.

## Verification

- `npm run lint` and `npm run build` pass (existing bundle-size advisory remains).
- Live PostgreSQL transactions, all rolled back: service writes become pending;
  anon and unrelated Cook cannot read pending; unrelated Cook cannot approve;
  admin and recipe-owner Cook can edit/approve; approved versions become public;
  saving draft clears review audit; identity columns cannot be edited; stale
  source approval fails.
- Existing two legacy translations remain approved with no human-review audit.
- Security advisors reported no translation-review findings. Existing Instagram
  tables intentionally have no browser policies; existing application-moderation
  function and password-protection advisories are outside this change.
- Signed-out browser redirect to sign-in verified. Interactive signed-in editor,
  Arabic/mobile layout, and paid DeepL generation remain to be exercised with a
  signed-in account; no credentials were available in this session.

Hosted database migration and `translate-recipe` v5 were applied. The frontend
needs the normal app deployment before remote users can use the new editor.
