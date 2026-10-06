import { supabase } from "../lib/supabase";

export type PublicCookProfile = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  location: string | null;
  cook_type: string | null;
  specialties: string[] | null;
  instagram_url: string | null;
  website_url: string | null;
  follower_count: number | null;
  recipe_count: number | null;
};

export async function getPublicCookProfile(
  username: string,
) {
  const { data, error } = await supabase
    .from("public_cook_profiles")
    .select(
      `
        user_id,
        display_name,
        username,
        profile_image_url,
        cover_image_url,
        bio,
        location,
        cook_type,
        specialties,
        instagram_url,
        website_url,
        follower_count,
        recipe_count
      `,
    )
    .eq("username", username)
    .eq("is_approved", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Error loading public cook profile:",
      error,
    );

    throw error;
  }

  return data as PublicCookProfile | null;
}

export async function getPublishedCookRecipes(
  userId: string,
  language?: "en" | "fr" | "ar",
) {
  const {
    data: recipes,
    error: recipesError,
  } = await supabase
    .from("recipes")
    .select(
      "id, creator_id, title, description, category, tags, image_url, prep_minutes, cook_minutes, servings, ingredients, instructions, original_language, status, published_at, created_at, updated_at",
    )
    .eq("creator_id", userId)
    .eq("status", "approved")
    .order("published_at", {
      ascending: false,
    });

  if (recipesError) {
    console.error(
      "Error loading cook recipes:",
      recipesError,
    );

    throw recipesError;
  }

  if (!recipes || recipes.length === 0) {
    return [];
  }

  if (!language) {
    return recipes;
  }

  const recipeIdsNeedingTranslation =
    recipes
      .filter(
        (recipe) =>
          recipe.original_language !== language,
      )
      .map((recipe) => recipe.id);

  if (
    recipeIdsNeedingTranslation.length === 0
  ) {
    return recipes;
  }

  const {
    data: translations,
    error: translationsError,
  } = await supabase
    .from("recipe_translations")
    .select(
      "recipe_id, title, description, ingredients, instructions, source_updated_at",
    )
    .eq("language", language)
    .eq("review_status", "approved")
    .in(
      "recipe_id",
      recipeIdsNeedingTranslation,
    );

  if (translationsError) {
    console.error(
      "Error loading cook recipe translations:",
      translationsError,
    );

    return recipes;
  }

  const translationMap = new Map(
    (translations ?? []).map(
      (translation) => [
        translation.recipe_id,
        translation,
      ],
    ),
  );

  return recipes.map((recipe) => {
    if (
      recipe.original_language === language
    ) {
      return recipe;
    }

    const translation =
      translationMap.get(recipe.id);

    if (!translation || Date.parse(translation.source_updated_at) !== Date.parse(recipe.updated_at)) {
      return recipe;
    }

    return {
      ...recipe,
      title: translation.title,
      description:
        translation.description,
      ingredients:
        translation.ingredients,
      instructions:
        translation.instructions,
    };
  });
}

export async function isFollowingCook(
  cookId: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("cook_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("cook_id", cookId)
    .maybeSingle();

  if (error) {
    console.error(
      "Error checking cook follow:",
      error,
    );

    throw error;
  }

  return Boolean(data);
}

export async function followCook(
  cookId: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to follow a cook.",
    );
  }

  if (user.id === cookId) {
    throw new Error(
      "You cannot follow yourself.",
    );
  }

  const { error } = await supabase
    .from("cook_follows")
    .insert({
      follower_id: user.id,
      cook_id: cookId,
    });

  // A second tab may already have followed the same cook.
  if (error && error.code !== "23505") {
    console.error(
      "Error following cook:",
      error,
    );

    throw error;
  }
}

export async function unfollowCook(
  cookId: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to unfollow a cook.",
    );
  }

  const { error } = await supabase
    .from("cook_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("cook_id", cookId);

  if (error) {
    console.error(
      "Error unfollowing cook:",
      error,
    );

    throw error;
  }
}

export async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id ?? null;
}

// Save only the selected photo; other profile edits stay in the form until saved.
export async function saveCookPhoto(field: "profile" | "cover", url: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in to save your photo");
  const column = field === "profile" ? "profile_image_url" : "cover_image_url";
  const { data, error } = await supabase.from("cook_profiles")
    .update({ [column]: url }).eq("user_id", user.id).select(column).single();
  if (error) throw error;
  if (!data) throw new Error("Photo was not saved");
}
