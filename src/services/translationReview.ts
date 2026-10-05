import { supabase } from "../lib/supabase";

export type Language = "en" | "fr" | "ar";
export type TranslationContent = {
  title: string;
  description: string;
  ingredients: { quantity: string; unit: string; ingredient: string }[];
  instructions: { step: number; text: string }[];
};
export type Translation = TranslationContent & {
  id: string;
  language: Language;
  review_status: "pending" | "approved";
  updated_at: string;
};
export type ReviewRecipe = TranslationContent & {
  id: string;
  original_language: Language;
};

export async function loadTranslationReview(recipeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role").eq("id", user.id).single();
  if (profileError) throw profileError;
  const isAdmin = profile.role === "admin";
  let query = supabase.from("recipes").select("id, title, description, ingredients, instructions, original_language")
    .eq("id", recipeId).eq("status", "approved");
  if (!isAdmin) query = query.eq("creator_id", user.id);
  const { data: recipe, error } = await query.single();
  if (error) throw error;
  const { data: translations, error: translationError } = await supabase.from("recipe_translations")
    .select("id, language, title, description, ingredients, instructions, review_status, updated_at")
    .eq("recipe_id", recipeId);
  if (translationError) throw translationError;
  return { recipe: recipe as ReviewRecipe, translations: (translations ?? []) as Translation[], isAdmin };
}

export async function saveTranslation(row: Translation, content: TranslationContent, approve: boolean) {
  const { data, error } = await supabase.from("recipe_translations")
    .update({ title: content.title, description: content.description,
      ingredients: content.ingredients, instructions: content.instructions,
      review_status: approve ? "approved" : "pending" })
    .eq("id", row.id).eq("updated_at", row.updated_at)
    .select("id, language, title, description, ingredients, instructions, review_status, updated_at").single();
  if (error) throw new Error("Could not save. Reload to check whether this translation changed, then try again.");
  return data as Translation;
}
