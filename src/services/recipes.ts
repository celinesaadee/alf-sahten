import { supabase } from "../lib/supabase";

export async function getPublishedRecipes() {
  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
.select(
  "id, creator_id, title, description, category, image_url, prep_minutes, cook_minutes, servings, ingredients, instructions, original_language, status, published_at, created_at, updated_at",
)
.eq("status", "approved")
    .order("published_at", { ascending: false });

  if (recipesError) {
    console.error("Error loading recipes:", recipesError);
    throw recipesError;
  }

  if (!recipes || recipes.length === 0) {
    return [];
  }

  const creatorIds = [
    ...new Set(
      recipes.map((recipe) => recipe.creator_id),
    ),
  ];

  const { data: cooks, error: cooksError } = await supabase
    .from("public_cook_profiles")
    .select(
      "user_id, display_name, username, profile_image_url",
    )
    .in("user_id", creatorIds)
    .eq("is_approved", true);

  if (cooksError) {
    console.error("Error loading recipe cooks:", cooksError);
    throw cooksError;
  }

  const approvedCookMap = new Map(
    (cooks ?? []).map((cook) => [
      cook.user_id,
      cook,
    ]),
  );

  return recipes
    .filter((recipe) =>
      approvedCookMap.has(
        recipe.creator_id,
      ),
    )
    .map((recipe) => ({
      ...recipe,
      cook:
        approvedCookMap.get(
          recipe.creator_id,
        ) ?? null,
    }));
}

export async function getCookRecipes(userId: string) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading cook recipes:", error);
    throw error;
  }

  return data ?? [];
}

export async function getRecipeById(recipeId: string) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single();

  if (error) {
    console.error("Error loading recipe:", error);
    throw error;
  }

  return data;
}

export type RecipeIngredientInput = {
  quantity: string;
  unit: string;
  ingredient: string;
};

export type RecipeInstructionInput = {
  step: number;
  text: string;
};

export type CreateRecipeInput = {
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
  original_language: "en" | "fr" | "ar";
  status: "draft" | "pending";
};

export async function createRecipe(input: CreateRecipeInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to create a recipe.");
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      creator_id: user.id,
      title: input.title,
      description: input.description.trim(),
      category: input.category.trim() || "Other",
      image_url: input.image_url,
      prep_minutes: input.prep_minutes ?? 0,
      cook_minutes: input.cook_minutes ?? 0,
      servings: input.servings ?? 1,
      ingredients: input.ingredients,
      instructions: input.instructions,
      original_language: input.original_language,
      status: input.status,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }

  return data;
}
export type UpdateRecipeInput = {
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
  original_language: "en" | "fr" | "ar";
  status: "draft" | "pending";
};

export async function updateRecipe(
  recipeId: string,
  input: UpdateRecipeInput,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to edit a recipe.");
  }

  const updateData: Record<string, unknown> = {
    title: input.title,
    description: input.description.trim(),
    category: input.category.trim() || "Other",
    image_url: input.image_url,
    prep_minutes: input.prep_minutes ?? 0,
    cook_minutes: input.cook_minutes ?? 0,
    servings: input.servings ?? 1,
    ingredients: input.ingredients,
    instructions: input.instructions,
    original_language: input.original_language,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "pending") {
    updateData.admin_note = null;
  }

  const { data, error } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId)
    .eq("creator_id", user.id)
    .in("status", ["draft", "changes_requested", "declined"])
    .select()
    .single();

  if (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }

  return data;
}

export async function getCookRecipeById(
  recipeId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("creator_id", userId)
    .single();

  if (error) {
    console.error("Error loading cook recipe:", error);
    throw error;
  }

  return data;
}

export type RecipeCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
};

export async function getRecipeCategories() {
  const { data, error } = await supabase
    .from("recipe_categories")
    .select("id, name, slug, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error loading recipe categories:", error);
    throw error;
  }

  return (data ?? []) as RecipeCategory[];
}

export async function compressRecipeImage(
  file: File,
): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Could not read the selected image."));
      image.src = imageUrl;
    });

    const maxDimension = 1400;

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(
        maxDimension / width,
        maxDimension / height,
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not process the image.");
    }

    context.drawImage(image, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error("Could not compress the image."),
              );
              return;
            }

            resolve(blob);
          },
          "image/webp",
          0.72,
        );
      },
    );

    return compressedBlob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function uploadRecipeImage(
  file: File,
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to upload a recipe image.",
    );
  }

  const compressedImage =
    await compressRecipeImage(file);

  const fileName = `${crypto.randomUUID()}.webp`;

  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(filePath, compressedImage, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Error uploading recipe image:",
      uploadError,
    );

    throw uploadError;
  }

  const { data } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteRecipeImageByUrl(
  imageUrl: string,
) {
  const marker = "/recipe-images/";
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return;
  }

  const filePath = decodeURIComponent(
    imageUrl.slice(markerIndex + marker.length),
  );

  if (!filePath) {
    return;
  }

  const { error } = await supabase.storage
    .from("recipe-images")
    .remove([filePath]);

  if (error) {
    console.error(
      "Error deleting old recipe image:",
      error,
    );
  }
}

export async function deleteRecipe(recipeId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a recipe.");
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, creator_id, image_url")
    .eq("id", recipeId)
    .eq("creator_id", user.id)
    .single();

  if (recipeError) {
    throw recipeError;
  }

  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("creator_id", user.id);

  if (deleteError) {
    console.error("Error deleting recipe:", deleteError);
    throw deleteError;
  }

  if (recipe.image_url) {
    await deleteRecipeImageByUrl(recipe.image_url);
  }
}

export type RecipeModerationStatus =
  | "approved"
  | "declined"
  | "changes_requested";

export async function getPendingRecipes() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to review recipes.",
    );
  }

  const { data: recipes, error: recipesError } =
    await supabase
      .from("recipes")
      .select("*")
      .eq("status", "pending")
      .neq("creator_id", user.id)
      .order("created_at", { ascending: true });

  if (recipesError) {
    console.error(
      "Error loading pending recipes:",
      recipesError,
    );
    throw recipesError;
  }

  if (!recipes || recipes.length === 0) {
    return [];
  }

  const creatorIds = [
    ...new Set(
      recipes.map((recipe) => recipe.creator_id),
    ),
  ];

  const { data: cooks, error: cooksError } = await supabase
    .from("cook_profiles")
    .select(
      "user_id, display_name, username, profile_image_url",
    )
    .in("user_id", creatorIds);

  if (cooksError) {
    console.error(
      "Error loading recipe cooks:",
      cooksError,
    );
    throw cooksError;
  }

  return recipes.map((recipe) => ({
    ...recipe,
    cook:
      cooks?.find(
        (cook) => cook.user_id === recipe.creator_id,
      ) ?? null,
  }));
}

export async function moderateRecipe(
  recipeId: string,
  status: RecipeModerationStatus,
  adminNote: string,
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
    "You must be signed in to moderate recipes.",
  );
}

  const updateData: {
    status: RecipeModerationStatus;
    admin_note: string | null;
    published_at?: string | null;
    updated_at: string;
  } = {
    status,
    admin_note: adminNote.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved") {
    updateData.published_at = new Date().toISOString();
  } else {
    updateData.published_at = null;
  }

  const { data, error } = await supabase
.from("recipes")
.update(updateData)
.eq("id", recipeId)
.eq("status", "pending")
.neq("creator_id", user.id)
.select()
.single();

  if (error) {
    console.error("Error moderating recipe:", error);
    throw error;
  }

  return data;
}

export async function getPublishedRecipeById(
  recipeId: string,
) {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
.select(
  "id, creator_id, title, description, category, image_url, prep_minutes, cook_minutes, servings, ingredients, instructions, original_language, status, published_at, created_at, updated_at",
)
.eq("id", recipeId)
.eq("status", "approved")
    .maybeSingle();

  if (recipeError) {
    console.error(
      "Error loading published recipe:",
      recipeError,
    );

    throw recipeError;
  }

  if (!recipe) {
    return null;
  }

  const { data: cook, error: cookError } = await supabase
    .from("public_cook_profiles")
    .select(
      "user_id, display_name, username, profile_image_url",
    )
    .eq("user_id", recipe.creator_id)
    .eq("is_approved", true)
    .maybeSingle();

  if (cookError) {
    console.error(
      "Error loading recipe cook:",
      cookError,
    );

    throw cookError;
  }

  if (!cook) {
    return null;
  }

  return {
    ...recipe,
    cook,
  };
}
