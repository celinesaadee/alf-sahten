import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const LOCAL_STORAGE_KEY = "alf-sahten-kitchen";

function getLocalKitchen(): string[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY) || "[]",
    );

    return Array.isArray(stored)
      ? stored.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function useKitchenIngredients() {
  const { user, loading: authLoading } = useAuth();

  const [ingredients, setIngredients] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadKitchen() {
      if (authLoading) {
        return;
      }

      setLoading(true);

      const localIngredients =
        getLocalKitchen();

      // Signed-out users keep using localStorage.
      if (!user) {
        if (!cancelled) {
          setIngredients(localIngredients);
          setLoading(false);
        }

        return;
      }

      // Signed-in users load their kitchen from Supabase.
      const { data, error } = await supabase
        .from("kitchen_ingredients")
        .select("ingredient_name")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Could not load kitchen ingredients:",
          error,
        );

        if (!cancelled) {
          setIngredients(localIngredients);
          setLoading(false);
        }

        return;
      }

      const remoteIngredients =
        data?.map(
          (row) => row.ingredient_name,
        ) ?? [];

      // Move ingredients saved before login
      // into the signed-in account.
      const missingLocalIngredients =
        localIngredients.filter(
          (localIngredient) =>
            !remoteIngredients.some(
              (remoteIngredient) =>
                remoteIngredient
                  .trim()
                  .toLowerCase() ===
                localIngredient
                  .trim()
                  .toLowerCase(),
            ),
        );

      if (missingLocalIngredients.length > 0) {
        const rows =
          missingLocalIngredients.map(
            (ingredient) => ({
              user_id: user.id,
              ingredient_name:
                ingredient.trim(),
            }),
          );

        const { error: migrationError } =
          await supabase
            .from("kitchen_ingredients")
            .insert(rows);

        if (migrationError) {
          console.error(
            "Could not migrate local kitchen:",
            migrationError,
          );
        }
      }

      const mergedIngredients = [
        ...remoteIngredients,
      ];

      missingLocalIngredients.forEach(
        (ingredient) => {
          const exists =
            mergedIngredients.some(
              (existing) =>
                existing
                  .trim()
                  .toLowerCase() ===
                ingredient
                  .trim()
                  .toLowerCase(),
            );

          if (!exists) {
            mergedIngredients.push(
              ingredient.trim(),
            );
          }
        },
      );

      if (!cancelled) {
        setIngredients(mergedIngredients);
        setLoading(false);
      }

      localStorage.removeItem(
        LOCAL_STORAGE_KEY,
      );
    }

    loadKitchen();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  async function addIngredient(
    ingredient: string,
  ) {
    const cleanIngredient =
      ingredient.trim();

    if (!cleanIngredient) {
      return;
    }

    const alreadyExists =
      ingredients.some(
        (existing) =>
          existing.toLowerCase() ===
          cleanIngredient.toLowerCase(),
      );

    if (alreadyExists) {
      return;
    }

// Signed-out user
if (!user) {
  setIngredients((current) => {
    const nextIngredients =
      current.filter(
        (item) =>
          item.toLowerCase() !==
          ingredient.toLowerCase(),
      );

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(nextIngredients),
    );

    return nextIngredients;
  });

  return;
}

    // Signed-in user
    const { error } = await supabase
      .from("kitchen_ingredients")
      .insert({
        user_id: user.id,
        ingredient_name:
          cleanIngredient,
      });

    if (error) {
      console.error(
        "Could not add ingredient:",
        error,
      );

      return;
    }

    setIngredients((current) => [
      ...current,
      cleanIngredient,
    ]);
  }

  async function removeIngredient(
    ingredient: string,
  ) {
    // Signed-out user
    if (!user) {
      const nextIngredients =
        ingredients.filter(
          (item) =>
            item.toLowerCase() !==
            ingredient.toLowerCase(),
        );

      setIngredients(nextIngredients);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(nextIngredients),
      );

      return;
    }

    // Signed-in user
    const { error } = await supabase
      .from("kitchen_ingredients")
      .delete()
      .eq("user_id", user.id)
      .eq(
        "ingredient_name",
        ingredient,
      );

    if (error) {
      console.error(
        "Could not remove ingredient:",
        error,
      );

      return;
    }

    setIngredients((current) =>
      current.filter(
        (item) =>
          item.toLowerCase() !==
          ingredient.toLowerCase(),
      ),
    );
  }

  return {
    ingredients,
    loading,
    addIngredient,
    removeIngredient,
  };
}