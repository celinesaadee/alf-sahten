export type IngredientMention = { text: string; ingredient: boolean };

// Match complete ingredient names, longest first, without rewriting step text.
// Unicode boundaries avoid highlighting "ham" inside "champignon", for example.
export function ingredientMentions(text: string, ingredients: string[]): IngredientMention[] {
  const names = [...new Set(ingredients.map(name => name.trim()).filter(name => /\p{L}/u.test(name)))]
    .sort((a, b) => b.length - a.length);
  if (!names.length || !text) return [{ text, ingredient: false }];
  const escaped = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
  const matcher = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${escaped.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  const pieces: IngredientMention[] = [];
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    const start = match.index!;
    if (start > cursor) pieces.push({ text: text.slice(cursor, start), ingredient: false });
    pieces.push({ text: match[0], ingredient: true });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) pieces.push({ text: text.slice(cursor), ingredient: false });
  return pieces;
}
