import { supabase } from "../lib/supabase";
import type { NutritionFood } from "../lib/nutrition";

export async function searchNutritionFoods(query: string): Promise<NutritionFood[]> {
  const { data, error } = await supabase.functions.invoke("nutrition-foods", { body: { query } });
  if (error) {
    let code = "lookupFailed";
    if (error.context instanceof Response) {
      try { code = (await error.context.json()).code ?? code; } catch { /* Keep the generic error. */ }
    }
    throw new Error(code);
  }
  if (!Array.isArray(data?.foods)) throw new Error("lookupFailed");
  return data.foods;
}
