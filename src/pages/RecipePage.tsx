import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Bookmark,
  Check,
  ChefHat,
  Clock3,
  Minus,
  Plus,
  ShoppingBasket,
  Users,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { useTranslation } from "react-i18next";

import {
  getPublishedRecipeById,
} from "../services/recipes";

import {
  useSavedRecipes,
} from "../hooks/useSavedRecipes";

type PublicRecipe = {
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

  cook: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    profile_image_url: string | null;
  } | null;
};

type DisplayIngredient = {
  quantity:
    | number
    | string
    | null;

  unit: string;
  name: string;
};

type DisplayRecipe = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string | null;
  creator: string;
  cookUsername: string | null;

  prepTime: string;
  cookTime: string;
  time: string;

  servings: number;

  ingredients: DisplayIngredient[];
  instructions: string[];
};

function parseQuantity(
  value:
    | number
    | string
    | null
    | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  const mixedFraction =
    text.match(
      /^(\d+)\s+(\d+)\/(\d+)$/,
    );

  if (mixedFraction) {
    const whole =
      Number(mixedFraction[1]);

    const numerator =
      Number(mixedFraction[2]);

    const denominator =
      Number(mixedFraction[3]);

    if (denominator === 0) {
      return null;
    }

    return (
      whole +
      numerator / denominator
    );
  }

  const fraction =
    text.match(
      /^(\d+)\/(\d+)$/,
    );

  if (fraction) {
    const numerator =
      Number(fraction[1]);

    const denominator =
      Number(fraction[2]);

    if (denominator === 0) {
      return null;
    }

    return (
      numerator / denominator
    );
  }

  const numericValue =
    Number(text);

  return Number.isFinite(
    numericValue,
  )
    ? numericValue
    : null;
}

function formatQuantity(
  quantity: number,
) {
  if (
    Number.isInteger(
      quantity,
    )
  ) {
    return quantity.toString();
  }

  return Number(
    quantity.toFixed(2),
  ).toString();
}

function formatScaledQuantity(
  quantity:
    | number
    | string
    | null,
  multiplier: number,
) {
  const numeric =
    parseQuantity(quantity);

  if (numeric === null) {
    if (
      typeof quantity ===
      "string"
    ) {
      return quantity;
    }

    return "";
  }

  return formatQuantity(
    numeric * multiplier,
  );
}

function RecipePage() {
  const { t } =
    useTranslation();

  const { id } =
    useParams();

  const {
    isSaved,
    toggleSaved,
  } = useSavedRecipes();

  const [
    publicRecipe,
    setPublicRecipe,
  ] =
    useState<PublicRecipe | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipe() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(false);

        const data =
          await getPublishedRecipeById(
            id,
          );

        if (cancelled) {
          return;
        }

        setPublicRecipe(
          data as PublicRecipe | null,
        );
      } catch (error) {
        console.error(
          "Could not load recipe:",
          error,
        );

        if (!cancelled) {
          setLoadError(true);
          setPublicRecipe(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const recipe =
    useMemo<DisplayRecipe | null>(
      () => {
        if (!publicRecipe) {
          return null;
        }

        const prepMinutes =
          publicRecipe.prep_minutes ??
          0;

        const cookMinutes =
          publicRecipe.cook_minutes ??
          0;

        const totalMinutes =
          prepMinutes +
          cookMinutes;

        const creator =
          publicRecipe.cook
            ?.display_name ??
          publicRecipe.cook
            ?.username ??
          "Cook";

          const cookUsername =
  publicRecipe.cook?.username ??
  null;

        return {
          id:
            publicRecipe.id,

          title:
            publicRecipe.title,

          description:
            publicRecipe.description ??
            "",

          category:
            publicRecipe.category ??
            "",

          image:
            publicRecipe.image_url,

          creator,
          cookUsername,

          prepTime:
            `${prepMinutes} min`,

          cookTime:
            `${cookMinutes} min`,

          time:
            `${totalMinutes} min`,

          servings:
            publicRecipe.servings ??
            1,

          ingredients:
            (
              publicRecipe.ingredients ??
              []
            ).map(
              (ingredient) => ({
                quantity:
                  ingredient.quantity ??
                  "",

                unit:
                  ingredient.unit ??
                  "",

                name:
                  ingredient.ingredient ??
                  "",
              }),
            ),

          instructions:
            (
              publicRecipe.instructions ??
              []
            )
              .map(
                (instruction) =>
                  instruction.text ??
                  "",
              )
              .filter(Boolean),
        };
      },
      [publicRecipe],
    );

  const [
    servings,
    setServings,
  ] =
    useState(1);

  const [
    checkedIngredients,
    setCheckedIngredients,
  ] =
    useState<string[]>([]);

  useEffect(() => {
    if (!recipe) {
      return;
    }

    setServings(
      recipe.servings,
    );

    setCheckedIngredients([]);
  }, [recipe]);

  const servingMultiplier =
    recipe
      ? servings /
        recipe.servings
      : 1;

  const adjustedIngredients =
    useMemo(() => {
      if (!recipe) {
        return [];
      }

      return recipe.ingredients.map(
        (ingredient) => ({
          ...ingredient,

          adjustedQuantity:
            formatScaledQuantity(
              ingredient.quantity,
              servingMultiplier,
            ),
        }),
      );
    }, [
      recipe,
      servingMultiplier,
    ]);

  function toggleIngredient(
    ingredientKey: string,
  ) {
    setCheckedIngredients(
      (current) =>
        current.includes(
          ingredientKey,
        )
          ? current.filter(
              (item) =>
                item !==
                ingredientKey,
            )
          : [
              ...current,
              ingredientKey,
            ],
    );
  }

  if (loading) {
    return (
      <main className="recipe-not-found">
        <ChefHat
          size={44}
          strokeWidth={1.4}
        />

        <h1>
          Loading recipe...
        </h1>
      </main>
    );
  }

  if (
    loadError ||
    !recipe
  ) {
    return (
      <main className="recipe-not-found">
        <ChefHat
          size={44}
          strokeWidth={1.4}
        />

        <h1>
          {t(
            "recipe.notFound",
          )}
        </h1>

        <p>
          {t(
            "recipe.notFoundText",
          )}
        </p>

        <Link to="/discover">
          <ArrowLeft
            size={17}
          />

          {t(
            "recipe.backToDiscover",
          )}
        </Link>
      </main>
    );
  }

  const recipeIsSaved =
    isSaved(recipe.id);

  return (
    <main className="recipe-page">
      <div className="recipe-back-row">
        <Link to="/discover">
          <ArrowLeft
            size={17}
          />

          {t(
            "nav.discover",
          )}
        </Link>
      </div>

      <section className="recipe-hero">
        <div className="recipe-hero-image">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
            />
          ) : (
            <div className="recipe-public-image-placeholder">
              <ChefHat
                size={44}
                strokeWidth={1.3}
              />
            </div>
          )}

          {recipe.category && (
            <span className="recipe-category-badge">
              {
                recipe.category
              }
            </span>
          )}
        </div>

        <div className="recipe-hero-content">
          <p className="section-kicker">
  {t(
    "recipe.sharedBy",
  )}{" "}

  {recipe.cookUsername ? (
    <Link
      to={`/cooks/${recipe.cookUsername}`}
      className="recipe-cook-link"
    >
      {recipe.creator}
    </Link>
  ) : (
    recipe.creator
  )}
</p>

          <h1>
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="recipe-description">
              {
                recipe.description
              }
            </p>
          )}

          <div className="recipe-quick-info">
            <div>
              <Clock3
                size={19}
              />

              <span>
                <small>
                  {t(
                    "recipe.totalTime",
                  )}
                </small>

                <strong>
                  {recipe.time}
                </strong>
              </span>
            </div>

            <div>
              <Users
                size={19}
              />

              <span>
                <small>
                  {t(
                    "recipe.serves",
                  )}
                </small>

                <strong>
                  {servings}
                </strong>
              </span>
            </div>

            <div>
              <ChefHat
                size={19}
              />

              <span>
                <small>
                  {t(
                    "recipe.cook",
                  )}
                </small>

                <strong>
                  {recipe.cookTime}
                </strong>
              </span>
            </div>
          </div>

          <div className="recipe-main-actions">
            <button
              type="button"
              className={`recipe-save-main ${
                recipeIsSaved
                  ? "saved"
                  : ""
              }`}
              onClick={() =>
                toggleSaved(
                  recipe.id,
                )
              }
            >
              {recipeIsSaved ? (
                <Bookmark
                  size={18}
                  fill="currentColor"
                />
              ) : (
                <Bookmark
                  size={18}
                />
              )}

              {recipeIsSaved
                ? t(
                    "recipe.saved",
                  )
                : t(
                    "recipe.saveRecipe",
                  )}
            </button>

            <Link
              to="/kitchen"
              className="recipe-kitchen-link"
            >
              <ShoppingBasket
                size={18}
              />

              {t(
                "recipe.checkKitchen",
              )}
            </Link>
          </div>
        </div>
      </section>

      <section className="recipe-body">
        <div className="recipe-ingredients-column">
          <div className="recipe-section-heading">
            <div>
              <p className="section-kicker">
                {t(
                  "recipe.ingredientsKicker",
                )}
              </p>

              <h2>
                {t(
                  "recipe.ingredients",
                )}
              </h2>
            </div>

            <div className="servings-control">
              <button
                type="button"
                aria-label="Decrease servings"
                disabled={
                  servings <= 1
                }
                onClick={() =>
                  setServings(
                    (current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                  )
                }
              >
                <Minus
                  size={15}
                />
              </button>

              <span>
                {servings}

                <small>
                  {" "}
                  {t(
                    "recipe.servings",
                  )}
                </small>
              </span>

              <button
                type="button"
                aria-label="Increase servings"
                onClick={() =>
                  setServings(
                    (current) =>
                      current + 1,
                  )
                }
              >
                <Plus
                  size={15}
                />
              </button>
            </div>
          </div>

          <div className="recipe-ingredient-list">
            {adjustedIngredients.map(
              (
                ingredient,
                index,
              ) => {
                const ingredientKey =
                  `${recipe.id}-${index}`;

                const checked =
                  checkedIngredients.includes(
                    ingredientKey,
                  );

                return (
                  <button
                    type="button"
                    className={`recipe-ingredient-row ${
                      checked
                        ? "checked"
                        : ""
                    }`}
                    key={
                      ingredientKey
                    }
                    onClick={() =>
                      toggleIngredient(
                        ingredientKey,
                      )
                    }
                  >
                    <span className="recipe-ingredient-check">
                      {checked && (
                        <Check
                          size={14}
                          strokeWidth={3}
                        />
                      )}
                    </span>

                    <span className="recipe-ingredient-quantity">
                      {
                        ingredient.adjustedQuantity
                      }

                      {ingredient.unit &&
                        ` ${ingredient.unit}`}
                    </span>

                    <span className="recipe-ingredient-name">
                      <strong>
                        {
                          ingredient.name
                        }
                      </strong>
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="recipe-shopping-card">
            <ShoppingBasket
              size={21}
            />

            <div>
              <strong>
                {t(
                  "recipe.missingSomething",
                )}
              </strong>

              <p>
                {t(
                  "recipe.shoppingText",
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="recipe-method-column">
          <div className="recipe-section-heading">
            <div>
              <p className="section-kicker">
                {t(
                  "recipe.methodKicker",
                )}
              </p>

              <h2>
                {t(
                  "recipe.method",
                )}
              </h2>
            </div>
          </div>

          <div className="recipe-steps">
            {recipe.instructions.map(
              (
                instruction,
                index,
              ) => (
                <div
                  className="recipe-step"
                  key={`${recipe.id}-${index}`}
                >
                  <span className="recipe-step-number">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <p>
                    {
                      instruction
                    }
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="recipe-timing-card">
            <div>
              <span>
                {t(
                  "recipe.prep",
                )}
              </span>

              <strong>
                {
                  recipe.prepTime
                }
              </strong>
            </div>

            <div>
              <span>
                {t(
                  "recipe.cook",
                )}
              </span>

              <strong>
                {
                  recipe.cookTime
                }
              </strong>
            </div>

            <div>
              <span>
                {t(
                  "recipe.total",
                )}
              </span>

              <strong>
                {
                  recipe.time
                }
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="recipe-creator">
        <div>
          <p className="section-kicker">
            {t(
              "recipe.sharedBy",
            )}
          </p>

          <h2>
  {recipe.cookUsername ? (
    <Link
      to={`/cooks/${recipe.cookUsername}`}
      className="recipe-creator-name-link"
    >
      {recipe.creator}
    </Link>
  ) : (
    recipe.creator
  )}
</h2>

          <p>
            {t(
              "recipe.creatorBlurb",
            )}
          </p>
        </div>

        {recipe.cookUsername ? (
  <Link
    to={`/cooks/${recipe.cookUsername}`}
  >
    {t(
      "recipe.moreRecipes",
    )}

    <ArrowLeft
      className="recipe-more-arrow"
      size={17}
    />
  </Link>
) : (
  <Link to="/discover">
    {t(
      "recipe.moreRecipes",
    )}

    <ArrowLeft
      className="recipe-more-arrow"
      size={17}
    />
  </Link>
)}
      </section>
    </main>
  );
}

export default RecipePage;