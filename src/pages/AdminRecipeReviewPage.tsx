import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  ChefHat,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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

  original_language:
    | "en"
    | "fr"
    | "ar";

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
  const { t } = useTranslation();

  const [recipes, setRecipes] =
    useState<PendingRecipe[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    selectedRecipe,
    setSelectedRecipe,
  ] = useState<PendingRecipe | null>(
    null,
  );

  const [adminNote, setAdminNote] =
    useState("");

  const [moderating, setModerating] =
    useState(false);

  function languageLabel(
    language: PendingRecipe["original_language"],
  ) {
    if (language === "fr") {
      return t("language.french");
    }

    if (language === "ar") {
      return t("language.arabic");
    }

    return t("language.english");
  }

  async function loadPendingRecipes() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getPendingRecipes();

      setRecipes(
        data as PendingRecipe[],
      );

      setSelectedRecipe(
        (current) => {
          if (!current) {
            return (
              (data[0] as
                | PendingRecipe
                | undefined) ?? null
            );
          }

          const updatedRecipe =
            data.find(
              (recipe) =>
                recipe.id ===
                current.id,
            );

          return (
            (updatedRecipe as
              | PendingRecipe
              | undefined) ??
            (data[0] as
              | PendingRecipe
              | undefined) ??
            null
          );
        },
      );
    } catch (err) {
      console.error(err);

      setError(
        t(
          "adminRecipeReview.loadError",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingRecipes();
  }, []);

  async function handleModeration(
    status: RecipeModerationStatus,
  ) {
    if (!selectedRecipe) {
      return;
    }

    if (
      status ===
        "changes_requested" &&
      !adminNote.trim()
    ) {
      setError(
        t(
          "adminRecipeReview.changesNoteRequired",
        ),
      );

      return;
    }

    if (
      status === "declined" &&
      !adminNote.trim()
    ) {
      setError(
        t(
          "adminRecipeReview.declineReasonRequired",
        ),
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

      const remainingRecipes =
        recipes.filter(
          (recipe) =>
            recipe.id !==
            selectedRecipe.id,
        );

      setRecipes(
        remainingRecipes,
      );

      setSelectedRecipe(
        remainingRecipes[0] ??
          null,
      );

      setAdminNote("");
    } catch (err) {
      console.error(err);

      setError(
        t(
          "adminRecipeReview.updateError",
        ),
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

          <span>
            {t(
              "adminRecipeReview.loading",
            )}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-recipes-page">
      <div className="admin-recipes-container">
        <header className="admin-recipes-header">
          <div>
            <p className="eyebrow">
              {t(
                "adminRecipeReview.dashboard",
              )}
            </p>

            <h1>
              {t(
                "adminRecipeReview.title",
              )}
            </h1>

            <p>
              {t(
                "adminRecipeReview.intro",
              )}
            </p>
          </div>

<div className="admin-recipes-header-actions">
  <Link
    to="/admin"
    className="admin-recipes-secondary-button"
  >
    {t("profile.adminDashboard", {
      defaultValue: "Admin dashboard",
    })}
  </Link>

  <Link
    to="/admin/cook-applications"
    className="admin-recipes-secondary-button"
  >
    {t("profile.cookApplications", {
      defaultValue: "Cook applications",
    })}
  </Link>

  <button
    type="button"
    className="admin-recipes-refresh"
    onClick={loadPendingRecipes}
  >
    <RefreshCw size={17} />

    {t(
      "adminRecipeReview.refresh",
    )}
  </button>
</div>
        </header>

        {error && (
          <div className="admin-recipes-error">
            {error}
          </div>
        )}

        {recipes.length === 0 ? (
          <section className="admin-recipes-empty">
            <Check size={32} />

            <h2>
              {t(
                "adminRecipeReview.emptyTitle",
              )}
            </h2>

            <p>
              {t(
                "adminRecipeReview.emptyText",
              )}
            </p>
          </section>
        ) : (
          <div className="admin-recipes-layout">
            <aside className="admin-recipes-list">
              <div className="admin-recipes-list-heading">
                <span>
                  {t(
                    "adminRecipeReview.pending",
                  )}
                </span>

                <strong>
                  {recipes.length}
                </strong>
              </div>

              {recipes.map(
                (recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className={
                      selectedRecipe?.id ===
                      recipe.id
                        ? "admin-recipe-list-item active"
                        : "admin-recipe-list-item"
                    }
                    onClick={() => {
                      setSelectedRecipe(
                        recipe,
                      );

                      setAdminNote("");
                      setError(null);
                    }}
                  >
                    {recipe.image_url ? (
                      <img
                        src={
                          recipe.image_url
                        }
                        alt=""
                      />
                    ) : (
                      <div className="admin-recipe-list-placeholder">
                        <ChefHat
                          size={20}
                        />
                      </div>
                    )}

                    <div>
                      <strong>
                        {recipe.title}
                      </strong>

                      <span>
                        {recipe.cook
                          ?.display_name ??
                          recipe.cook
                            ?.username ??
                          t(
                            "adminRecipeReview.cookFallback",
                          )}
                      </span>
                    </div>
                  </button>
                ),
              )}
            </aside>

            {selectedRecipe && (
              <section className="admin-recipe-review">
                {selectedRecipe.image_url && (
                  <img
                    src={
                      selectedRecipe.image_url
                    }
                    alt={
                      selectedRecipe.title
                    }
                    className="admin-recipe-cover"
                  />
                )}

                <div className="admin-recipe-content">
                  <div className="admin-recipe-topline">
                    <span className="admin-recipe-pending-badge">
                      {t(
                        "adminRecipeReview.pendingApproval",
                      )}
                    </span>

                    <span>
                      {languageLabel(
                        selectedRecipe.original_language,
                      )}
                    </span>
                  </div>

                  <h2>
                    {selectedRecipe.title}
                  </h2>

                  <div className="admin-recipe-cook">
                    {selectedRecipe.cook
                      ?.profile_image_url ? (
                      <img
                        src={
                          selectedRecipe
                            .cook
                            .profile_image_url
                        }
                        alt=""
                      />
                    ) : (
                      <div className="admin-recipe-cook-placeholder">
                        <ChefHat
                          size={17}
                        />
                      </div>
                    )}

                    <div>
                      <span>
                        {t(
                          "adminRecipeReview.submittedBy",
                        )}
                      </span>

                      <strong>
                        {selectedRecipe
                          .cook
                          ?.display_name ??
                          selectedRecipe
                            .cook
                            ?.username ??
                          t(
                            "adminRecipeReview.cookFallback",
                          )}
                      </strong>
                    </div>
                  </div>

                  {selectedRecipe.description && (
                    <p className="admin-recipe-description">
                      {
                        selectedRecipe.description
                      }
                    </p>
                  )}

                  <div className="admin-recipe-meta">
                    {selectedRecipe.category && (
                      <span>
                        {t(
                          `categories.${selectedRecipe.category}`,
                          {
                            defaultValue:
                              selectedRecipe.category,
                          },
                        )}
                      </span>
                    )}

                    {selectedRecipe.prep_minutes !==
                      null && (
                      <span>
                        <Clock3
                          size={14}
                        />

                        {t(
                          "adminRecipeReview.prepTime",
                          {
                            count:
                              selectedRecipe.prep_minutes,
                          },
                        )}
                      </span>
                    )}

                    {selectedRecipe.cook_minutes !==
                      null && (
                      <span>
                        <Clock3
                          size={14}
                        />

                        {t(
                          "adminRecipeReview.cookTime",
                          {
                            count:
                              selectedRecipe.cook_minutes,
                          },
                        )}
                      </span>
                    )}

                    {selectedRecipe.servings !==
                      null && (
                      <span>
                        <Users
                          size={14}
                        />

                        {t(
                          "adminRecipeReview.servings",
                          {
                            count:
                              selectedRecipe.servings,
                          },
                        )}
                      </span>
                    )}
                  </div>

                  <div className="admin-recipe-section">
                    <h3>
                      {t(
                        "adminRecipeReview.ingredients",
                      )}
                    </h3>

                    <ul>
                      {selectedRecipe.ingredients.map(
                        (
                          ingredient,
                          index,
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            <strong>
                              {[
                                ingredient.quantity,
                                ingredient.unit,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " ",
                                )}
                            </strong>

                            <span>
                              {
                                ingredient.ingredient
                              }
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="admin-recipe-section">
                    <h3>
                      {t(
                        "adminRecipeReview.instructions",
                      )}
                    </h3>

                    <div className="admin-review-instructions">
                      {selectedRecipe.instructions.map(
                        (
                          instruction,
                          index,
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="admin-review-step"
                          >
                            <span>
                              {index +
                                1}
                            </span>

                            <p>
                              {
                                instruction.text
                              }
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="admin-review-note">
                    <label htmlFor="admin-recipe-note">
                      <MessageSquareText
                        size={17}
                      />

                      {t(
                        "adminRecipeReview.adminNote",
                      )}
                    </label>

                    <textarea
                      id="admin-recipe-note"
                      value={adminNote}
                      onChange={(
                        event,
                      ) =>
                        setAdminNote(
                          event.target
                            .value,
                        )
                      }
                      rows={4}
                      placeholder={t(
                        "adminRecipeReview.notePlaceholder",
                      )}
                    />
                  </div>

                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-review-decline"
                      disabled={
                        moderating
                      }
                      onClick={() =>
                        handleModeration(
                          "declined",
                        )
                      }
                    >
                      <X size={17} />

                      {t(
                        "adminRecipeReview.decline",
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-review-changes"
                      disabled={
                        moderating
                      }
                      onClick={() =>
                        handleModeration(
                          "changes_requested",
                        )
                      }
                    >
                      <MessageSquareText
                        size={17}
                      />

                      {t(
                        "adminRecipeReview.requestChanges",
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-review-approve"
                      disabled={
                        moderating
                      }
                      onClick={() =>
                        handleModeration(
                          "approved",
                        )
                      }
                    >
                      <Check size={17} />

                      {moderating
                        ? t(
                            "adminRecipeReview.saving",
                          )
                        : t(
                            "adminRecipeReview.approve",
                          )}
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