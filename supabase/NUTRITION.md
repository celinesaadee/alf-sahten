# Ingredient nutrition estimates

The recipe editor can look up ingredient nutrition in USDA FoodData Central, convert food-specific portions to grams, and sum seven nutrients per serving. Cooks review suggested foods, edible weights, and raw/cooked preparations before applying the estimate. Values remain editable. Missing USDA nutrients remain blank; explicitly excluded ingredients mark the result as incomplete. Changing ingredients or servings requires recalculation or explicitly keeping manual values before saving.

## Activate

1. Obtain a free key from https://fdc.nal.usda.gov/api-key-signup/.
2. Open the Alf Sahten project's Edge Function Secrets: https://supabase.com/dashboard/project/ixsdehujvfncqsxqhsfb/functions/secrets.
3. Add `USDA_FDC_API_KEY` with the key as its value and save. Do not use a `VITE_` variable, commit the key, or place it in client code.
4. In Create/Edit Recipe, fill ingredients and servings, then select **Calculate from ingredients**. Review matches and grams, then **Use estimate** and save the recipe.

The `nutrition-foods` Edge Function is deployed. Adding the secret takes effect without redeployment. Recipe data uses the existing `recipes.nutrition` JSONB column; no additional migration is needed. The JSON also stores `source`, `basis`, and `excludedIngredients` so the editor can detect stale estimates and the public recipe can label estimates.

## Behaviour and limits

- The function verifies the bearer token with Supabase Auth and rejects missing, invalid, and anonymous sessions. Gateway JWT verification is disabled because authentication is performed in the handler, following the project's existing pattern and supporting signing-key changes.
- FoodData Central generic foods (Foundation, SR Legacy, FNDDS) are searched; branded products are not included. Search results are suggestions, not guaranteed matches. Common Arabic/French aliases are supported; other names may need an English search.
- Each uncached ingredient search uses up to two USDA requests: search and full food details. USDA's default limit is 1,000 requests/hour/IP. The function uses a bounded, per-instance cache and a best-effort limit of 60 uncached searches/hour/user. These are not a distributed rate limiter.
- Mass units and fractional/Arabic quantities are supported. Household measures require USDA portion weights or manual grams; volume is never assumed equal to weight. Use edible ingredient weights and the corresponding preparation. Cooking losses and discarded oil/water are not modelled automatically.
- Manual nutrition entry works even when the API is unavailable or the key has not been configured. No paid nutrition API or AI model is required; normal hosting usage still applies.

## Verify

Run `node --test tests/nutrition.test.cjs`, `npm run build`, and ESLint for the touched TypeScript files. Tests cover quantity parsing, portion conversion, complete and missing nutrient totals, stale-estimate signatures, USDA normalization, authentication, validation, caching, and upstream errors. Real authenticated lookups need the USDA secret.

Sources: https://fdc.nal.usda.gov/api-guide/ and https://supabase.com/docs/guides/functions/secrets.
