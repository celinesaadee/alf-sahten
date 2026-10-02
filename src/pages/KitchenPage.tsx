import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Check,
  ChefHat,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getCanonicalIngredientName,
  getLocalizedIngredientName,
} from "../data/recipeTranslations";

import { useKitchenIngredients } from "../hooks/useKitchenIngredients";
import { usePublishedRecipes } from "../hooks/usePublishedRecipes";

const suggestedIngredients = [
  "Chicken breasts",
  "Tomatoes",
  "Potatoes",
  "Garlic cloves",
  "Onion",
  "Parsley",
  "Labneh",
  "Pita breads",
  "Lemon",
  "Cucumber",
];

function normalizeIngredientForMatching(
  ingredient: string,
) {
  const normalized = ingredient
    .trim()
    .toLowerCase();

  const aliases: Record<string, string> = {
    chicken: "chicken breasts",
    "chicken breast": "chicken breasts",
    "chicken breasts": "chicken breasts",

    garlic: "garlic cloves",
    "garlic clove": "garlic cloves",
    "garlic cloves": "garlic cloves",

    "pita bread": "pita breads",
    "pita breads": "pita breads",

    tomato: "tomatoes",
    tomatoes: "tomatoes",

    lemon: "lemon",
    lemons: "lemon",

    onion: "onion",
    "small onion": "onion",

    oregano: "oregano",
    "dried oregano": "oregano",
  };

  return aliases[normalized] ?? normalized;
}

function canonicalIngredientForDisplay(
  ingredient: string,
) {
  const normalized =
    normalizeIngredientForMatching(
      ingredient,
    );

  const displayNames: Record<string, string> = {
    "chicken breasts": "Chicken breasts",
    "garlic cloves": "Garlic cloves",
    "pita breads": "Pita breads",
    tomatoes: "Tomatoes",
    lemon: "Lemon",
    onion: "Onion",
    oregano: "Oregano",
  };

  return displayNames[normalized] ?? ingredient;
}

function KitchenPage() {
  const { t, i18n } = useTranslation();

  const {
    ingredients,
    loading: kitchenLoading,
    addIngredient,
    removeIngredient,
  } = useKitchenIngredients();

  const {
    recipes,
    loading: recipesLoading,
    error: recipesError,
  } = usePublishedRecipes();

  const [
    ingredientInput,
    setIngredientInput,
  ] = useState("");

  const normalizedIngredients =
    useMemo(
      () =>
        ingredients.map(
          (ingredient) => {
            const canonical =
              getCanonicalIngredientName(
                ingredient,
                i18n.language,
              );

            return normalizeIngredientForMatching(
              canonical,
            );
          },
        ),
      [
        ingredients,
        i18n.language,
      ],
    );

  const recipeMatches =
    useMemo(() => {
      return recipes
        .map((recipe) => {
          const recipeIngredientNames =
            (recipe.ingredients ?? [])
              .map(
                (ingredient) =>
                  ingredient.ingredient?.trim(),
              )
              .filter(
                (
                  ingredient,
                ): ingredient is string =>
                  Boolean(ingredient),
              );

          const missingIngredients =
            recipeIngredientNames.filter(
              (ingredient) =>
                !normalizedIngredients.includes(
                  normalizeIngredientForMatching(
                    ingredient,
                  ),
                ),
            );

          const availableIngredients =
            recipeIngredientNames.filter(
              (ingredient) =>
                normalizedIngredients.includes(
                  normalizeIngredientForMatching(
                    ingredient,
                  ),
                ),
            );

          const totalMinutes =
            (recipe.prep_minutes ?? 0) +
            (recipe.cook_minutes ?? 0);

          return {
  id: recipe.id,
  title: recipe.title,
  image: recipe.image_url,
  time:
    totalMinutes > 0
      ? `${totalMinutes} ${t("publicCookProfile.minuteShort")}`
      : "",
  missingIngredients,
  availableIngredients,
  matchCount:
    availableIngredients.length,
};
})
.filter(
  (recipe) =>
    recipe.matchCount > 0 ||
    recipe.missingIngredients.length === 0,
)
.sort((a, b) => {
          if (
            a.missingIngredients.length !==
            b.missingIngredients.length
          ) {
            return (
              a.missingIngredients.length -
              b.missingIngredients.length
            );
          }

          return (
            b.matchCount -
            a.matchCount
          );
        });
    }, [
      recipes,
      normalizedIngredients,
      t,
    ]);

  const readyRecipes =
    recipeMatches.filter(
      (recipe) =>
        recipe.missingIngredients.length === 0,
    );

  const almostReadyRecipes =
    recipeMatches.filter(
      (recipe) =>
        recipe.missingIngredients.length > 0 &&
        recipe.missingIngredients.length <= 2,
    );

  async function handleAddIngredient(
    value: string,
  ) {
    const cleanedIngredient =
      value.trim();

    if (!cleanedIngredient) {
      return;
    }

    const canonicalIngredient =
      getCanonicalIngredientName(
        cleanedIngredient,
        i18n.language,
      );

    const normalizedNewIngredient =
      normalizeIngredientForMatching(
        canonicalIngredient,
      );

    const alreadyExists =
      normalizedIngredients.includes(
        normalizedNewIngredient,
      );

    if (alreadyExists) {
      setIngredientInput("");
      return;
    }

    await addIngredient(
      canonicalIngredient,
    );

    setIngredientInput("");
  }

  function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    void handleAddIngredient(
      ingredientInput,
    );
  }

  async function clearKitchen() {
    await Promise.all(
      ingredients.map(
        (ingredient) =>
          removeIngredient(
            ingredient,
          ),
      ),
    );
  }

  const loading =
    kitchenLoading ||
    recipesLoading;

  if (loading) {
    return (
      <main className="kitchen-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  return (
    <main className="kitchen-page">
      <section className="kitchen-hero">
        <div className="kitchen-heading">
          <p className="section-kicker">
            {t("kitchen.kicker")}
          </p>

          <h1>
            {t("kitchen.title")}
          </h1>

          <p>
            {t("kitchen.subtitle")}
          </p>
        </div>

        <div className="kitchen-summary-card">
          <div className="kitchen-summary-icon">
            <ChefHat size={24} />
          </div>

          <div>
            <span>
              {t(
                "kitchen.yourKitchen",
              )}
            </span>

            <strong>
              {ingredients.length}{" "}
              {ingredients.length === 1
                ? t(
                    "kitchen.ingredient",
                  )
                : t(
                    "kitchen.ingredients",
                  )}
            </strong>
          </div>

          <div className="kitchen-summary-divider" />

          <div>
            <span>
              {t(
                "kitchen.readyNow",
              )}
            </span>

            <strong>
              {readyRecipes.length}{" "}
              {readyRecipes.length === 1
                ? t(
                    "kitchen.forRecipe",
                  )
                : t(
                    "kitchen.forRecipes",
                  )}
            </strong>
          </div>
        </div>
      </section>

      <section className="kitchen-content">
        <div className="kitchen-panel">
          <div className="kitchen-panel-heading">
            <div>
              <p className="section-kicker">
                {t(
                  "kitchen.pantryTitle",
                )}
              </p>

              <h2>
                {t(
                  "kitchen.addIngredients",
                )}
              </h2>
            </div>

            {ingredients.length > 0 && (
              <button
                type="button"
                className="clear-kitchen-button"
                onClick={() => {
                  void clearKitchen();
                }}
              >
                <Trash2 size={15} />

                {t(
                  "kitchen.clearKitchen",
                )}
              </button>
            )}
          </div>

          <form
            className="kitchen-search"
            onSubmit={
              handleSubmit
            }
          >
            <Search size={20} />

            <input
              value={
                ingredientInput
              }
              onChange={(
                event,
              ) =>
                setIngredientInput(
                  event.target.value,
                )
              }
              placeholder={t(
                "kitchen.placeholder",
              )}
            />

            <button type="submit">
              <Plus size={18} />

              {t(
                "kitchen.add",
              )}
            </button>
          </form>

          {ingredients.length > 0 ? (
            <div className="kitchen-ingredients">
              {ingredients.map(
                (ingredient) => {
                  const canonicalDisplayName =
                    canonicalIngredientForDisplay(
                      ingredient,
                    );

                  const displayedIngredient =
                    getLocalizedIngredientName(
                      canonicalDisplayName,
                      i18n.language,
                    );

                  return (
                    <span
                      className="kitchen-ingredient-chip"
                      key={
                        ingredient
                      }
                    >
                      {
                        displayedIngredient
                      }

                      <button
                        type="button"
                        onClick={() => {
                          void removeIngredient(
                            ingredient,
                          );
                        }}
                        aria-label={t(
  "kitchen.removeIngredient",
  {
    ingredient:
      displayedIngredient,
    defaultValue:
      `Remove ${displayedIngredient}`,
  },
)}
                      >
                        <X
                          size={14}
                        />
                      </button>
                    </span>
                  );
                },
              )}
            </div>
          ) : (
            <div className="empty-kitchen">
              <ChefHat
                size={30}
                strokeWidth={1.5}
              />

              <div>
                <strong>
                  {t(
                    "kitchen.emptyTitle",
                  )}
                </strong>

                <span>
                  {t(
                    "kitchen.emptyText",
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="suggested-ingredients">
            <span className="suggestion-label">
              {t(
                "kitchen.quickAdd",
              )}
            </span>

            <div>
              {suggestedIngredients
                .filter(
                  (ingredient) =>
                    !normalizedIngredients.includes(
                      normalizeIngredientForMatching(
                        ingredient,
                      ),
                    ),
                )
                .map(
                  (ingredient) => (
                    <button
                      type="button"
                      key={
                        ingredient
                      }
                      onClick={() => {
                        void handleAddIngredient(
                          ingredient,
                        );
                      }}
                    >
                      <Plus
                        size={13}
                      />

                      {getLocalizedIngredientName(
                        ingredient,
                        i18n.language,
                      )}
                    </button>
                  ),
                )}
            </div>
          </div>
        </div>

        <aside className="kitchen-tip-card">
          <Sparkles size={22} />

          <span>
            {t(
              "kitchen.tip",
            )}
          </span>

          <h3>
            {t(
              "kitchen.tipTitle",
            )}
          </h3>

          <p>
            {t(
              "kitchen.tipText",
            )}
          </p>
        </aside>
      </section>

      <section className="kitchen-results">
        <div className="kitchen-results-heading">
          <div>
            <p className="section-kicker">
              {t(
                "kitchen.basedOnKitchen",
              )}
            </p>

            <h2>
              {t(
                "kitchen.whatYouCanCook",
              )}
            </h2>
          </div>

          {ingredients.length > 0 && (
            <span>
              {readyRecipes.length}{" "}
              {t(
                "kitchen.ready",
              )}{" "}
              ·{" "}
              {
                almostReadyRecipes.length
              }{" "}
              {t(
                "kitchen.almostReady",
              )}
            </span>
          )}
        </div>

        {recipesError ? (
          <div className="recipe-results-empty">
            <ChefHat
              size={34}
              strokeWidth={1.4}
            />

           <h3>
  {t("kitchen.loadErrorTitle", {
    defaultValue:
      "We couldn't load recipes.",
  })}
</h3>

<p>
  {t("kitchen.loadErrorText", {
    defaultValue:
      "Please refresh and try again.",
  })}
</p>
          </div>
        ) : ingredients.length === 0 ? (
          <div className="recipe-results-empty">
            <ChefHat
              size={34}
              strokeWidth={1.4}
            />

            <h3>
              {t(
                "kitchen.addToSeeMatches",
              )}
            </h3>

            <p>
              {t(
                "kitchen.suggestionsText",
              )}
            </p>
          </div>
        ) : recipeMatches.length === 0 ? (
          <div className="recipe-results-empty">
            <ChefHat
              size={34}
              strokeWidth={1.4}
            />

<h3>
  {t("kitchen.noMatchesTitle", {
    defaultValue:
      "No matching recipes yet",
  })}
</h3>

<p>
  {t("kitchen.noMatchesText", {
    defaultValue:
      "Try adding more ingredients or check back as cooks add new recipes.",
  })}
</p>

          </div>
        ) : (
          <div className="kitchen-recipe-grid">
            {recipeMatches.map(
              (recipe) => {
                const isReady =
                  recipe.missingIngredients.length ===
                  0;

                const localizedMissingIngredients =
                  recipe.missingIngredients.map(
                    (
                      ingredient,
                    ) =>
                      getLocalizedIngredientName(
                        canonicalIngredientForDisplay(
                          ingredient,
                        ),
                        i18n.language,
                      ),
                  );

                return (
                  <article
                    className="kitchen-recipe-card"
                    key={
                      recipe.id
                    }
                  >
                    <div className="kitchen-recipe-image">
                      {recipe.image ? (
                        <img
                          src={
                            recipe.image
                          }
                          alt={
                            recipe.title
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="kitchen-recipe-placeholder">
                          <ChefHat
                            size={34}
                            strokeWidth={
                              1.4
                            }
                          />
                        </div>
                      )}

                      <span
                        className={`kitchen-match-badge ${
                          isReady
                            ? "ready"
                            : ""
                        }`}
                      >
                        {isReady ? (
                          <>
                            <Check
                              size={13}
                            />

                            {t(
                              "kitchen.everything",
                            )}
                          </>
                        ) : (
                          <>
                            {
                              recipe
                                .missingIngredients
                                .length
                            }{" "}
                            {recipe
                              .missingIngredients
                              .length === 1
                              ? t(
                                  "kitchen.ingredient",
                                )
                              : t(
                                  "kitchen.ingredients",
                                )}{" "}
                            {t(
                              "kitchen.missing",
                            )}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="kitchen-recipe-content">
                      {recipe.time && (
                        <span className="kitchen-recipe-time">
                          {
                            recipe.time
                          }
                        </span>
                      )}

                      <h3>
                        {
                          recipe.title
                        }
                      </h3>

                      {!isReady && (
                        <p>
                          {t(
                            "kitchen.missingLabel",
                          )}
                          :{" "}

                          <strong>
                            {localizedMissingIngredients.join(
                              ", ",
                            )}
                          </strong>
                        </p>
                      )}

                      {isReady && (
                        <p className="ready-message">
                          {t(
                            "kitchen.readyMessage",
                          )}
                        </p>
                      )}

                      <Link
                        to={`/recipe/${recipe.id}`}
                      >
                        {t(
                          "kitchen.viewRecipe",
                        )}

                        <ArrowRight
                          size={16}
                        />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default KitchenPage;