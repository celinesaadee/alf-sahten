import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const LOCAL_STORAGE_KEY = "alf-sahten-saved";

function getLocalSavedRecipes(): string[] {
  try {
    return JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY) || "[]",
    );
  } catch {
    return [];
  }
}

export function useSavedRecipes() {
  const { user, loading: authLoading } = useAuth();

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedRecipes() {
      if (authLoading) {
        return;
      }

      setLoading(true);

      const localSavedIds = getLocalSavedRecipes();

      // Signed-out users keep using localStorage.
      if (!user) {
        if (!cancelled) {
          setSavedIds(localSavedIds);
          setLoading(false);
        }

        return;
      }

      // Signed-in users load their saved recipes from Supabase.
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("recipe_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Could not load saved recipes:", error);

        if (!cancelled) {
          setSavedIds(localSavedIds);
          setLoading(false);
        }

        return;
      }

      const remoteSavedIds =
        data?.map((row) => row.recipe_id) ?? [];

      // If the user saved recipes before signing in,
      // move those local recipes into their account.
      const localIdsMissingFromSupabase =
        localSavedIds.filter(
          (recipeId) =>
            !remoteSavedIds.includes(recipeId),
        );

      if (localIdsMissingFromSupabase.length > 0) {
        const rowsToInsert =
          localIdsMissingFromSupabase.map(
            (recipeId) => ({
              user_id: user.id,
              recipe_id: recipeId,
            }),
          );

        const { error: migrationError } =
          await supabase
            .from("saved_recipes")
            .insert(rowsToInsert);

        if (migrationError) {
          console.error(
            "Could not migrate local saved recipes:",
            migrationError,
          );
        }
      }

      const mergedSavedIds = Array.from(
        new Set([
          ...remoteSavedIds,
          ...localIdsMissingFromSupabase,
        ]),
      );

      if (!cancelled) {
        setSavedIds(mergedSavedIds);
        setLoading(false);
      }

      // Once saved recipes belong to the signed-in account,
      // we no longer need the browser-only copy.
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    loadSavedRecipes();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function isSaved(recipeId: string) {
    return savedIds.includes(recipeId);
  }

  async function toggleSaved(recipeId: string) {
    const alreadySaved = savedIds.includes(recipeId);

    // Signed-out users still use localStorage.
    if (!user) {
      const nextSaved = alreadySaved
        ? savedIds.filter((id) => id !== recipeId)
        : [...savedIds, recipeId];

      setSavedIds(nextSaved);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(nextSaved),
      );

      return;
    }

    if (alreadySaved) {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);

      if (error) {
        console.error(
          "Could not remove saved recipe:",
          error,
        );

        return;
      }

      setSavedIds((current) =>
        current.filter((id) => id !== recipeId),
      );

      return;
    }

    const { error } = await supabase
      .from("saved_recipes")
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
      });

    if (error) {
      console.error(
        "Could not save recipe:",
        error,
      );

      return;
    }

    setSavedIds((current) => [
      ...current,
      recipeId,
    ]);
  }

  async function removeSaved(recipeId: string) {
    if (!user) {
      const nextSaved = savedIds.filter(
        (id) => id !== recipeId,
      );

      setSavedIds(nextSaved);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(nextSaved),
      );

      return;
    }

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error(
        "Could not remove saved recipe:",
        error,
      );

      return;
    }

    setSavedIds((current) =>
      current.filter((id) => id !== recipeId),
    );
  }

  return {
    savedIds,
    loading,
    isSaved,
    toggleSaved,
    removeSaved,
  };
}