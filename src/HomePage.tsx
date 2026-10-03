import {

  useRef,

  useState,

  type FormEvent,

} from "react";

import {

  Search,

  ArrowRight,

  Clock3,

  Plus,

  ChefHat,

} from "lucide-react";

import {

  Link,

  useNavigate,

} from "react-router-dom";

import { useTranslation } from "react-i18next";

import {

  getCanonicalIngredientName,

  getLocalizedIngredientName,

} from "./data/recipeTranslations";

import { useKitchenIngredients } from "./hooks/useKitchenIngredients";

import { usePublishedRecipes } from "./hooks/usePublishedRecipes";

import "./App.css";

import "./HomePage.css";

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

    normalizeIngredientForMatching(ingredient);

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

const homeCategories = [

  {

    name: "Breakfast",

    image:

      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=90",

  },

  {

    name: "Main Dishes",

    image:

      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90",

  },

  {

    name: "Salads",

    image:

      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=90",

  },

  {

    name: "Desserts",

    image:

      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=90",

  },

];

function HomePage() {

  const { t, i18n } =

  useTranslation();

  const navigate = useNavigate();

  const {

    ingredients,

    loading,

    addIngredient,

    removeIngredient,

  } = useKitchenIngredients();

const {

  recipes: publishedRecipes,

  loading: publishedRecipesLoading,

  error: publishedRecipesError,

} = usePublishedRecipes();

  const [input, setInput] = useState("");

  const [busy, setBusy] = useState(false);

  const locked = useRef(false);

  const normalized = ingredients.map((item) =>

    normalizeIngredientForMatching(

      getCanonicalIngredientName(

        item,

        i18n.language,

      ),

    ),

  );

  const suggestions = publishedRecipes

    .map((recipe) => {

      const recipeIngredients =

        recipe.ingredients ?? [];

      const missing = recipeIngredients.filter(

        (item) => {

          const ingredientName =

            item.ingredient ?? "";

          if (!ingredientName) {

            return false;

          }

          return !normalized.includes(

            normalizeIngredientForMatching(

              ingredientName,

            ),

          );

        },

      ).length;

      return {

        recipe,

        missing,

        matched:

          recipeIngredients.length - missing,

      };

    })

    .sort((a, b) => {

      if (ingredients.length) {

        return (

          a.missing - b.missing ||

          b.matched - a.matched

        );

      }

      const aDate = new Date(

        a.recipe.published_at ??

          a.recipe.created_at,

      ).getTime();

      const bDate = new Date(

        b.recipe.published_at ??

          b.recipe.created_at,

      ).getTime();

      return bDate - aDate;

    })

    .slice(0, 3);

  async function add(

    goToKitchen = false,

  ) {

    if (

      loading ||

      locked.current

    ) {

      return;

    }

    locked.current = true;

    setBusy(true);

    try {

      const canonical =

        getCanonicalIngredientName(

          input.trim(),

          i18n.language,

        );

      if (

        canonical &&

        !normalized.includes(

          normalizeIngredientForMatching(

            canonical,

          ),

        )

      ) {

        await addIngredient(canonical);

      }

      setInput("");

      if (goToKitchen) {

        navigate("/kitchen");

      }

    } finally {

      locked.current = false;

      setBusy(false);

    }

  }

  function submit(

    event: FormEvent,

  ) {

    event.preventDefault();

    void add();

  }

  async function remove(

    value: string,

  ) {

    if (

      loading ||

      locked.current

    ) {

      return;

    }

    locked.current = true;

    setBusy(true);

    try {

      await removeIngredient(value);

    } finally {

      locked.current = false;

      setBusy(false);

    }

  }

  return (

    <main className="site home-page">

      <section className="hero">

        <div className="hero-layout">

          <div className="hero-copy">

            <p className="eyebrow">

              {t("home.eyebrow")}

            </p>

            <h1>

              {t("home.title")}

            </h1>

            <p className="hero-subtitle">

              {t("home.subtitle")}

            </p>

            <div

              className="ingredient-card"

              aria-busy={loading || busy}

            >

              <form

                className="ingredient-search"

                onSubmit={submit}

              >

                <Search

                  size={21}

                  aria-hidden="true"

                />

                <input

                  value={input}

                  onChange={(event) =>

                    setInput(event.target.value)

                  }

                  disabled={loading || busy}

                  aria-label={t(

                    "home.ingredientLabel",

                  )}

                  placeholder={t(

                    "home.placeholder",

                  )}

                />

                <button

                  className="home-add"

                  type="submit"

                  disabled={

                    loading ||

                    busy ||

                    !input.trim()

                  }

                >

                  <Plus size={17} />

                  {t("home.add")}

                </button>

              </form>

              <div className="ingredient-bottom">

                <div

                  className="ingredient-tags"

                  aria-live="polite"

                >

                  {loading ? (

                    <p>

                      {t("home.loading")}

                    </p>

                  ) : ingredients.length ? (

                    ingredients.map(

                      (ingredient) => {

                        const label =

                          getLocalizedIngredientName(

                            canonicalIngredientForDisplay(

                              ingredient,

                            ),

                            i18n.language,

                          );

                        return (

                          <span key={ingredient}>

                            {label}

                            <button

                              type="button"

                              disabled={busy}

                              onClick={() =>

                                void remove(

                                  ingredient,

                                )

                              }

                              aria-label={t(

                                "home.remove",

                                {

                                  ingredient:

                                    label,

                                },

                              )}

                            >

                              ×

                            </button>

                          </span>

                        );

                      },

                    )

                  ) : (

                    <p>

                      {t(

                        "home.emptyKitchen",

                      )}

                    </p>

                  )}

                </div>

              </div>

              <button

                type="button"

                className="find-button"

                disabled={loading || busy}

                onClick={() =>

                  void add(true)

                }

              >

                {t("home.find")}

                <ArrowRight size={19} />

              </button>

            </div>

          </div>

          <div className="hero-image-wrap">

            <div className="hero-image">

              <img

                src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1600&q=95"

                alt={t("home.heroAlt")}

              />

            </div>

            <div className="hand-note">

              {t("home.handNote")}

            </div>

          </div>

        </div>

      </section>

      <section className="recipes-section">

        <div className="section-heading">

          <div>

            <p className="section-kicker">

              {t("home.start")}

            </p>

            <h2>

              {t(

                ingredients.length &&

                  !loading

                  ? "home.matches"

                  : "home.inspiration",

              )}

            </h2>

          </div>

          <Link

            className="text-button"

            to={

              ingredients.length

                ? "/kitchen"

                : "/discover"

            }

          >

            {t("home.more")}

            <ArrowRight size={17} />

          </Link>

        </div>

{publishedRecipesLoading ? (

  <p className="home-recipes-loading">

    {t("home.loadingRecipes", {

      defaultValue: "Loading recipes...",

    })}

  </p>

) : publishedRecipesError ? (

  <div className="home-recipes-empty">

    <ChefHat size={28} />

    <p>

      {t("home.recipeLoadError", {

        defaultValue:

          "We couldn't load the recipes right now.",

      })}

    </p>

  </div>

) : suggestions.length === 0 ? (

  <div className="home-recipes-empty">

    <ChefHat size={28} />

    <p>

      {t("home.noPublishedRecipes", {

        defaultValue:

          "Recipes are coming soon.",

      })}

    </p>

  </div>

) : (

          <div className="recipe-grid">

            {suggestions.map(

              ({

                recipe,

                missing,

              }) => {

                const totalMinutes =

                  (recipe.prep_minutes ?? 0) +

                  (recipe.cook_minutes ?? 0);

                const creatorName =

                  recipe.cook?.display_name ??

                  recipe.cook?.username ??

                  t("common.cook");

                return (

<article

  className="recipe-card"

  key={recipe.id}

>

  <div className="home-recipe-link">

    <Link

      to={`/recipe/${recipe.id}`}

      className="home-recipe-main-link"

    >

      <div className="recipe-image">

        {recipe.image_url ? (

          <img

            src={recipe.image_url}

            alt={recipe.title}

            loading="lazy"

          />

        ) : (

          <div className="home-recipe-placeholder">

            <ChefHat size={34} />

          </div>

        )}

        {!loading &&

          ingredients.length > 0 && (

            <span

              className={`recipe-status ${

                missing === 0

                  ? "ready"

                  : "warning"

              }`}

            >

              {missing === 0

                ? t("home.ready")

                : t("home.missing", {

                    count: missing,

                  })}

            </span>

          )}

      </div>

<div className="recipe-content">
  <h3>{recipe.title}</h3>

  <div className="home-recipe-details">
    {recipe.category && (
      <span className="home-recipe-category">
        {t(
          `categories.${recipe.category}`,
          {
            defaultValue:
              recipe.category,
          },
        )}
      </span>
    )}

    {recipe.servings &&
      recipe.servings > 0 && (
        <span className="home-recipe-servings">
          {t("home.serves", {
            count: recipe.servings,
          })}
        </span>
      )}
  </div>
</div>

    </Link>

    <div className="recipe-content home-recipe-meta-content">

      <div className="recipe-meta">

        <span>

          {t("home.by", {

            creator: "",

          })}

          {recipe.cook?.username ? (

            <Link

              to={`/cooks/${recipe.cook.username}`}

              className="home-recipe-cook-link"

            >

              {creatorName}

            </Link>

          ) : (

            creatorName

          )}

        </span>

        {totalMinutes > 0 && (

          <span className="recipe-time">

            <Clock3 size={15} />

            {totalMinutes} {t("publicCookProfile.minuteShort")}

          </span>

        )}

      </div>

    </div>

  </div>

</article>

                );

              },

            )}

          </div>

        )}

      </section>

<section className="home-cooks-section">

  <div className="home-cooks-visual">

    <div className="home-cooks-photo-wrap">

      <img

        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=90"

        alt={t("home.cooksImageAlt")}

        className="home-cooks-photo"

      />

      <div className="home-cooks-badge">

        <ChefHat

          size={20}

          strokeWidth={1.7}

        />

        <span>

          {t("home.cooksBadge")}

        </span>

      </div>

    </div>

  </div>

  <div className="home-cooks-content">

    <p className="section-kicker">

      {t("home.creatorKicker")}

    </p>

    <h2>

      {t("home.creatorTitle")}

    </h2>

    <p className="home-cooks-intro">

      {t("home.creatorText")}

    </p>

    <div className="home-cooks-actions">

      <Link

        className="primary-round-button"

        to="/discover"

      >

        {t("home.exploreRecipes")}

        <ArrowRight size={18} />

      </Link>

      <Link

        className="home-cooks-secondary"

        to="/become-creator"

      >

        {t("home.creatorAction")}

      </Link>

    </div>

  </div>

</section>

      <section className="categories-section">

        <div className="categories-heading">

          <div>

            <p className="section-kicker">

              {t(

                "home.categoryKicker",

              )}

            </p>

            <h2>

              {t(

                "home.categoryTitle",

              )}

            </h2>

          </div>

          <p>

            {t(

              "home.categoryText",

            )}

          </p>

        </div>

<div className="category-grid">
  {homeCategories.map(
    (category, index) => {
      const categoryLabel = t(
        `categories.${category.name}`,
        {
          defaultValue: category.name,
        },
      );

      return (
        <Link
          key={category.name}
          to={`/discover?category=${encodeURIComponent(
            category.name,
          )}`}
          className={`food-category ${
            index === 0
              ? "food-category-large"
              : ""
          }`}
        >
          <img
            src={category.image}
            alt={categoryLabel}
            loading="lazy"
          />

          <span className="category-overlay" />

          <span className="category-content">
            <strong>
              {categoryLabel}
            </strong>

            <span>
              {t("home.explore")}

              <ArrowRight size={16} />
            </span>
          </span>
        </Link>
      );
    },
  )}
</div>

      </section>

      <footer className="footer">

        <div className="footer-top">

          <div className="footer-brand-column">

            <Link

              to="/"

              className="footer-logo"

            >

              Alf Sahten

            </Link>

            <p>

              {t(

                "home.footerText",

              )}

            </p>

          </div>

          <nav

  className="footer-links"

  aria-label={t(

    "home.footerNav",

  )}

>

  <div>

    <strong>

      {t(

        "home.explore",

      )}

    </strong>

    <Link to="/discover">

      {t(

        "nav.discover",

      )}

    </Link>

    <Link to="/kitchen">

      {t(

        "nav.kitchen",

      )}

    </Link>

    <Link to="/saved">

      {t(

        "nav.saved",

      )}

    </Link>

    <Link to="/become-creator">

      {t(

        "home.creatorAction",

      )}

    </Link>

  </div>

  <div>

    <strong>

      {i18n.language.startsWith(

        "fr",

      )

        ? "Informations"

        : i18n.language.startsWith(

              "ar",

            )

          ? "معلومات"

          : "Information"}

    </strong>

    <Link to="/privacy">

      {i18n.language.startsWith(

        "fr",

      )

        ? "Confidentialité"

        : i18n.language.startsWith(

              "ar",

            )

          ? "سياسة الخصوصية"

          : "Privacy Policy"}

    </Link>

    <Link to="/terms">

      {i18n.language.startsWith(

        "fr",

      )

        ? "Conditions d'utilisation"

        : i18n.language.startsWith(

              "ar",

            )

          ? "شروط الاستخدام"

          : "Terms of Use"}

    </Link>

  </div>

</nav>

        </div>

        <div className="footer-bottom">

          <span>

            © {new Date().getFullYear()} Alf Sahten

          </span>

          <span className="footer-message">

            {t(

              "home.footerMessage",

            )}

          </span>

        </div>

      </footer>

    </main>

  );

}

export default HomePage;
