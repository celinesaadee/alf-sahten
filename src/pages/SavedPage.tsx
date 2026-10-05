import {
  ArrowRight,
  Bookmark,
  ChefHat,
  Clock3,
  Heart,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useSavedRecipes } from "../hooks/useSavedRecipes";
import { usePublishedRecipes } from "../hooks/usePublishedRecipes";
import { CollectionPicker } from "../components/CollectionPicker";

function SavedPage() {
  const { t } = useTranslation();

  const {
    savedIds,
    loading: savedLoading,
    removeSaved,
  } = useSavedRecipes();

  const {
    recipes,
    loading: recipesLoading,
    error,
  } = usePublishedRecipes();

  const savedRecipes = recipes.filter(
    (recipe) =>
      savedIds.includes(recipe.id),
  );

  const loading =
    savedLoading ||
    recipesLoading;

  if (loading) {
    return (
      <main className="saved-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  return (
    <main className="saved-page">
      <section className="saved-hero">
        <p className="section-kicker">
          {t("saved.kicker")}
        </p>

        <h1>
          {t("saved.title")}
        </h1>

        <p>
          {t("saved.subtitle")}
        </p>

        <Link
  to="/collections"
  className="saved-collections-link"
>
  <Bookmark size={17} />

  <span>
    {t(
      "collections.title",
      {
        defaultValue:
          "My collections",
      },
    )}
  </span>

  <ArrowRight size={16} />
</Link>

        {savedRecipes.length > 0 && (
  <div className="saved-count">
    <Bookmark size={18} />

    <span>
      {savedRecipes.length}{" "}
      {savedRecipes.length === 1
        ? t("common.recipe")
        : t("common.recipes")}
    </span>
  </div>
)}
      </section>

      <section className="saved-content">
        {error ? (
          <div className="saved-empty-state">
            <div className="saved-empty-icon">
              <ChefHat size={30} />
            </div>

            <h2>
  {t("saved.loadErrorTitle", {
    defaultValue:
      "We couldn't load your saved recipes.",
  })}
</h2>

<p>
  {t("saved.loadErrorText", {
    defaultValue:
      "Please refresh and try again.",
  })}
</p>
          </div>
        ) : savedRecipes.length > 0 ? (
          <div className="saved-recipe-grid">
            {savedRecipes.map(
              (recipe) => {
                const totalMinutes =
                  (recipe.prep_minutes ?? 0) +
                  (recipe.cook_minutes ?? 0);

                const creatorName =
                  recipe.cook?.display_name ??
                  recipe.cook?.username ??
                  t("common.cook");

                return (
                  <article
                    className="saved-recipe-card"
                    key={recipe.id}
                  >
                    <div className="saved-recipe-image">
                      <Link
                        to={`/recipe/${recipe.id}`}
                        className="saved-image-link"
                      >
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="saved-recipe-placeholder">
                            <ChefHat
                              size={34}
                              strokeWidth={1.4}
                            />
                          </div>
                        )}
                      </Link>

                      <button
                        type="button"
                        className="saved-remove-button"
                        aria-label={t(
                          "recipe.removeSaved",
                        )}
                        onClick={() =>
  void removeSaved(
    recipe.id,
  )
}
                      >
                        <Heart
                          size={20}
                          fill="currentColor"
                        />
                      </button>
                    </div>

                    <div className="saved-recipe-content">
                      <div className="saved-recipe-meta">
                        {recipe.category && (
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
                        )}

                        {totalMinutes > 0 && (
                          <span>
                            <Clock3
                              size={14}
                            />

                            {totalMinutes} {t("publicCookProfile.minuteShort")}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/recipe/${recipe.id}`}
                      >
                        <h2>
                          {recipe.title}
                        </h2>
                      </Link>

                      {recipe.description && (
  <p>
    {recipe.description}
  </p>
)}

<CollectionPicker
  recipeId={recipe.id}
/>

<div className="saved-recipe-footer">
                        <span>
  {t(
    "discover.by",
  )}{" "}

  {recipe.cook?.username ? (
    <Link
      to={`/cooks/${recipe.cook.username}`}
      className="saved-cook-link"
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
                            "saved.cookThis",
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
        ) : (
          <div className="saved-empty-state">
            <div className="saved-empty-icon">
              <Bookmark size={30} />
            </div>

            <p className="section-kicker">
              {t(
                "saved.collectionKicker",
              )}
            </p>

            <h2>
              {t(
                "saved.emptyTitle",
              )}
            </h2>

            <p>
              {t(
                "saved.emptyText",
              )}
            </p>

            <Link to="/discover">
              {t(
                "saved.discoverRecipes",
              )}

              <ArrowRight
                size={17}
              />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default SavedPage;