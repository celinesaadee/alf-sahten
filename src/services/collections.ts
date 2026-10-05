import { supabase } from "../lib/supabase";

export type RecipeCollection = {
  id: string;
  name: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CollectionRecipe = {
  collection_id: string;
  recipe_id: string;
  created_at: string;
};

export type CollectionWithRecipes =
  RecipeCollection & {
    recipeIds: string[];
  };

function cleanCollectionName(
  name: string,
) {
  return name.trim();
}

export async function getCollections(
  includeArchived = false,
): Promise<RecipeCollection[]> {
  let query = supabase
    .from("recipe_collections")
    .select(
      "id, name, archived, created_at, updated_at",
    )
    .order("updated_at", {
      ascending: false,
    });

  if (!includeArchived) {
    query = query.eq(
      "archived",
      false,
    );
  }

  const { data, error } =
    await query;

  if (error) {
    console.error(
      "Error loading collections:",
      error,
    );

    throw error;
  }

  return (
    data as RecipeCollection[] | null
  ) ?? [];
}

export async function getCollectionsWithRecipes(
  includeArchived = false,
): Promise<CollectionWithRecipes[]> {
  const collections =
    await getCollections(
      includeArchived,
    );

  if (collections.length === 0) {
    return [];
  }

  const collectionIds =
    collections.map(
      (collection) =>
        collection.id,
    );

  const { data, error } =
    await supabase
      .from("collection_recipes")
      .select(
        "collection_id, recipe_id, created_at",
      )
      .in(
        "collection_id",
        collectionIds,
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Error loading collection recipes:",
      error,
    );

    throw error;
  }

  const recipeRows =
    (data as
      | CollectionRecipe[]
      | null) ?? [];

  return collections.map(
    (collection) => ({
      ...collection,
      recipeIds: recipeRows
        .filter(
          (row) =>
            row.collection_id ===
            collection.id,
        )
        .map(
          (row) =>
            row.recipe_id,
        ),
    }),
  );
}

export async function createCollection(
  name: string,
): Promise<RecipeCollection> {
  const cleanName =
    cleanCollectionName(name);

  if (!cleanName) {
    throw new Error(
      "Collection name is required",
    );
  }

  const { data, error } =
    await supabase
      .from("recipe_collections")
      .insert({
        name: cleanName,
      })
      .select(
        "id, name, archived, created_at, updated_at",
      )
      .single();

  if (error) {
    console.error(
      "Error creating collection:",
      error,
    );

    throw error;
  }

  return data as RecipeCollection;
}

export async function createCollectionWithRecipe(
  name: string,
  recipeId: string,
): Promise<RecipeCollection> {
  const cleanName =
    cleanCollectionName(name);

  if (!cleanName) {
    throw new Error(
      "Collection name is required",
    );
  }

  const { data, error } =
    await supabase.rpc(
      "create_recipe_collection_with_recipe",
      {
        p_name: cleanName,
        p_recipe_id: recipeId,
      },
    );

  if (error) {
    console.error(
      "Error creating collection with recipe:",
      error,
    );

    throw error;
  }

  const collection =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!collection) {
    throw new Error(
      "Collection was not created",
    );
  }

  return collection as RecipeCollection;
}

export async function renameCollection(
  collectionId: string,
  name: string,
): Promise<RecipeCollection> {
  const cleanName =
    cleanCollectionName(name);

  if (!cleanName) {
    throw new Error(
      "Collection name is required",
    );
  }

  const { data, error } =
    await supabase
      .from("recipe_collections")
      .update({
        name: cleanName,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        collectionId,
      )
      .select(
        "id, name, archived, created_at, updated_at",
      )
      .single();

  if (error) {
    console.error(
      "Error renaming collection:",
      error,
    );

    throw error;
  }

  return data as RecipeCollection;
}

export async function setCollectionArchived(
  collectionId: string,
  archived: boolean,
): Promise<RecipeCollection> {
  const { data, error } =
    await supabase
      .from("recipe_collections")
      .update({
        archived,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        collectionId,
      )
      .select(
        "id, name, archived, created_at, updated_at",
      )
      .single();

  if (error) {
    console.error(
      archived
        ? "Error archiving collection:"
        : "Error restoring collection:",
      error,
    );

    throw error;
  }

  return data as RecipeCollection;
}

export async function archiveCollection(
  collectionId: string,
) {
  return setCollectionArchived(
    collectionId,
    true,
  );
}

export async function restoreCollection(
  collectionId: string,
) {
  return setCollectionArchived(
    collectionId,
    false,
  );
}

export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string,
) {
  const { error } =
    await supabase
      .from("collection_recipes")
      .insert({
        collection_id:
          collectionId,
        recipe_id: recipeId,
      });

  if (error) {
    console.error(
      "Error adding recipe to collection:",
      error,
    );

    throw error;
  }
}

export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string,
) {
  const { error } =
    await supabase
      .from("collection_recipes")
      .delete()
      .eq(
        "collection_id",
        collectionId,
      )
      .eq(
        "recipe_id",
        recipeId,
      );

  if (error) {
    console.error(
      "Error removing recipe from collection:",
      error,
    );

    throw error;
  }
}

export async function getRecipeCollectionIds(
  recipeId: string,
): Promise<string[]> {
  const { data, error } =
    await supabase
      .from("collection_recipes")
      .select("collection_id")
      .eq(
        "recipe_id",
        recipeId,
      );

  if (error) {
    console.error(
      "Error loading recipe collections:",
      error,
    );

    throw error;
  }

  return (
    data?.map(
      (row) =>
        row.collection_id,
    ) ?? []
  );
}