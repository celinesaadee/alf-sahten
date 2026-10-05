export const RECIPE_TAGS = ["vegetarian", "quick-meals", "budget-friendly", "one-pot"] as const;
export type RecipeTag = typeof RECIPE_TAGS[number];
export function isRecipeTag(value: unknown): value is RecipeTag {
  return RECIPE_TAGS.some(tag => tag === value);
}
export function normalizeRecipeTags(value: unknown): RecipeTag[] {
  return Array.isArray(value) ? [...new Set(value.filter(isRecipeTag))] : [];
}
