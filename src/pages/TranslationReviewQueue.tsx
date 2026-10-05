import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import "./TranslationReviewPage.css";

type QueueRecipe = { id: string; title: string; original_language: string; recipe_translations: { language: string; review_status: string }[] };
export default function TranslationReviewQueue() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<QueueRecipe[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void supabase.from("recipes").select("id, title, original_language, recipe_translations(language, review_status)")
      .eq("status", "approved").order("published_at", { ascending: false }).then(result => {
        if (!cancelled) { setError(Boolean(result.error)); setRows(result.data ?? []); }
      });
    return () => { cancelled = true; };
  }, []);
  return <main className="translation-review">
    <Link to="/admin/recipes">{t("adminRecipeReview.title", "Recipes")}</Link>
    <h1>{t("translationReview.review")}</h1>
    {error ? <p role="alert">{t("home.recipesError", "Could not load recipes.")}</p> : rows === null ? <p role="status">{t("common.loading", "Loading…")}</p> : rows.length === 0 ? <p>{t("home.noPublishedRecipes")}</p> : rows.map(recipe => <article key={recipe.id}>
      <h2><Link to={`/cook/recipes/${recipe.id}/translations`}>{recipe.title}</Link></h2>
      <p>{["en", "fr", "ar"].map(language => `${language.toUpperCase()} ${language === recipe.original_language ? "✓" : recipe.recipe_translations.some(row => row.language === language && row.review_status === "approved") ? "✓" : "…"}`).join(" · ")}</p>
    </article>)}
  </main>;
}
