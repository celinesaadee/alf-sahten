import { useEffect, useState } from "react";
import { getPublishedRecipes } from "../services/recipes";
import { useTranslation } from "react-i18next";

export type PublishedRecipe = {
  id: string;
  creator_id: string;

  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  image_url: string | null;

  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;

ingredients: Array<{
  quantity?: string;
  unit?: string;
  ingredient?: string;
}>;

original_ingredients?: Array<{
  quantity?: string;
  unit?: string;
  ingredient?: string;
}>;

instructions: Array<{
    step?: number;
    text?: string;
  }>;

  original_language: "en" | "fr" | "ar";

  status: "approved";
  published_at: string | null;
  created_at: string;

    cook: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    profile_image_url: string | null;
  } | null;
};

export function usePublishedRecipes() {
  const { i18n } = useTranslation();

const currentLanguage:
  "en" | "fr" | "ar" =
  i18n.resolvedLanguage?.startsWith("ar")
    ? "ar"
    : i18n.resolvedLanguage?.startsWith("fr")
      ? "fr"
      : "en";

  const [recipes, setRecipes] = useState<PublishedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);

        const data =
  await getPublishedRecipes(
    currentLanguage,
  );

        setRecipes(data as PublishedRecipe[]);
      } catch (err) {
        console.error("Could not load published recipes:", err);

        setError("We couldn't load the recipes.");
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [currentLanguage]);

  return {
    recipes,
    loading,
    error,
  };
}
