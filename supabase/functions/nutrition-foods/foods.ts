type FdcNutrient = { amount?: number; nutrient?: { id?: number; unitName?: string } };
type FdcFood = {
  fdcId: number;
  description: string;
  foodNutrients?: FdcNutrient[];
  foodPortions?: { amount?: number; gramWeight?: number; modifier?: string; portionDescription?: string; measureUnit?: { name?: string } }[];
};

export function normalizeFood(food: FdcFood) {
  const nutrients: Record<string, number> = {};
  const mapping: Record<string, { ids: number[]; unit: string }> = {
    calories: { ids: [1008, 2048, 2047], unit: "KCAL" },
    protein: { ids: [1003], unit: "G" }, carbohydrates: { ids: [1005], unit: "G" },
    fat: { ids: [1004], unit: "G" }, fiber: { ids: [1079], unit: "G" },
    sugar: { ids: [2000, 1063], unit: "G" }, sodium: { ids: [1093], unit: "MG" },
  };
  for (const [key, { ids, unit }] of Object.entries(mapping)) {
    for (const id of ids) {
      const match = food.foodNutrients?.find(item => item.nutrient?.id === id &&
        item.nutrient.unitName?.toUpperCase() === unit && typeof item.amount === "number" &&
        Number.isFinite(item.amount) && item.amount >= 0);
      if (match) { nutrients[key] = match.amount!; break; }
    }
  }
  const portions = (food.foodPortions ?? []).filter(portion =>
    typeof portion.amount === "number" && Number.isFinite(portion.amount) && portion.amount > 0 &&
    typeof portion.gramWeight === "number" && Number.isFinite(portion.gramWeight) && portion.gramWeight > 0)
    .map(portion => {
      const measure = portion.measureUnit?.name;
      const label = portion.portionDescription || [
        portion.amount,
        measure && measure !== "undetermined" ? measure : "",
        portion.modifier ?? "",
      ].filter(Boolean).join(" ");
      return { label, amount: portion.amount!, grams: portion.gramWeight! };
    });
  return { id: food.fdcId, description: food.description, nutrients, portions };
}

export function isSearchQuery(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 120;
}
