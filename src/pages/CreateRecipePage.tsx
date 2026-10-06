import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { supabase } from "../lib/supabase";
import { detectRecipeLanguage } from "../lib/recipeLanguage";
import NutritionCalculator from "../components/NutritionCalculator";
import { nutrientKeys, nutritionBasis, type NutrientValues } from "../lib/nutrition";
import { RECIPE_TAGS, normalizeRecipeTags, type RecipeTag } from "../lib/recipeTags";
import "../components/RecipeTags.css";

import {
  createRecipe,
  getCookRecipeById,
  getRecipeCategories,
  updateRecipe,
  uploadRecipeImage,
  deleteRecipeImageByUrl,
  type RecipeCategory,
  type RecipeIngredientInput,
} from "../services/recipes";

import "./CreateRecipePage.css";

type RecipeLanguage = "en" | "fr" | "ar";

function parseInstagramCaption(caption: string) {
  const cleanCaption = caption.trim();

  const ingredientsMatch = cleanCaption.match(
    /ingredients?\s*:/i,
  );

  const instructionsMatch = cleanCaption.match(
    /instructions?\s*:/i,
  );

  if (
    !ingredientsMatch ||
    !instructionsMatch ||
    ingredientsMatch.index === undefined ||
    instructionsMatch.index === undefined
  ) {
    return {
      title: cleanCaption.split("\n")[0]?.trim() ?? "",
      ingredients: [],
      instructions: [],
    };
  }

  const title = cleanCaption
    .slice(0, ingredientsMatch.index)
    .trim();

  const ingredientsText = cleanCaption
    .slice(
      ingredientsMatch.index +
        ingredientsMatch[0].length,
      instructionsMatch.index,
    )
    .trim();

  const instructionsText = cleanCaption
    .slice(
      instructionsMatch.index +
        instructionsMatch[0].length,
    )
    .trim();

  const ingredientParts = ingredientsText
    .split(
      /\n+|(?=\d+(?:[./]\d+)?\s+(?:cups?|tbsp|tablespoons?|tsp|teaspoons?|g|kg|ml|l|oz|lbs?|cloves?|eggs?)\b)/i,
    )
    .map((item) => item.trim())
    .filter(Boolean);

  const parsedIngredients =
    ingredientParts.map((item) => {
      const match = item.match(
        /^(\d+(?:\s+\d+\/\d+|[./]\d+)?)\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|g|kg|ml|l|oz|lbs?|cloves?)?\s*(.*)$/i,
      );

      if (!match) {
        return {
          quantity: "",
          unit: "",
          ingredient: item,
        };
      }

      return {
        quantity: match[1] ?? "",
        unit: match[2] ?? "",
        ingredient: match[3]?.trim() ?? "",
      };
    });

  const parsedInstructions = instructionsText
    .split(/\n+|(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title,
    ingredients: parsedIngredients,
    instructions: parsedInstructions,
  };
}

function CreateRecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const { id: recipeId } = useParams();

  const isEditing = Boolean(recipeId);
  const instagramImport = (
  location.state as {
    instagramImport?: {
      id: string;
      caption: string;
      mediaType: string | null;
      mediaProductType: string | null;
      mediaUrl: string | null;
      thumbnailUrl: string | null;
      permalink: string | null;
      timestamp: string | null;
    };
  } | null
)?.instagramImport;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<RecipeTag[]>([]);

  const [categories, setCategories] = useState<RecipeCategory[]>([]);
const [categoryMode, setCategoryMode] = useState<"existing" | "other">(
  "existing",
);
const [customCategory, setCustomCategory] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(
    null,
  );

  const [originalImageUrl, setOriginalImageUrl] =
  useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] =
  useState<File | null>(null);

const [imagePreview, setImagePreview] =
  useState<string | null>(null);

  const [prepMinutes, setPrepMinutes] = useState("");
  const [cookMinutes, setCookMinutes] = useState("");
  const [servings, setServings] = useState("");
  const [nutritionEstimate, setNutritionEstimate] = useState<{ basis: string; excluded: number } | null>(null);
const [nutrition, setNutrition] = useState({
  calories: "",
  protein: "",
  carbohydrates: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
});
  const [language, setLanguage] =
    useState<RecipeLanguage>(() => !isEditing && instagramImport
      ? detectRecipeLanguage(instagramImport.caption) ?? "en"
      : "en");

  const detectedImportLanguage = !isEditing && instagramImport
    ? detectRecipeLanguage(instagramImport.caption) : null;
  const [importLanguageConfirmed, setImportLanguageConfirmed] = useState(
    isEditing || !instagramImport || detectedImportLanguage !== null,
  );

  const [ingredients, setIngredients] = useState<
    RecipeIngredientInput[]
  >([
    {
      quantity: "",
      unit: "",
      ingredient: "",
    },
  ]);

  const [instructions, setInstructions] = useState<string[]>(
    [""],
  );

  const [loadingRecipe, setLoadingRecipe] =
    useState(isEditing);

  const [editBlockedMessage, setEditBlockedMessage] =
    useState<string | null>(null);

    const [existingRecipeStatus, setExistingRecipeStatus] =
  useState<
    | "draft"
    | "pending"
    | "approved"
    | "changes_requested"
    | "declined"
    | null
  >(null);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  if (
    isEditing ||
    !instagramImport?.caption
  ) {
    return;
  }

  const parsed = parseInstagramCaption(
    instagramImport.caption,
  );

if (parsed.title) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setTitle(parsed.title);
}

  if (parsed.ingredients.length > 0) {
    setIngredients(parsed.ingredients);
  }

  if (parsed.instructions.length > 0) {
    setInstructions(parsed.instructions);
  }

  const importedImage =
    instagramImport.thumbnailUrl ||
    instagramImport.mediaUrl;

  if (importedImage) {
    setImageUrl(importedImage);
    setImagePreview(importedImage);
  }
}, [isEditing, instagramImport]);

useEffect(() => {
  let cancelled = false;

  async function loadCurrentRole() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return;
      }

      const { data, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (!cancelled) {
        setIsAdmin(data.role === "admin");
      }
    } catch (err) {
      console.error(
        "Could not load recipe author role:",
        err,
      );
    }
  }

  void loadCurrentRole();

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
  async function loadCategories() {
    try {
      const data = await getRecipeCategories();
      setCategories(data);
    } catch (err) {
      console.error("Could not load recipe categories:", err);
    }
  }

  loadCategories();
}, []);

useEffect(() => {
  if (!isEditing || categories.length === 0 || !category) {
    return;
  }

  const categoryExists = categories.some(
    (item) => item.name === category,
  );

if (categoryExists) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setCategoryMode("existing");
  setCustomCategory("");
} else {
  setCategoryMode("other");
    setCustomCategory(category);
  }
}, [isEditing, categories, category]);

 useEffect(() => {
  if (!recipeId) {
    return;
  }

  async function loadRecipe() {
    try {
      setLoadingRecipe(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          t("recipeEditor.mustSignInEdit"),
        );
      }

      const recipe =
        await getCookRecipeById(
          recipeId!,
          user.id,
        );

        setExistingRecipeStatus(
  recipe.status,
);

      if (
  ![
    "draft",
    "changes_requested",
    "declined",
    "approved",
  ].includes(recipe.status)
) {
  setEditBlockedMessage(
    recipe.status === "pending"
      ? t(
          "recipeEditor.pendingBlocked",
        )
      : t(
          "recipeEditor.unavailableBlocked",
        ),
  );

  return;
}

      setAdminNote(
        recipe.admin_note ?? null,
      );

      setTitle(recipe.title ?? "");
      setTags(normalizeRecipeTags(recipe.tags));

      setDescription(
        recipe.description ?? "",
      );

      setCategory(
        recipe.category ?? "",
      );

      setImageUrl(
        recipe.image_url ?? null,
      );

      setOriginalImageUrl(
        recipe.image_url ?? null,
      );

      setImagePreview(
        recipe.image_url ?? null,
      );

      setPrepMinutes(
        recipe.prep_minutes !== null &&
          recipe.prep_minutes !==
            undefined
          ? String(
              recipe.prep_minutes,
            )
          : "",
      );

      setCookMinutes(
        recipe.cook_minutes !== null &&
          recipe.cook_minutes !==
            undefined
          ? String(
              recipe.cook_minutes,
            )
          : "",
      );

setServings(
  recipe.servings !== null &&
    recipe.servings !== undefined
    ? String(recipe.servings)
    : "",
);

const recipeNutrition =
  recipe.nutrition &&
  typeof recipe.nutrition === "object" &&
  !Array.isArray(recipe.nutrition)
    ? recipe.nutrition
    : {};

setNutritionEstimate(recipeNutrition.source === "usda-estimate" && typeof recipeNutrition.basis === "string"
  ? { basis: recipeNutrition.basis, excluded: Number(recipeNutrition.excludedIngredients) || 0 }
  : null);

setNutrition({
  calories:
    recipeNutrition.calories !== null &&
    recipeNutrition.calories !== undefined
      ? String(recipeNutrition.calories)
      : "",

  protein:
    recipeNutrition.protein !== null &&
    recipeNutrition.protein !== undefined
      ? String(recipeNutrition.protein)
      : "",

  carbohydrates:
    recipeNutrition.carbohydrates !== null &&
    recipeNutrition.carbohydrates !== undefined
      ? String(recipeNutrition.carbohydrates)
      : "",

  fat:
    recipeNutrition.fat !== null &&
    recipeNutrition.fat !== undefined
      ? String(recipeNutrition.fat)
      : "",

  fiber:
    recipeNutrition.fiber !== null &&
    recipeNutrition.fiber !== undefined
      ? String(recipeNutrition.fiber)
      : "",

  sugar:
    recipeNutrition.sugar !== null &&
    recipeNutrition.sugar !== undefined
      ? String(recipeNutrition.sugar)
      : "",

  sodium:
    recipeNutrition.sodium !== null &&
    recipeNutrition.sodium !== undefined
      ? String(recipeNutrition.sodium)
      : "",
});

      setLanguage(
        (recipe.original_language ??
          "en") as RecipeLanguage,
      );

      if (
        Array.isArray(
          recipe.ingredients,
        ) &&
        recipe.ingredients.length > 0
      ) {
        setIngredients(
          recipe.ingredients.map(
            (ingredient: {
  quantity?: string | null;
  unit?: string | null;
  ingredient?: string | null;
}) => ({
              quantity:
                ingredient.quantity ??
                "",
              unit:
                ingredient.unit ?? "",
              ingredient:
                ingredient.ingredient ??
                "",
            }),
          ),
        );
      }

      if (
        Array.isArray(
          recipe.instructions,
        ) &&
        recipe.instructions.length >
          0
      ) {
        setInstructions(
          recipe.instructions.map(
            (instruction: {
  text?: string | null;
}) =>
  instruction.text ?? "",
          ),
        );
      }
    } catch (err) {
      console.error(err);

      setEditBlockedMessage(
        t("recipeEditor.loadError"),
      );
    } finally {
      setLoadingRecipe(false);
    }
  }

  void loadRecipe();
}, [recipeId, t]);

function handleImageChange(
  event: React.ChangeEvent<HTMLInputElement>,
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/")
  ) {
    setError(
      t("recipeEditor.imageFileOnly"),
    );

    return;
  }

  if (
    file.size >
    15 * 1024 * 1024
  ) {
    setError(
      t("recipeEditor.imageTooLarge"),
    );

    return;
  }

  setError(null);
  setSelectedImageFile(file);

  const previewUrl =
    URL.createObjectURL(file);

  setImagePreview((current) => {
    if (
      current?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(current);
    }

    return previewUrl;
  });
}

function removeSelectedImage() {
  if (imagePreview?.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview);
  }

  setSelectedImageFile(null);
  setImagePreview(null);
  setImageUrl(null);
}

  function updateIngredient(
    index: number,
    field: keyof RecipeIngredientInput,
    value: string,
  ) {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? {
              ...ingredient,
              [field]: value,
            }
          : ingredient,
      ),
    );
  }

  function updateNutrition(
  field: keyof typeof nutrition,
  value: string,
) {
  setNutrition((current) => ({
    ...current,
    [field]: value,
  }));
}

  const currentNutritionBasis = nutritionBasis(ingredients, servings);
  const nutritionIsStale = nutritionEstimate !== null && nutritionEstimate.basis !== currentNutritionBasis;

  function applyNutritionEstimate(values: NutrientValues, excluded: number) {
    setNutrition(Object.fromEntries(nutrientKeys.map(key => [key, values[key] === undefined ? "" : String(values[key])])) as typeof nutrition);
    setNutritionEstimate({ basis: currentNutritionBasis, excluded });
  }

  function addIngredient() {
    setIngredients((current) => [
      ...current,
      {
        quantity: "",
        unit: "",
        ingredient: "",
      },
    ]);
  }

  function removeIngredient(index: number) {
    setIngredients((current) =>
      current.filter(
        (_, ingredientIndex) =>
          ingredientIndex !== index,
      ),
    );
  }

  function updateInstruction(
    index: number,
    value: string,
  ) {
    setInstructions((current) =>
      current.map((instruction, instructionIndex) =>
        instructionIndex === index
          ? value
          : instruction,
      ),
    );
  }

  function addInstruction() {
    setInstructions((current) => [...current, ""]);
  }

  function removeInstruction(index: number) {
    setInstructions((current) =>
      current.filter(
        (_, instructionIndex) =>
          instructionIndex !== index,
      ),
    );
  }

async function saveRecipe(
  status: "draft" | "pending",
) {
  if (nutritionIsStale) {
    setError(t("nutritionCalculator.stale"));
    return;
  }
  if (!importLanguageConfirmed) {
    setError(t("recipeLanguageDetection.uncertain"));
    return;
  }
  if (
    loadingRecipe ||
    editBlockedMessage ||
    submitting
  ) {
    return;
  }

  try {
  setSubmitting(true);
  setError(null);

const finalStatus:
  | "draft"
  | "pending"
  | "approved" =
  existingRecipeStatus === "approved"
    ? "approved"
    : status;

  if (!title.trim()) {
      setError(
        t(
          "recipeEditor.enterRecipeName",
        ),
      );

      return;
    }

    const cleanedIngredients =
      ingredients.filter(
        (ingredient) =>
          ingredient.quantity.trim() ||
          ingredient.unit.trim() ||
          ingredient.ingredient.trim(),
      );

    const cleanedInstructions =
      instructions
        .map((instruction) =>
          instruction.trim(),
        )
        .filter(Boolean)
        .map(
          (
            instruction,
            index,
          ) => ({
            step: index + 1,
            text: instruction,
          }),
        );

    if (
  finalStatus === "pending" ||
  finalStatus === "approved"
) {
 if (
  !prepMinutes.trim() ||
  Number(prepMinutes) < 1
) {
setError(
  t("recipeEditor.prepTimeRequired"),
);
  return;
}

if (
  !cookMinutes.trim() ||
  Number(cookMinutes) < 1
) {
setError(
  t("recipeEditor.cookTimeRequired"),
);
  return;
}

if (
  !servings.trim() ||
  Number(servings) < 1
) {
 setError(
  t("recipeEditor.servingsRequired"),
);
  return;
}

  if (
    cleanedIngredients.length ===
    0
  ) {
        setError(
          isAdmin
            ? t(
                "recipeEditor.ingredientPublishRequired",
              )
            : t(
                "recipeEditor.ingredientSubmitRequired",
              ),
        );

        return;
      }

      if (
        cleanedInstructions.length ===
        0
      ) {
        setError(
          isAdmin
            ? t(
                "recipeEditor.instructionPublishRequired",
              )
            : t(
                "recipeEditor.instructionSubmitRequired",
              ),
        );

        return;
      }
    }

let finalImageUrl = imageUrl;

const instagramSourceImage =
  instagramImport?.thumbnailUrl ||
  instagramImport?.mediaUrl;

if (
  instagramImport?.id &&
  !selectedImageFile &&
  instagramSourceImage &&
  imageUrl === instagramSourceImage
) {
  const {
    data: importedImageData,
    error: importedImageError,
  } = await supabase.functions.invoke(
    "instagram-import-image",
    {
      body: {
        mediaId: instagramImport.id,
      },
    },
  );

  if (importedImageError) {
    throw importedImageError;
  }

  if (
    !importedImageData ||
    typeof importedImageData.imageUrl !==
      "string"
  ) {
    throw new Error(
      "Imported Instagram image URL missing",
    );
  }

  finalImageUrl =
    importedImageData.imageUrl;
}

if (selectedImageFile) {
  finalImageUrl =
    await uploadRecipeImage(
      selectedImageFile,
    );
}

const cleanedNutrition = Object.fromEntries(
  Object.entries(nutrition)
    .filter(([, value]) => value.trim() !== "")
    .map(([key, value]) => [
      key,
      Number(value),
    ]),
);

const recipeInput = {
  tags,
  title: title.trim(),

  description:
    description.trim(),

  category:
    categoryMode === "other"
      ? customCategory.trim()
      : category.trim(),

  image_url: finalImageUrl,

  prep_minutes: prepMinutes
    ? Number(prepMinutes)
    : null,

  cook_minutes: cookMinutes
    ? Number(cookMinutes)
    : null,

  servings: servings
    ? Number(servings)
    : null,

  nutrition: {
    ...cleanedNutrition,
    ...(nutritionEstimate ? {
      source: "usda-estimate" as const,
      basis: nutritionEstimate.basis,
      excludedIngredients: nutritionEstimate.excluded,
    } : {}),
  },

  ingredients:
    cleanedIngredients,

  instructions:
    cleanedInstructions,

  original_language: language,

  status: finalStatus,

  instagram_media_id:
    instagramImport?.id ?? null,

  instagram_permalink:
    instagramImport?.permalink ?? null,
};

    if (recipeId) {
      await updateRecipe(
        recipeId,
        recipeInput,
      );

      if (
        originalImageUrl &&
        originalImageUrl !==
          finalImageUrl
      ) {
        await deleteRecipeImageByUrl(
          originalImageUrl,
        );
      }
    } else {
  await createRecipe({
    ...recipeInput,
    status,
  });
}

    navigate("/cook/recipes");
  } catch (err) {
    console.error(err);

    setError(
      isEditing
        ? t(
            "recipeEditor.updateError",
          )
        : t(
            "recipeEditor.saveError",
          ),
    );
  } finally {
    setSubmitting(false);
  }
}

if (loadingRecipe) {
  return (
    <main className="create-recipe-page">
      <div className="create-recipe-container">
        <p>
          {t("recipeEditor.loading")}
        </p>
      </div>
    </main>
  );
}

if (
  isEditing &&
  editBlockedMessage
) {
  return (
    <main className="create-recipe-page">
      <div className="create-recipe-container">
        <Link
          to="/cook/recipes"
          className="create-recipe-back"
        >
          <ArrowLeft size={18} />

          {t("recipeEditor.myRecipes")}
        </Link>

        <header className="create-recipe-header">
          <h1>
            {t(
              "recipeEditor.unavailableTitle",
            )}
          </h1>

          <p role="alert">
            {editBlockedMessage}
          </p>
        </header>
      </div>
    </main>
  );
}

return (
  <main className="create-recipe-page">
    <div className="create-recipe-container">
      <Link
        to="/cook/recipes"
        className="create-recipe-back"
      >
        <ArrowLeft size={18} />

        {t("recipeEditor.myRecipes")}
      </Link>

      <header className="create-recipe-header">
        <p className="eyebrow">
          {t(
            "recipeEditor.dashboard",
          )}
        </p>

        <h1>
          {isEditing
            ? t(
                "recipeEditor.editTitle",
              )
            : t(
                "recipeEditor.createTitle",
              )}
        </h1>

        <p>
          {isAdmin
            ? isEditing
              ? t(
                  "recipeEditor.adminEditIntro",
                )
              : t(
                  "recipeEditor.adminCreateIntro",
                )
            : isEditing
              ? t(
                  "recipeEditor.cookEditIntro",
                )
              : t(
                  "recipeEditor.cookCreateIntro",
                )}
        </p>
      </header>

      {adminNote && (
        <aside className="recipe-review-note">
          <strong>
            {t(
              "myRecipes.adminNote",
            )}
          </strong>

          <p>{adminNote}</p>
        </aside>
      )}

      <fieldset className="recipe-tag-editor">
        <legend>{t("recipeTags.title")}</legend>
        {RECIPE_TAGS.map(tag => <label key={tag}>
          <input type="checkbox" checked={tags.includes(tag)} disabled={submitting || loadingRecipe}
            onChange={event => { const checked = event.target.checked; setTags(current => checked ? [...current, tag] : current.filter(value => value !== tag)); }} />
          {t(`recipeTags.${tag}`)}
        </label>)}
      </fieldset>
      <section className="recipe-form-section">
        <div className="recipe-form-section-heading">
          <span>01</span>

          <div>
            <h2>
              {t(
                "recipeEditor.detailsTitle",
              )}
            </h2>

            <p>
              {t(
                "recipeEditor.detailsText",
              )}
            </p>
          </div>
        </div>

        <div className="recipe-form-grid">
          <label className="recipe-field recipe-field-full">
            <span>
              {t(
                "recipeEditor.recipeName",
              )}
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder={t(
                "recipeEditor.recipeNamePlaceholder",
              )}
            />
          </label>

          <label className="recipe-field recipe-field-full">
            <span>
              {t(
                "recipeEditor.description",
              )}
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder={t(
                "recipeEditor.descriptionPlaceholder",
              )}
              rows={4}
            />
          </label>

          <div className="recipe-field recipe-field-full">
            <span>
              {t(
                "recipeEditor.photo",
              )}
            </span>

            {!imagePreview ? (
              <label className="recipe-image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                />

                <ImagePlus size={28} />

                <strong>
                  {t(
                    "recipeEditor.browsePhoto",
                  )}
                </strong>

                <small>
                  {t(
                    "recipeEditor.photoHelp",
                  )}
                </small>
              </label>
            ) : (
              <div className="recipe-image-preview">
                <img
                  src={imagePreview}
                  alt={t(
                    "recipeEditor.previewAlt",
                  )}
                />

                <div className="recipe-image-preview-actions">
                  <label className="recipe-change-image-button">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleImageChange
                      }
                    />

                    <ImagePlus
                      size={17}
                    />

                    {t(
                      "recipeEditor.changePhoto",
                    )}
                  </label>

                  <button
                    type="button"
                    className="recipe-remove-image-button"
                    onClick={
                      removeSelectedImage
                    }
                  >
                    <X size={17} />

                    {t(
                      "recipeEditor.removePhoto",
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="recipe-field">
            <span>
              {t(
                "recipeEditor.category",
              )}
            </span>

            <select
              value={
                categoryMode ===
                "other"
                  ? "__other__"
                  : category
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                if (
                  value ===
                  "__other__"
                ) {
                  setCategoryMode(
                    "other",
                  );

                  setCategory("");
                } else {
                  setCategoryMode(
                    "existing",
                  );

                  setCategory(value);

                  setCustomCategory("");
                }
              }}
            >
              <option value="">
                {t(
                  "recipeEditor.chooseCategory",
                )}
              </option>

              {categories.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.name}
                  >
                    {t(
                      `categories.${item.name}`,
                      {
                        defaultValue:
                          item.name,
                      },
                    )}
                  </option>
                ),
              )}

              <option value="__other__">
                {t(
                  "recipeEditor.otherCategory",
                )}
              </option>
            </select>

            {categoryMode ===
              "other" && (
              <input
                type="text"
                value={customCategory}
                onChange={(event) =>
                  setCustomCategory(
                    event.target.value,
                  )
                }
                placeholder={t(
                  "recipeEditor.customCategoryPlaceholder",
                )}
              />
            )}
          </div>

          <div className="recipe-field">
            <span>
              {t(
                "recipeEditor.recipeLanguage",
              )}
            </span>

            <select
              aria-label={t("recipeEditor.recipeLanguage")}
              required
              value={language}
              onChange={(event) => {
                setImportLanguageConfirmed(true);
                setLanguage(
                  event.target
                    .value as RecipeLanguage,
                );
              }}
            >
              <option value="en">
                {t(
                  "language.english",
                )}
              </option>

              <option value="fr">
                {t(
                  "language.french",
                )}
              </option>

              <option value="ar">
                {t(
                  "language.arabic",
                )}
              </option>
            </select>
            {!isEditing && instagramImport && (
              <small>{t(detectedImportLanguage
                ? "recipeLanguageDetection.detected"
                : "recipeLanguageDetection.uncertain")}</small>
            )}
            {!importLanguageConfirmed && (
              <label>
                <input type="checkbox" checked={importLanguageConfirmed}
                  onChange={event => setImportLanguageConfirmed(event.target.checked)} required />
                {t("recipeLanguageDetection.confirm")}
              </label>
            )}
          </div>
        </div>
      </section>

      <section className="recipe-form-section">
        <div className="recipe-form-section-heading">
          <span>02</span>

          <div>
            <h2>
              {t(
                "recipeEditor.timeTitle",
              )}
            </h2>

            <p>
              {t(
                "recipeEditor.timeText",
              )}
            </p>
          </div>
        </div>

        <div className="recipe-form-grid recipe-time-grid">
          <label className="recipe-field">
            <span>
              {t(
  "recipeEditor.prepTime",
)} *
            </span>

            <div className="recipe-number-field">
              <input
                type="number"
                min="1"
                value={prepMinutes}
                onChange={(event) =>
                  setPrepMinutes(
                    event.target.value,
                  )
                }
                placeholder="15"
              />

              <span>
                {t(
                  "recipeEditor.minutesShort",
                )}
              </span>
            </div>
          </label>

          <label className="recipe-field">
            <span>
              {t(
  "recipeEditor.cookTime",
)} *
            </span>

            <div className="recipe-number-field">
              <input
                type="number"
                min="0"
                value={cookMinutes}
                onChange={(event) =>
                  setCookMinutes(
                    event.target.value,
                  )
                }
                placeholder="30"
              />

              <span>
                {t(
                  "recipeEditor.minutesShort",
                )}
              </span>
            </div>
          </label>

          <label className="recipe-field">
            <span>
            {t(
  "recipeEditor.servings",
)} *
            </span>

            <input
              type="number"
              min="1"
              value={servings}
              onChange={(event) =>
                setServings(
                  event.target.value,
                )
              }
              placeholder="4"
            />
          </label>
                </div>
      </section>

      <section className="recipe-form-section">
        <div className="recipe-form-section-heading">
          <span>03</span>

          <div>
            <h2>
              {t(
                "recipeEditor.nutritionTitle",
                {
                  defaultValue:
                    "Nutrition",
                },
              )}
            </h2>

            <p>
              {t(
                "recipeEditor.nutritionText",
                {
                  defaultValue:
                    "Optional nutrition information per serving.",
                },
              )}
            </p>
          </div>
        </div>

        <NutritionCalculator
          key={currentNutritionBasis}
          ingredients={ingredients}
          servings={servings}
          disabled={submitting || loadingRecipe || Boolean(editBlockedMessage)}
          onApply={applyNutritionEstimate}
        />
        {nutritionEstimate && <div className="nutrition-estimate-notice" role="status">
          <p>{t(nutritionIsStale ? "nutritionCalculator.stale" : "nutritionCalculator.savedEstimate")}</p>
          <button type="button" className="recipe-draft-button" disabled={submitting}
            onClick={() => setNutritionEstimate(null)}>{t("nutritionCalculator.useManual")}</button>
        </div>}
        <div className="recipe-form-grid">
          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.calories",
                {
                  defaultValue:
                    "Calories",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="1"
              value={nutrition.calories}
              onChange={(event) =>
                updateNutrition(
                  "calories",
                  event.target.value,
                )
              }
              placeholder="350"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.protein",
                {
                  defaultValue:
                    "Protein (g)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={nutrition.protein}
              onChange={(event) =>
                updateNutrition(
                  "protein",
                  event.target.value,
                )
              }
              placeholder="20"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.carbohydrates",
                {
                  defaultValue:
                    "Carbohydrates (g)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={
                nutrition.carbohydrates
              }
              onChange={(event) =>
                updateNutrition(
                  "carbohydrates",
                  event.target.value,
                )
              }
              placeholder="45"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.fat",
                {
                  defaultValue:
                    "Fat (g)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={nutrition.fat}
              onChange={(event) =>
                updateNutrition(
                  "fat",
                  event.target.value,
                )
              }
              placeholder="12"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.fiber",
                {
                  defaultValue:
                    "Fiber (g)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={nutrition.fiber}
              onChange={(event) =>
                updateNutrition(
                  "fiber",
                  event.target.value,
                )
              }
              placeholder="5"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.sugar",
                {
                  defaultValue:
                    "Sugar (g)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={nutrition.sugar}
              onChange={(event) =>
                updateNutrition(
                  "sugar",
                  event.target.value,
                )
              }
              placeholder="8"
            />
          </label>

          <label className="recipe-field">
            <span>
              {t(
                "recipeEditor.sodium",
                {
                  defaultValue:
                    "Sodium (mg)",
                },
              )}
            </span>

            <input
              type="number"
              min="0"
              step="1"
              value={nutrition.sodium}
              onChange={(event) =>
                updateNutrition(
                  "sodium",
                  event.target.value,
                )
              }
              placeholder="450"
            />
          </label>
        </div>
      </section>

      <section className="recipe-form-section">
        <div className="recipe-form-section-heading">
          <span>05</span>
          <div>
            <h2>
              {t(
                "recipeEditor.ingredientsTitle",
              )}
            </h2>

            <p>
              {t(
                "recipeEditor.ingredientsText",
              )}
            </p>
          </div>
        </div>

        <div className="recipe-ingredients-list">
          {ingredients.map(
            (ingredient, index) => (
              <div
                className="recipe-ingredient-row"
                key={index}
              >
                <input
                  type="text"
                  value={
                    ingredient.quantity
                  }
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "quantity",
                      event.target.value,
                    )
                  }
                  placeholder="2"
                  aria-label={t(
                    "recipeEditor.quantity",
                  )}
                />

                <input
                  type="text"
                  value={
                    ingredient.unit
                  }
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "unit",
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    "recipeEditor.unitPlaceholder",
                  )}
                  aria-label={t(
                    "recipeEditor.unit",
                  )}
                />

                <input
                  type="text"
                  value={
                    ingredient.ingredient
                  }
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "ingredient",
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    "recipeEditor.ingredientPlaceholder",
                  )}
                  aria-label={t(
                    "recipeEditor.ingredient",
                  )}
                />

                <button
                  type="button"
                  className="recipe-remove-button"
                  onClick={() =>
                    removeIngredient(
                      index,
                    )
                  }
                  disabled={
                    ingredients.length ===
                    1
                  }
                  aria-label={t(
                    "recipeEditor.removeIngredient",
                  )}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            className="recipe-add-row-button"
            onClick={addIngredient}
          >
            <Plus size={18} />

            {t(
              "recipeEditor.addIngredient",
            )}
          </button>
        </div>
      </section>

      <section className="recipe-form-section">
        <div className="recipe-form-section-heading">
          <span>04</span>

          <div>
            <h2>
              {t(
                "recipeEditor.instructionsTitle",
              )}
            </h2>

            <p>
              {t(
                "recipeEditor.instructionsText",
              )}
            </p>
          </div>
        </div>

        <div className="recipe-instructions-list">
          {instructions.map(
            (instruction, index) => (
              <div
                className="recipe-instruction-row"
                key={index}
              >
                <div className="recipe-step-number">
                  {index + 1}
                </div>

                <textarea
                  value={instruction}
                  onChange={(event) =>
                    updateInstruction(
                      index,
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    "recipeEditor.stepPlaceholder",
                    {
                      number:
                        index + 1,
                    },
                  )}
                  rows={3}
                />

                <button
                  type="button"
                  className="recipe-remove-button"
                  onClick={() =>
                    removeInstruction(
                      index,
                    )
                  }
                  disabled={
                    instructions.length ===
                    1
                  }
                  aria-label={t(
                    "recipeEditor.removeInstruction",
                  )}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            className="recipe-add-row-button"
            onClick={addInstruction}
          >
            <Plus size={18} />

            {t(
              "recipeEditor.addStep",
            )}
          </button>
        </div>
</section>

{error && (
  <div className="create-recipe-error">
    {error}
  </div>
)}

<div className="create-recipe-actions">
  {existingRecipeStatus === "approved" ? (
    <button
      type="button"
      className="recipe-submit-button"
      disabled={submitting}
      onClick={() =>
        saveRecipe("draft")
      }
    >
      <Save size={18} />

      {submitting
        ? t(
            "recipeEditor.saving",
          )
        : t(
            "recipeEditor.saveChanges",
            {
              defaultValue:
                "Save changes",
            },
          )}
    </button>
  ) : (
    <>
      <button
        type="button"
        className="recipe-draft-button"
        disabled={submitting}
        onClick={() =>
          saveRecipe("draft")
        }
      >
        <Save size={18} />

        {submitting
          ? t(
              "recipeEditor.saving",
            )
          : t(
              "recipeEditor.saveDraft",
            )}
      </button>

      <button
        type="button"
        className="recipe-submit-button"
        disabled={submitting}
        onClick={() =>
          saveRecipe("pending")
        }
      >
        <Send size={18} />

        {submitting
          ? t(
              "recipeEditor.saving",
            )
          : isAdmin
            ? t(
                "recipeEditor.publish",
              )
            : t(
                "recipeEditor.submitApproval",
              )}
      </button>
    </>
  )}
</div>
    </div>
  </main>
);
}

export default CreateRecipePage;
