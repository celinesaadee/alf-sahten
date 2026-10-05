import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  ChefHat,
  Clock3,
  Heart,
  Search,
} from "lucide-react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { useTranslation } from "react-i18next";
import { RECIPE_TAGS, isRecipeTag, normalizeRecipeTags } from "../lib/recipeTags";
import "../components/RecipeTags.css";

import {
  getRecipeCategories,
  type RecipeCategory,
} from "../services/recipes";

import {
  usePublishedRecipes,
} from "../hooks/usePublishedRecipes";

import {
  useSavedRecipes,
} from "../hooks/useSavedRecipes";

function DiscoverPage() {
  const { t } = useTranslation();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    savedIds,
    toggleSaved,
  } = useSavedRecipes();

  const {
    recipes,
    loading,
    error,
  } = usePublishedRecipes();

  const [
    categories,
    setCategories,
  ] = useState<RecipeCategory[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data =
          await getRecipeCategories();

        setCategories(data);
      } catch (err) {
        console.error(
          "Could not load recipe categories:",
          err,
        );
      }
    }

    void loadCategories();
  }, []);

  const requestedCategory =
    searchParams.get("category");
  const requestedTag = searchParams.get("tag");
  const activeTag = isRecipeTag(requestedTag) ? requestedTag : "";

  const activeCategory =
    requestedCategory &&
    categories.some(
      (category) =>
        category.name ===
        requestedCategory,
    )
      ? requestedCategory
      : "All";

  function setActiveCategory(
    value: string,
  ) {
    setSearchParams(
      (current) => {
        const next =
          new URLSearchParams(
            current,
          );

        if (value === "All") {
          next.delete(
            "category",
          );
        } else {
          next.set(
            "category",
            value,
          );
        }

        return next;
      },
    );
  }

  const filteredRecipes =
    useMemo(() => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      return recipes.filter(
        (recipe) => {
          const matchesCategory =
            activeCategory ===
              "All" ||
            recipe.category ===
              activeCategory;

          const creatorName =
            recipe.cook
              ?.display_name ??
            recipe.cook
              ?.username ??
            "";

          const matchesSearch =
            normalizeRecipeTags(recipe.tags).some(tag => t(`recipeTags.${tag}`).toLowerCase().includes(normalizedSearch)) ||
            normalizedSearch.length ===
              0 ||
            recipe.title
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              recipe.description ??
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              recipe.category ??
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            creatorName
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              recipe.ingredients ??
              []
            ).some(
              (ingredient) =>
                (
                  ingredient.ingredient ??
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            );

          return (
            matchesCategory &&
            (!activeTag || normalizeRecipeTags(recipe.tags).includes(activeTag)) &&
            matchesSearch
          );
        },
      );
    }, [
      recipes,
      searchQuery,
      activeCategory,
      activeTag,
      t,
    ]);

  return (
    <main className="discover-page">
      <section className="discover-hero">
        <div className="discover-hero-copy">
          <p className="section-kicker">
  {activeCategory === "All"
    ? t(
        "discover.discoverNew",
      )
    : t(
        `categories.${activeCategory}`,
        {
          defaultValue:
            activeCategory,
        },
      )}
</p>

          <h1>
            {t(
              "discover.title",
            )}
          </h1>

          <p>
            {t(
              "discover.subtitle",
            )}
          </p>
        </div>

        <div className="discover-search-card">
          <Search
            size={22}
            strokeWidth={1.8}
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder={t(
              "discover.searchPlaceholder",
            )}
          />
        </div>

        <div className="discover-categories">
          <button
            type="button"
            className={
              activeCategory ===
              "All"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCategory(
                "All",
              )
            }
          >
            {t(
              "discover.all",
            )}
          </button>

          {categories.map(
  (category) => (
    <button
      type="button"
      key={
        category.id
      }
      className={
        activeCategory ===
        category.name
          ? "active"
          : ""
      }
      onClick={() =>
        setActiveCategory(
          category.name,
        )
      }
    >
      {t(
        `categories.${category.name}`,
        {
          defaultValue:
            category.name,
        },
      )}
    </button>
  ),
)}
        </div>
      </section>

      <div className="discover-tag-filter">
        <label htmlFor="discover-tag">{t("recipeTags.filter")}</label>
        <select id="discover-tag" value={activeTag} onChange={event => {
          const value = event.target.value;
          setSearchParams(current => { const next = new URLSearchParams(current); if (value) next.set("tag", value); else next.delete("tag"); return next; });
        }}>
          <option value="">{t("recipeTags.all")}</option>
          {RECIPE_TAGS.map(tag => <option key={tag} value={tag}>{t(`recipeTags.${tag}`)}</option>)}
        </select>
      </div>
      <section className="discover-kitchen-banner">
        <div className="discover-kitchen-icon">
          <ChefHat
            size={25}
          />
        </div>

        <div>
          <span>
            {t(
              "discover.kitchenQuestion",
            )}
          </span>

          <h2>
            {t(
              "discover.kitchenTitle",
            )}
          </h2>

          <p>
            {t(
              "discover.kitchenText",
            )}
          </p>
        </div>

        <Link to="/kitchen">
          {t(
            "discover.openKitchen",
          )}

          <ArrowRight
            size={17}
          />
        </Link>
      </section>

      <section className="discover-results">
        <div className="discover-results-heading">
          <div>
            <p className="section-kicker">
              {activeCategory ===
              "All"
                ? t(
                    "discover.discoverNew",
                  )
                : activeCategory}
            </p>

            <h2>
              {searchQuery
                ? `${t(
                    "discover.resultsFor",
                  )} “${searchQuery}”`
                : activeCategory ===
                    "All"
                  ? t(
                      "discover.recipesWorthTrying",
                    )
                  : `${t(
    `categories.${activeCategory}`,
    {
      defaultValue:
        activeCategory,
    },
  )} ${t(
    "discover.categoryRecipes",
  )}`}
            </h2>
          </div>

          {!loading && (
            <span>
              {
                filteredRecipes.length
              }{" "}
              {filteredRecipes.length ===
              1
                ? t(
                    "common.recipe",
                  )
                : t(
                    "common.recipes",
                  )}
            </span>
          )}
        </div>

        {loading ? (
          <div className="discover-empty">
            <ChefHat
              size={32}
              strokeWidth={1.5}
            />

            <h3>
  {t(
    "discover.loadingRecipes",
    {
      defaultValue:
        "Loading recipes...",
    },
  )}
</h3>
          </div>
        ) : error ? (
          <div className="discover-empty">
            <Search
              size={32}
              strokeWidth={1.5}
            />

            <h3>
  {t(
    "discover.loadError",
    {
      defaultValue:
        "We couldn't load the recipes.",
    },
  )}
</h3>

<p>
  {t(
    "discover.loadErrorText",
    {
      defaultValue:
        "Please refresh and try again.",
    },
  )}
</p>
          </div>
        ) : filteredRecipes.length >
          0 ? (
          <div className="discover-recipe-grid">
            {filteredRecipes.map(
              (recipe) => {
                const isSaved =
                  savedIds.includes(
                    recipe.id,
                  );

                const totalMinutes =
                  (recipe.prep_minutes ??
                    0) +
                  (recipe.cook_minutes ??
                    0);

                const creatorName =
                  recipe.cook
                    ?.display_name ??
                  recipe.cook
                    ?.username ??
                  t("common.cook");

                return (
                  <article
                    className="discover-recipe-card"
                    key={
                      recipe.id
                    }
                  >
                    <div className="discover-recipe-image">
                      <Link
                        to={`/recipe/${recipe.id}`}
                        className="discover-image-link"
                      >
                        {recipe.image_url ? (
                          <img
                            src={
                              recipe.image_url
                            }
                            alt={
                              recipe.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="discover-recipe-placeholder">
                            <ChefHat
                              size={34}
                              strokeWidth={
                                1.4
                              }
                            />
                          </div>
                        )}
                      </Link>

                      <button
                        type="button"
                        className={`discover-save-button ${
                          isSaved
                            ? "saved"
                            : ""
                        }`}
                        aria-label={
                          isSaved
                            ? t(
                                "discover.removeSaved",
                              )
                            : t(
                                "discover.saveRecipe",
                              )
                        }
                        onClick={() =>
                          toggleSaved(
                            recipe.id,
                          )
                        }
                      >
                        <Heart
                          size={21}
                          fill={
                            isSaved
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="discover-recipe-content">
                      <div className="recipe-tags">{normalizeRecipeTags(recipe.tags).map(tag => <span key={tag}>{t(`recipeTags.${tag}`)}</span>)}</div>
                      <div className="discover-card-topline">
                        <span>
  {recipe.category
    ? t(
        `categories.${recipe.category}`,
        {
          defaultValue:
            recipe.category,
        },
      )
    : ""}
</span>

                        {totalMinutes >
                          0 && (
                          <span>
                            <Clock3
                              size={14}
                            />

                            {
                              totalMinutes
                            }{" "}
                            {t("publicCookProfile.minuteShort")}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/recipe/${recipe.id}`}
                      >
                        <h3>
                          {
                            recipe.title
                          }
                        </h3>
                      </Link>

                      {recipe.description && (
                        <p>
                          {
                            recipe.description
                          }
                        </p>
                      )}

                      <div className="discover-card-footer">
                        <span>
  {t(
    "discover.by",
  )}{" "}

  {recipe.cook?.username ? (
    <Link
      to={`/cooks/${recipe.cook.username}`}
      className="discover-cook-link"
    >
      {creatorName}
    </Link>
  ) : (
    creatorName
  )}
</span>

                        <Link
                          to={`/recipe/${recipe.id}`}
                        >
                          {t(
                            "common.viewRecipe",
                          )}

                          <ArrowRight
                            size={15}
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : recipes.length === 0 ? (
  <div className="discover-empty">
    <ChefHat
      size={32}
      strokeWidth={1.5}
    />

    <h3>
      {t(
        "discover.noRecipesYet",
        {
          defaultValue:
            "Recipes are coming soon.",
        },
      )}
    </h3>

    <p>
      {t(
        "discover.noRecipesYetText",
        {
          defaultValue:
            "There aren't any published recipes to show yet.",
        },
      )}
    </p>
  </div>
) : (
  <div className="discover-empty">
    <Search
      size={32}
      strokeWidth={1.5}
    />

    <h3>
      {t(
        "discover.noRecipes",
      )}
    </h3>

    <p>
      {t(
        "recipeTags.noResultsText",
      )}
    </p>

    <button
      type="button"
      onClick={() => {
        setSearchQuery("");

        setSearchParams(current => { const next = new URLSearchParams(current); next.delete("category"); next.delete("tag"); return next; });
      }}
    >
      {t(
        "discover.showAll",
      )}
    </button>
  </div>
)}
      </section>
    </main>
  );
}

export default DiscoverPage;
