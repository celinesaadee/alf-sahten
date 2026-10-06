export const nutrientKeys = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium"] as const;
export type NutrientKey = typeof nutrientKeys[number];
export type NutrientValues = Partial<Record<NutrientKey, number>>;
export type NutritionIngredient = { ingredient: string; quantity: string; unit: string };
export type FoodPortion = { label: string; amount: number; grams: number };
export type NutritionFood = {
  id: number;
  description: string;
  nutrients: NutrientValues;
  portions: FoodPortion[];
};

const fractions: Record<string, string> = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4",
  "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

export function parseNutritionQuantity(value: string): number | null {
  const normalized = value.trim()
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٫,]/g, ".")
    .replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, fraction => ` ${fractions[fraction]}`)
    .trim();
  let result: number;
  const mixed = normalized.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    if (Number(mixed[3]) === 0) return null;
    result = Number(mixed[1] ?? 0) + Number(mixed[2]) / Number(mixed[3]);
  } else if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    result = Number(normalized);
  } else {
    return null;
  }
  return Number.isFinite(result) && result > 0 ? result : null;
}

const massUnits: Record<string, number> = {
  g: 1, gram: 1, grams: 1, gramme: 1, grammes: 1, غ: 1, غرام: 1, غرامات: 1, جرام: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000, kilogramme: 1000, kilogrammes: 1000, كغ: 1000, كغم: 1000, كيلو: 1000, كيلوغرام: 1000,
  mg: 0.001, milligram: 0.001, milligrams: 0.001, ملغ: 0.001,
  oz: 28.349523125, ounce: 28.349523125, ounces: 28.349523125, أونصة: 28.349523125,
  lb: 453.59237, lbs: 453.59237, pound: 453.59237, pounds: 453.59237, رطل: 453.59237,
};

const portionUnits: Record<string, string> = {
  cups: "cup", tasse: "cup", tasses: "cup", كوب: "cup", أكواب: "cup",
  tbsp: "tablespoon", tablespoons: "tablespoon", "c. à soupe": "tablespoon", "ملعقة كبيرة": "tablespoon",
  tsp: "teaspoon", teaspoons: "teaspoon", "c. à café": "teaspoon", "ملعقة صغيرة": "teaspoon",
  cloves: "clove", gousse: "clove", gousses: "clove", فص: "clove",
};

export function ingredientGrams(ingredient: NutritionIngredient, food?: NutritionFood): number | null {
  const quantity = parseNutritionQuantity(ingredient.quantity);
  if (quantity === null) return null;
  const unit = ingredient.unit.trim().toLowerCase().replace(/\.$/, "");
  if (massUnits[unit]) return quantity * massUnits[unit];
  // Use food-specific USDA portions; never assume a cup or ml weighs a gram.
  if (!unit || !food) return null;
  const portionUnit = portionUnits[unit] ?? unit;
  const matches = food.portions.filter(portion =>
    portion.label.toLowerCase().split(/[\s,()]+/).some(token => (portionUnits[token] ?? token) === portionUnit));
  // Different preparations may have different weights. Ask the cook if ambiguous.
  if (matches.length !== 1) return null;
  return quantity * matches[0].grams / matches[0].amount;
}

export function nutritionBasis(ingredients: NutritionIngredient[], servings: string | number): string {
  return JSON.stringify({
    servings: Number(servings),
    ingredients: ingredients.filter(item => item.ingredient.trim() || item.quantity.trim() || item.unit.trim())
      .map(item => [item.ingredient.trim(), item.quantity.trim(), item.unit.trim()]),
  });
}

export function calculateNutrition(items: { food: NutritionFood; grams: number }[], servings: number): NutrientValues {
  if (!Number.isFinite(servings) || servings < 1 || items.length === 0 ||
      items.some(item => !Number.isFinite(item.grams) || item.grams <= 0)) {
    throw new Error("Invalid quantities or servings");
  }
  const result: NutrientValues = {};
  for (const key of nutrientKeys) {
    // Missing data is unknown, not zero. Only total nutrients known for every food.
    if (items.every(item => typeof item.food.nutrients[key] === "number" &&
        Number.isFinite(item.food.nutrients[key]) && item.food.nutrients[key]! >= 0)) {
      const total = items.reduce((sum, item) => sum + item.food.nutrients[key]! * item.grams / 100, 0) / servings;
      if (!Number.isFinite(total)) throw new Error("Nutrition total is too large");
      result[key] = Math.round(total * (key === "calories" || key === "sodium" ? 1 : 10)) /
        (key === "calories" || key === "sodium" ? 1 : 10);
    }
  }
  return result;
}

// Exact aliases help common Arabic/French searches without guessing preparation.
const foodAliases: Record<string, string> = {
  أرز: "rice", رز: "rice", riz: "rice", دجاج: "chicken", poulet: "chicken",
  "صدر دجاج": "chicken breast", "blanc de poulet": "chicken breast",
  بصل: "onion", oignon: "onion", oignons: "onion", ثوم: "garlic", ail: "garlic",
  طماطم: "tomato", بندورة: "tomato", tomate: "tomato", tomates: "tomato",
  "زيت زيتون": "olive oil", "huile d'olive": "olive oil", "huile d’olive": "olive oil",
  زبدة: "butter", beurre: "butter", حليب: "milk", lait: "milk",
  بيض: "egg", oeuf: "egg", œuf: "egg", oeufs: "egg", œufs: "egg",
  سكر: "sugar", sucre: "sugar", ملح: "salt", sel: "salt",
  حمص: "chickpeas", "pois chiches": "chickpeas", عدس: "lentils", lentilles: "lentils",
  بطاطا: "potato", بطاطس: "potato", "pommes de terre": "potato",
  طحين: "flour", دقيق: "flour", farine: "flour", ليمون: "lemon", citron: "lemon",
};

export function nutritionSearchTerm(name: string): string {
  const normalized = name.trim().toLowerCase();
  return foodAliases[normalized] ?? name.trim();
}
