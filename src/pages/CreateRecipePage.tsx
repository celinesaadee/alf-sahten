import { useEffect, useState } from "react";
import {
  Link,
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

import { supabase } from "../lib/supabase";

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

function CreateRecipePage() {
  const navigate = useNavigate();
  const { id: recipeId } = useParams();

  const isEditing = Boolean(recipeId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

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

  const [language, setLanguage] =
    useState<RecipeLanguage>("en");

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

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
            "You must be signed in to edit a recipe.",
          );
        }

        const recipe = await getCookRecipeById(
          recipeId!,
          user.id,
        );

        if (!["draft", "changes_requested", "declined"].includes(recipe.status)) {
          setEditBlockedMessage(
            recipe.status === "pending"
              ? "This recipe is waiting for review and cannot be edited right now."
              : recipe.status === "approved"
                ? "This recipe is published and is no longer open for editing."
                : "This recipe is not available for editing.",
          );
          return;
        }

        setTitle(recipe.title ?? "");
        setDescription(recipe.description ?? "");
        setCategory(recipe.category ?? "");
        setImageUrl(recipe.image_url ?? null);
setOriginalImageUrl(recipe.image_url ?? null);
setImagePreview(recipe.image_url ?? null);

        setPrepMinutes(
          recipe.prep_minutes !== null &&
            recipe.prep_minutes !== undefined
            ? String(recipe.prep_minutes)
            : "",
        );

        setCookMinutes(
          recipe.cook_minutes !== null &&
            recipe.cook_minutes !== undefined
            ? String(recipe.cook_minutes)
            : "",
        );

        setServings(
          recipe.servings !== null &&
            recipe.servings !== undefined
            ? String(recipe.servings)
            : "",
        );

        setLanguage(
          (recipe.original_language ??
            "en") as RecipeLanguage,
        );

        if (
          Array.isArray(recipe.ingredients) &&
          recipe.ingredients.length > 0
        ) {
          setIngredients(
            recipe.ingredients.map((ingredient: any) => ({
              quantity: ingredient.quantity ?? "",
              unit: ingredient.unit ?? "",
              ingredient: ingredient.ingredient ?? "",
            })),
          );
        }

        if (
          Array.isArray(recipe.instructions) &&
          recipe.instructions.length > 0
        ) {
          setInstructions(
            recipe.instructions.map(
              (instruction: any) =>
                instruction.text ?? "",
            ),
          );
        }
      } catch (err) {
        console.error(err);

        setEditBlockedMessage(
          "We couldn't load this recipe. Make sure it belongs to your account.",
        );
      } finally {
        setLoadingRecipe(false);
      }
    }

    loadRecipe();
  }, [recipeId]);

  function handleImageChange(
  event: React.ChangeEvent<HTMLInputElement>,
) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setError("Please choose an image file.");
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    setError(
      "The original photo is too large. Please choose an image smaller than 15 MB.",
    );
    return;
  }

  setError(null);
  setSelectedImageFile(file);

  const previewUrl = URL.createObjectURL(file);

  setImagePreview((current) => {
    if (current?.startsWith("blob:")) {
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
    if (loadingRecipe || editBlockedMessage || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      if (!title.trim()) {
        setError("Please enter a recipe name.");
        return;
      }

      const cleanedIngredients = ingredients.filter(
        (ingredient) =>
          ingredient.quantity.trim() ||
          ingredient.unit.trim() ||
          ingredient.ingredient.trim(),
      );

      const cleanedInstructions = instructions
        .map((instruction) => instruction.trim())
        .filter(Boolean)
        .map((instruction, index) => ({
          step: index + 1,
          text: instruction,
        }));

      if (status === "pending") {
        if (cleanedIngredients.length === 0) {
          setError(
            "Add at least one ingredient before submitting the recipe.",
          );
          return;
        }

        if (cleanedInstructions.length === 0) {
          setError(
            "Add at least one instruction before submitting the recipe.",
          );
          return;
        }
      }

      let finalImageUrl = imageUrl;

if (selectedImageFile) {
  finalImageUrl = await uploadRecipeImage(
    selectedImageFile,
  );
}

      const recipeInput = {
        title: title.trim(),
        description: description.trim(),
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

        ingredients: cleanedIngredients,
        instructions: cleanedInstructions,
        original_language: language,
        status,
      };

      if (recipeId) {
  await updateRecipe(recipeId, recipeInput);

  if (
    originalImageUrl &&
    originalImageUrl !== finalImageUrl
  ) {
    await deleteRecipeImageByUrl(originalImageUrl);
  }
} else {
  await createRecipe(recipeInput);
}

      navigate("/cook/recipes");
    } catch (err) {
      console.error(err);

      setError(
        isEditing
          ? "We couldn't update your recipe. Please try again."
          : "We couldn't save your recipe. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRecipe) {
    return (
      <main className="create-recipe-page">
        <div className="create-recipe-container">
          <p>Loading recipe...</p>
        </div>
      </main>
    );
  }

  if (isEditing && editBlockedMessage) {
    return (
      <main className="create-recipe-page">
        <div className="create-recipe-container">
          <Link to="/cook/recipes" className="create-recipe-back">
            <ArrowLeft size={18} />
            My recipes
          </Link>
          <header className="create-recipe-header">
            <h1>Recipe unavailable for editing</h1>
            <p role="alert">{editBlockedMessage}</p>
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
          My recipes
        </Link>

        <header className="create-recipe-header">
          <p className="eyebrow">Cook dashboard</p>

          <h1>
            {isEditing
              ? "Edit recipe"
              : "Create a recipe"}
          </h1>

          <p>
            {isEditing
              ? "Update your recipe details or submit it for approval when it is ready."
              : "Add your recipe details. You can save it as a draft or submit it for approval when it is ready."}
          </p>
        </header>

        {error && (
          <div className="create-recipe-error">
            {error}
          </div>
        )}

        <section className="recipe-form-section">
          <div className="recipe-form-section-heading">
            <span>01</span>

            <div>
              <h2>Recipe details</h2>
              <p>Start with the basic information.</p>
            </div>
          </div>

          <div className="recipe-form-grid">
            <label className="recipe-field recipe-field-full">
              <span>Recipe name *</span>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Lebanese lentil soup"
              />
            </label>

            <label className="recipe-field recipe-field-full">
              <span>Description</span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Tell people a little about this recipe..."
                rows={4}
              />
            </label>

            <div className="recipe-field recipe-field-full">
  <span>Recipe photo</span>

  {!imagePreview ? (
    <label className="recipe-image-upload">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
      />

      <ImagePlus size={28} />

      <strong>Browse for a photo</strong>

      <small>
        JPG, PNG or WebP. Large photos are automatically
        compressed before upload.
      </small>
    </label>
  ) : (
    <div className="recipe-image-preview">
      <img
        src={imagePreview}
        alt="Recipe preview"
      />

      <div className="recipe-image-preview-actions">
        <label className="recipe-change-image-button">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />

          <ImagePlus size={17} />
          Change photo
        </label>

        <button
          type="button"
          className="recipe-remove-image-button"
          onClick={removeSelectedImage}
        >
          <X size={17} />
          Remove
        </button>
      </div>
    </div>
  )}
</div>

            <div className="recipe-field">
  <span>Category</span>

  <select
    value={
      categoryMode === "other"
        ? "__other__"
        : category
    }
    onChange={(event) => {
      const value = event.target.value;

      if (value === "__other__") {
        setCategoryMode("other");
        setCategory("");
      } else {
        setCategoryMode("existing");
        setCategory(value);
        setCustomCategory("");
      }
    }}
  >
    <option value="">Choose a category</option>

    {categories.map((item) => (
      <option key={item.id} value={item.name}>
        {item.name}
      </option>
    ))}

    <option value="__other__">Other</option>
  </select>

  {categoryMode === "other" && (
    <input
      type="text"
      value={customCategory}
      onChange={(event) =>
        setCustomCategory(event.target.value)
      }
      placeholder="Type another category"
    />
  )}
</div>

            <label className="recipe-field">
              <span>Recipe language</span>

              <select
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value as RecipeLanguage,
                  )
                }
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
            </label>
          </div>
        </section>

        <section className="recipe-form-section">
          <div className="recipe-form-section-heading">
            <span>02</span>

            <div>
              <h2>Time & servings</h2>
              <p>Help people know what to expect.</p>
            </div>
          </div>

          <div className="recipe-form-grid recipe-time-grid">
            <label className="recipe-field">
              <span>Prep time</span>

              <div className="recipe-number-field">
                <input
                  type="number"
                  min="0"
                  value={prepMinutes}
                  onChange={(event) =>
                    setPrepMinutes(event.target.value)
                  }
                  placeholder="15"
                />

                <span>min</span>
              </div>
            </label>

            <label className="recipe-field">
              <span>Cook time</span>

              <div className="recipe-number-field">
                <input
                  type="number"
                  min="0"
                  value={cookMinutes}
                  onChange={(event) =>
                    setCookMinutes(event.target.value)
                  }
                  placeholder="30"
                />

                <span>min</span>
              </div>
            </label>

            <label className="recipe-field">
              <span>Servings</span>

              <input
                type="number"
                min="1"
                value={servings}
                onChange={(event) =>
                  setServings(event.target.value)
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
              <h2>Ingredients</h2>

              <p>
                Add ingredients one by one so they can be
                searchable later.
              </p>
            </div>
          </div>

          <div className="recipe-ingredients-list">
            {ingredients.map((ingredient, index) => (
              <div
                className="recipe-ingredient-row"
                key={index}
              >
                <input
                  type="text"
                  value={ingredient.quantity}
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "quantity",
                      event.target.value,
                    )
                  }
                  placeholder="2"
                  aria-label="Quantity"
                />

                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "unit",
                      event.target.value,
                    )
                  }
                  placeholder="cups"
                  aria-label="Unit"
                />

                <input
                  type="text"
                  value={ingredient.ingredient}
                  onChange={(event) =>
                    updateIngredient(
                      index,
                      "ingredient",
                      event.target.value,
                    )
                  }
                  placeholder="Flour"
                  aria-label="Ingredient"
                />

                <button
                  type="button"
                  className="recipe-remove-button"
                  onClick={() =>
                    removeIngredient(index)
                  }
                  disabled={ingredients.length === 1}
                  aria-label="Remove ingredient"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="recipe-add-row-button"
              onClick={addIngredient}
            >
              <Plus size={18} />
              Add ingredient
            </button>
          </div>
        </section>

        <section className="recipe-form-section">
          <div className="recipe-form-section-heading">
            <span>04</span>

            <div>
              <h2>Instructions</h2>
              <p>Write the method step by step.</p>
            </div>
          </div>

          <div className="recipe-instructions-list">
            {instructions.map((instruction, index) => (
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
                  placeholder={`Describe step ${index + 1}...`}
                  rows={3}
                />

                <button
                  type="button"
                  className="recipe-remove-button"
                  onClick={() =>
                    removeInstruction(index)
                  }
                  disabled={instructions.length === 1}
                  aria-label="Remove instruction"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="recipe-add-row-button"
              onClick={addInstruction}
            >
              <Plus size={18} />
              Add step
            </button>
          </div>
        </section>

        <div className="create-recipe-actions">
          <button
            type="button"
            className="recipe-draft-button"
            disabled={submitting}
            onClick={() => saveRecipe("draft")}
          >
            <Save size={18} />

            {submitting
              ? "Saving..."
              : "Save as draft"}
          </button>

          <button
            type="button"
            className="recipe-submit-button"
            disabled={submitting}
            onClick={() => saveRecipe("pending")}
          >
            <Send size={18} />

            {submitting
              ? "Saving..."
              : "Submit for approval"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default CreateRecipePage;
