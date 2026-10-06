import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateNutrition, ingredientGrams, nutrientKeys, nutritionSearchTerm, parseNutritionQuantity,
  type NutritionFood, type NutritionIngredient, type NutrientValues,
} from "../lib/nutrition";
import { searchNutritionFoods } from "../services/nutrition";
import "./NutritionCalculator.css";

type Row = {
  ingredient: NutritionIngredient;
  query: string;
  foods: NutritionFood[];
  selected: number | null;
  grams: string;
  excluded: boolean;
  loading: boolean;
  error: string | null;
};
type Props = {
  ingredients: NutritionIngredient[];
  servings: string;
  disabled: boolean;
  onApply: (values: NutrientValues, excluded: number) => void;
};

export default function NutritionCalculator({ ingredients, servings, disabled, onApply }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [applied, setApplied] = useState(false);
  const generation = useRef(0);
  const tokens = useRef(new Map<number, number>());
  useEffect(() => () => { generation.current++; }, []);
  const servingCount = Number(servings);
  const usable = ingredients.filter(item => item.ingredient.trim() || item.quantity.trim() || item.unit.trim());
  const loading = rows.some(row => row.loading);
  const validServings = Number.isFinite(servingCount) && servingCount >= 1;

  function updateRow(index: number, change: Partial<Row>) {
    setApplied(false);
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...change } : row));
  }

  async function lookup(index: number, ingredient: NutritionIngredient, query: string) {
    const currentGeneration = generation.current;
    const token = (tokens.current.get(index) ?? 0) + 1;
    tokens.current.set(index, token);
    const isCurrent = () => generation.current === currentGeneration && tokens.current.get(index) === token;
    updateRow(index, { loading: true, error: null, selected: null, foods: [], grams: "" });
    try {
      const foods = await searchNutritionFoods(query);
      if (!isCurrent()) return;
      const selected = foods[0];
      const grams = ingredientGrams(ingredient, selected);
      updateRow(index, { foods, selected: selected?.id ?? null, grams: grams === null ? "" : String(grams), loading: false });
    } catch (error) {
      if (isCurrent()) updateRow(index, { loading: false, error: error instanceof Error ? error.message : "lookupFailed" });
    }
  }

  async function start() {
    setApplied(false);
    generation.current++;
    tokens.current.clear();
    const initial: Row[] = usable.map(ingredient => ({
      ingredient, query: nutritionSearchTerm(ingredient.ingredient), foods: [], selected: null,
      grams: "", excluded: false, loading: true, error: null,
    }));
    setRows(initial);
    const currentGeneration = generation.current;
    let next = 0;
    async function worker() {
      while (next < initial.length && generation.current === currentGeneration) {
        const index = next++;
        await lookup(index, initial[index].ingredient, initial[index].query);
      }
    }
    await Promise.all([worker(), worker()]);
  }

  const included = rows.filter(row => !row.excluded);
  const ready = validServings && !loading && included.length > 0 && included.every(row =>
    row.foods.some(food => food.id === row.selected) && Number.isFinite(Number(row.grams)) && Number(row.grams) > 0);
  let estimate: NutrientValues | null = null;
  if (ready) {
    try {
      estimate = calculateNutrition(included.map(row => ({
        food: row.foods.find(food => food.id === row.selected)!, grams: Number(row.grams),
      })), servingCount);
    } catch { /* Invalid or overflowing amounts keep Apply disabled. */ }
  }
  const exclusions = rows.filter(row => row.excluded).length;
  const hasValues = estimate && Object.keys(estimate).length > 0;

  return (
    <div className="nutrition-calculator">
      <p>{t("nutritionCalculator.intro")}</p>
      <button type="button" className="nutrition-calculate-button" disabled={disabled || loading || !validServings || usable.length === 0}
        onClick={() => void start()}>
        {t(loading ? "nutritionCalculator.searching" : "nutritionCalculator.calculate")}
      </button>
      {!validServings && <p>{t("nutritionCalculator.servingsRequired")}</p>}
      {usable.length === 0 && <p>{t("nutritionCalculator.ingredientsRequired")}</p>}
      {rows.length > 0 && <>
        <p>{t("nutritionCalculator.review")}</p>
        <div className="nutrition-match-list">
          {rows.map((row, index) => {
            const food = row.foods.find(item => item.id === row.selected);
            return (
              <div key={index} className="nutrition-match">
                <strong>{[row.ingredient.quantity, row.ingredient.unit, row.ingredient.ingredient].filter(Boolean).join(" ")}</strong>
                <label className="nutrition-exclude">
                  <input type="checkbox" checked={row.excluded} disabled={disabled || row.loading}
                    onChange={event => updateRow(index, { excluded: event.target.checked })} />
                  {t("nutritionCalculator.exclude")}
                </label>
                {!row.excluded && <>
                  <div className="nutrition-search-row">
                    <label className="recipe-field">
                      <span>{t("nutritionCalculator.searchLabel")}</span>
                      <input value={row.query} maxLength={120} disabled={disabled || row.loading}
                        onChange={event => updateRow(index, { query: event.target.value, selected: null, foods: [], grams: "", error: null })} />
                    </label>
                    <button type="button" disabled={disabled || row.loading || row.query.trim().length < 2}
                      onClick={() => void lookup(index, row.ingredient, row.query)}>{t("nutritionCalculator.search")}</button>
                  </div>
                  {row.loading && <p role="status">{t("nutritionCalculator.searching")}</p>}
                  {row.error && <p role="alert">{t(`nutritionCalculator.${row.error}`, { defaultValue: t("nutritionCalculator.lookupFailed") })}</p>}
                  {!row.loading && !row.error && row.foods.length === 0 && <p>{t("nutritionCalculator.noMatch")}</p>}
                  {row.foods.length > 0 && <div className="nutrition-match-fields">
                    <label className="recipe-field">
                      <span>{t("nutritionCalculator.foodMatch")}</span>
                      <select value={row.selected ?? ""} disabled={disabled}
                        onChange={event => {
                          const selected = row.foods.find(item => item.id === Number(event.target.value));
                          const grams = ingredientGrams(row.ingredient, selected);
                          updateRow(index, { selected: selected?.id ?? null, grams: grams === null ? "" : String(grams) });
                        }}>
                        {row.foods.map(item => <option key={item.id} value={item.id}>{item.description}</option>)}
                      </select>
                    </label>
                    <label className="recipe-field">
                      <span>{t("nutritionCalculator.grams")}</span>
                      <input type="number" min="0" step="any" value={row.grams} disabled={disabled}
                        onChange={event => updateRow(index, { grams: event.target.value })} />
                    </label>
                    {food && food.portions.length > 0 && <label className="recipe-field">
                      <span>{t("nutritionCalculator.portion")}</span>
                      <select value="" disabled={disabled || parseNutritionQuantity(row.ingredient.quantity) === null}
                        onChange={event => {
                          if (event.target.value === "") return;
                          const portion = food.portions[Number(event.target.value)];
                          const quantity = parseNutritionQuantity(row.ingredient.quantity)!;
                          updateRow(index, { grams: String(Math.round(quantity * portion.grams / portion.amount * 100) / 100) });
                        }}>
                        <option value="">{t("nutritionCalculator.choosePortion")}</option>
                        {food.portions.map((portion, portionIndex) => <option key={portionIndex} value={portionIndex}>
                          {portion.label} ({portion.grams} g)
                        </option>)}
                      </select>
                    </label>}
                  </div>}
                </>}
              </div>
            );
          })}
        </div>
        {exclusions > 0 && <p role="status">{t("nutritionCalculator.excludedWarning", { count: exclusions })}</p>}
        {!ready && !loading && <p>{t("nutritionCalculator.resolve")}</p>}
        {estimate && <>
          <p>{t("nutritionCalculator.preview", { count: servingCount })}</p>
          <dl className="nutrition-preview">
            {nutrientKeys.map(key => <div key={key}>
              <dt>{t(`recipeEditor.${key}`)}</dt>
              <dd>{estimate[key] ?? t("nutritionCalculator.unknown")}</dd>
            </div>)}
          </dl>
          {nutrientKeys.some(key => estimate[key] === undefined) && <p>{t("nutritionCalculator.missingData")}</p>}
        </>}
        <button type="button" className="nutrition-calculate-button" disabled={disabled || !hasValues}
          onClick={() => { if (estimate) { onApply(estimate, exclusions); setApplied(true); } }}>
          {t("nutritionCalculator.apply")}
        </button>
        {applied && <p role="status">{t("nutritionCalculator.applied")}</p>}
      </>}
      <p className="nutrition-attribution"><a href="https://fdc.nal.usda.gov/" target="_blank" rel="noreferrer">USDA FoodData Central</a></p>
    </div>
  );
}
