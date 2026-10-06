# Alf Sahten — combined to-do list

Updated 6 October 2026. Combines the previous repository launch checklist with the priorities agreed in this chat. Implemented UI items still need final review with live data.

## 1. Fix and verify the foundations first

- [ ] Resolve the guest recipe access error so public recipes load on Home, Discover, and cook profiles. Confirm only approved public recipes are exposed.
- [ ] Verify the Nutrition JSX uses the existing circle and pill classes, and check the rendered layout with real nutrition data.
- [ ] Test recipe submission, editing, approval, and nutrition values from end to end.
- [ ] Test Follow / Following and unfollow with a second account, including follower counts and the hidden self-follow button. (Previous checklist.)
- [ ] Verify cook and admin route protection against the live Supabase project with signed-out, regular, pending cook, approved cook, and admin accounts. (Previous checklist.)

## 2. Improve the recipe page

- [ ] Organize existing actions into a clear Save, Shopping list, Cook, and Share row; implement any missing actions.
- [ ] Improve ingredient spacing, bold quantities, checkboxes, serving controls, and unit conversion.
- [ ] Review step-by-step cooking on mobile; add timers where the instructions support them.
- [ ] Polish the existing cooked status and private notes controls.
- [ ] Verify per-serving nutrition and nutrition calculation, including incomplete ingredient data.
- [ ] Make the cook attribution easy to find and open.

## 3. Improve Discover and cook profiles

- [ ] Add “Today’s table”: a real featured recipe with cook, cooking time, and save/share actions.
- [ ] Add useful quick filters: under 30 minutes, Lebanese classics, vegetarian, budget meals, and one pot. Back each filter with actual recipe data.
- [ ] Add a cook discovery row with portraits, specialties, and profile links.
- [ ] Add popularity sections only when real usage data supports them; do not invent counts or rankings.
- [ ] Review recipe cards on Home, Discover, Saved, My Kitchen, and public cook profiles with populated data, long titles, and missing photos.
- [ ] Check the three-column phone layout for readability and usable touch targets; adjust where needed.
- [ ] Finish live review of public cook Follow / Following styling. (Previous checklist; styling implemented.)

## 4. Improve saved recipes and collections

- [ ] Add photo collage covers to collections using their own saved recipes.
- [ ] Improve collection creation, recipe assignment, search, and sorting.
- [ ] Add original illustrated empty states with a useful next action.
- [ ] Confirm saved recipes and collections persist correctly for each account.

## 5. Build connected meal planning and groceries

- [ ] Add a weekly planner with recipes assigned to days and editable servings.
- [ ] Generate a shopping list from selected recipes and combine compatible ingredient quantities.
- [ ] Let users exclude ingredients already in My Kitchen and review the list before saving.
- [ ] Add manual grocery items, purchased checkboxes, and clear/reset controls.
- [ ] Consider optional planning reminders after a working delivery mechanism exists.

## 6. Polish account, settings, and welcome

- [ ] Group settings into Account, Language, Cooking preferences, and Notifications, showing only supported controls.
- [ ] Review account editing, password reset, and sign-out flows.
- [ ] Test welcome skip, back, sign-in, first-visit persistence, and entry routes in English, French, and Arabic.
- [ ] Review illustration animation, reduced-motion behavior, and keyboard accessibility.
- [ ] Keep original wording and artwork, warm cream backgrounds, green accents, and one logo per header.

## Implemented in this chat

- [x] Supplied logo and favicon added; branding source files preserved.
- [x] Warm cream backgrounds restored with green accents.
- [x] Public cook profile centered, social links made round, and recipe search added.
- [x] Recipe listing styles updated with tall rounded photos, lighter cards, and three columns.
- [x] Original three-step welcome added in English, French, and Arabic, with browser persistence and /welcome replay.
- [x] Welcome illustration given colorful accents and gentle animation with reduced-motion support.
- [x] Duplicate sign-in logo removed and large green panel replaced with cream.

## Final launch checks

- [ ] Test populated pages on phone and desktop in all three languages, including Arabic layout direction.
- [ ] Check loading, empty, error, and retry states separately.
- [ ] Run the production build and relevant tests after the final changes.
- [ ] Review production configuration and deployment before publishing.

## Later, after the core experience works

- [ ] Evaluate recipe substitutions and a cooking assistant with properly formatted responses.
- [ ] Evaluate wider recipe import support with attribution and user review before saving.
- [ ] Evaluate subscriptions only after pricing, billing, cancellation, and actual premium features are defined.

Do not reuse competitor artwork, photographs, wording, testimonials, or statistics. Preserve existing local edits and untracked branding/ and public/images/. Never use git add .
