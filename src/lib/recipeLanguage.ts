export type RecipeLanguage = "en" | "fr" | "ar";

// Conservative hints for supported recipe languages, not a general language ID
// service. Ambiguous/unsupported captions require the Cook's explicit choice.
const english = new Set("the and with into then until add mix bake cook stir pour combine heat serve flour sugar water butter eggs cup cups tablespoon tablespoons teaspoon teaspoons minutes oven ingredients instructions".split(" "));
const french = new Set("le la les des du une et avec dans puis jusqu ajoutez melangez cuire faites versez chauffez servez farine sucre eau beurre oeufs tasse tasses cuillere cuilleres four recette preparation melanger cuisson".split(" "));

export function detectRecipeLanguage(caption: string): RecipeLanguage | null {
  const text = caption.replace(/https?:\/\/\S+/giu, " ")
    .replace(/[@#][\p{L}\p{N}_]+/gu, " ");
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length < 20) return null;
  const arabic = letters.filter(letter => /\p{Script=Arabic}/u.test(letter)).length;
  // Persian/Urdu-specific letters are not evidence for supported Arabic.
  if (arabic / letters.length >= 0.65 && !/[پچژگٹڈڑںھے]/u.test(text)) return "ar";
  if (arabic / letters.length >= 0.15) return null;
  const latin = letters.filter(letter => /\p{Script=Latin}/u.test(letter)).length;
  if (latin / letters.length < 0.85) return null;
  const words = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/œ/g, "oe").match(/[a-z]+/g) ?? [];
  if (words.length < 6) return null;
  const distinct = new Set(words);
  const en = [...distinct].filter(word => english.has(word)).length;
  const fr = [...distinct].filter(word => french.has(word)).length;
  if (en >= 3 && en >= Math.max(1, fr) * 2.5) return "en";
  if (fr >= 3 && fr >= Math.max(1, en) * 2.5) return "fr";
  return null;
}
