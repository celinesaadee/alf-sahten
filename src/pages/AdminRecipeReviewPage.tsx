import { useEffect, useState } from "react";
import {
  Check,
  ChefHat,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import {
  getPendingRecipes,
  moderateRecipe,
  type RecipeModerationStatus,
} from "../services/recipes";

import "./AdminRecipeReviewPage.css";

type PendingRecipe = {
  id: string;
  creator_id: string;

  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;

  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;

  ingredients: Array<{
    quantity?: string;
    unit?: string;
    ingredient?: string;
  }>;

  instructions: Array<{
    step?: number;
    text?: string;
  }>;

  original_language: "en" | "fr" | "ar";

  status: string;
  created_at: string;

  cook: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    profile_image_url: string | null;
  } | null;
};

function AdminRecipeReviewPage() {
  const [recipes, setRecipes] = useState<PendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] =
    useState<PendingRecipe | null>(null);

  const [adminNote, setAdminNote] = useState("");

  const [moderating, setModerating] = useState(false);

  async function loadPendingRecipes() {
    try {
      setLoading(true);
      setError(null);

      const data = await getPendingRecipes();

      setRecipes(data as PendingRecipe[]);

      setSelectedRecipe((current) => {
        if (!current) {
          return data[0] as PendingRecipe | null;
        }

        const updatedRecipe = data.find(
          (recipe) => recipe.id === current.id,
        );

        return (
          (updatedRecipe as PendingRecipe | undefined) ??
          (data[0] as PendingRecipe | undefined) ??
          null
        );
      });
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't load the recipes waiting for review.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingRecipes();
  }, []);

  async function handleModeration(
    status: RecipeModerationStatus,
  ) {
    if (!selectedRecipe) {
      return;
    }

    if (
      status === "changes_requested" &&
      !adminNote.trim()
    ) {
      setError(
        "Write a note explaining what the cook should change.",
      );

      return;
    }

    if (
      status === "declined" &&
      !adminNote.trim()
    ) {
      setError(
        "Write a reason before declining the recipe.",
      );

      return;
    }

    try {
      setModerating(true);
      setError(null);

      await moderateRecipe(
        selectedRecipe.id,
        status,
        adminNote,
      );

      const remainingRecipes = recipes.filter(
        (recipe) => recipe.id !== selectedRecipe.id,
      );

      setRecipes(remainingRecipes);
      setSelectedRecipe(remainingRecipes[0] ?? null);
      setAdminNote("");
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't update this recipe. Please try again.",
      );
    } finally {
      setModerating(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-recipes-page">
        <div className="admin-recipes-loading">
          <ChefHat size={30} />
          <span>Loading recipes...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-recipes-page">
      <div className="admin-recipes-container">
        <header className="admin-recipes-header">
          <div>
            <p className="eyebrow">Admin dashboard</p>

            <h1>Recipe review</h1>

            <p>
              Review recipes submitted by cooks before they
              appear publicly on Alf Sahten.
            </p>
          </div>

          <button
            type="button"
            className="admin-recipes-refresh"
            onClick={loadPendingRecipes}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="admin-recipes-error">
            {error}
          </div>
        )}

        {recipes.length === 0 ? (
          <section className="admin-recipes-empty">
            <Check size={32} />

            <h2>Everything is reviewed</h2>

            <p>
              There are no recipes waiting for approval.
            </p>
          </section>
        ) : (
          <div className="admin-recipes-layout">
            <aside className="admin-recipes-list">
              <div className="admin-recipes-list-heading">
                <span>Pending</span>

                <strong>{recipes.length}</strong>
              </div>

              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className={
                    selectedRecipe?.id === recipe.id
                      ? "admin-recipe-list-item active"
                      : "admin-recipe-list-item"
                  }
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setAdminNote("");
                    setError(null);
                  }}
                >
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt=""
                    />
                  ) : (
                    <div className="admin-recipe-list-placeholder">
                      <ChefHat size={20} />
                    </div>
                  )}

                  <div>
                    <strong>{recipe.title}</strong>

                    <span>
                      {recipe.cook?.display_name ??
                        recipe.cook?.username ??
                        "Cook"}
                    </span>
                  </div>
                </button>
              ))}
            </aside>

            {selectedRecipe && (
              <section className="admin-recipe-review">
                {selectedRecipe.image_url && (
                  <img
                    src={selectedRecipe.image_url}
                    alt={selectedRecipe.title}
                    className="admin-recipe-cover"
                  />
                )}

                <div className="admin-recipe-content">
                  <div className="admin-recipe-topline">
                    <span className="admin-recipe-pending-badge">
                      Pending approval
                    </span>

                    <span>
                      {selectedRecipe.original_language.toUpperCase()}
                    </span>
                  </div>

                  <h2>{selectedRecipe.title}</h2>

                  <div className="admin-recipe-cook">
                    {selectedRecipe.cook?.profile_image_url ? (
                      <img
                        src={
                          selectedRecipe.cook.profile_image_url
                        }
                        alt=""
                      />
                    ) : (
                      <div className="admin-recipe-cook-placeholder">
                        <ChefHat size={17} />
                      </div>
                    )}

                    <div>
                      <span>Submitted by</span>

                      <strong>
                        {selectedRecipe.cook?.display_name ??
                          selectedRecipe.cook?.username ??
                          "Cook"}
                      </strong>
                    </div>
                  </div>

                  {selectedRecipe.description && (
                    <p className="admin-recipe-description">
                      {selectedRecipe.description}
                    </p>
                  )}

                  <div className="admin-recipe-meta">
                    {selectedRecipe.category && (
                      <span>{selectedRecipe.category}</span>
                    )}

                    {selectedRecipe.prep_minutes !== null && (
                      <span>
                        <Clock3 size={14} />
                        {selectedRecipe.prep_minutes} min prep
                      </span>
                    )}

                    {selectedRecipe.cook_minutes !== null && (
                      <span>
                        <Clock3 size={14} />
                        {selectedRecipe.cook_minutes} min cook
                      </span>
                    )}

                    {selectedRecipe.servings !== null && (
                      <span>
                        <Users size={14} />
                        {selectedRecipe.servings} servings
                      </span>
                    )}
                  </div>

                  <div className="admin-recipe-section">
                    <h3>Ingredients</h3>

                    <ul>
                      {selectedRecipe.ingredients.map(
                        (ingredient, index) => (
                          <li key={index}>
                            <strong>
                              {[
                                ingredient.quantity,
                                ingredient.unit,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </strong>

                            <span>
                              {ingredient.ingredient}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="admin-recipe-section">
                    <h3>Instructions</h3>

                    <div className="admin-review-instructions">
                      {selectedRecipe.instructions.map(
                        (instruction, index) => (
                          <div
                            key={index}
                            className="admin-review-step"
                          >
                            <span>{index + 1}</span>

                            <p>{instruction.text}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="admin-review-note">
                    <label htmlFor="admin-recipe-note">
                      <MessageSquareText size={17} />

                      Admin note
                    </label>

                    <textarea
                      id="admin-recipe-note"
                      value={adminNote}
                      onChange={(event) =>
                        setAdminNote(event.target.value)
                      }
                      rows={4}
                      placeholder="Optional when approving. Required when requesting changes or declining."
                    />
                  </div>

                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-review-decline"
                      disabled={moderating}
                      onClick={() =>
                        handleModeration("declined")
                      }
                    >
                      <X size={17} />
                      Decline
                    </button>

                    <button
                      type="button"
                      className="admin-review-changes"
                      disabled={moderating}
                      onClick={() =>
                        handleModeration(
                          "changes_requested",
                        )
                      }
                    >
                      <MessageSquareText size={17} />
                      Request changes
                    </button>

                    <button
                      type="button"
                      className="admin-review-approve"
                      disabled={moderating}
                      onClick={() =>
                        handleModeration("approved")
                      }
                    >
                      <Check size={17} />

                      {moderating
                        ? "Saving..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminRecipeReviewPage;