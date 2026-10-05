import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  deleteRecipe,
  getCookRecipes,
} from "../services/recipes";
import "./MyRecipesPage.css";
import CookDashboardNav from "../components/CookDashboardNav";

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  admin_note: string | null;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "declined"
    | "changes_requested";
  created_at: string;
};

function MyRecipesPage() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(
  null,
);

  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
  setError(t("myRecipes.signInRequired"));
  return;
}

        const data = await getCookRecipes(user.id);

        setRecipes(data as Recipe[]);
      } catch (err) {
        console.error(err);
        setError(t("myRecipes.loadError"));
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
 }, [t]);

  function getStatusLabel(status: Recipe["status"]) {
  return t(`myRecipes.statuses.${status}`);
}

async function handleDeleteRecipe(recipe: Recipe) {
  const confirmed = window.confirm(
  t("myRecipes.deleteConfirm", {
    title: recipe.title,
  }),
);

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(recipe.id);
    setError(null);

    await deleteRecipe(recipe.id);

    setRecipes((current) =>
      current.filter((item) => item.id !== recipe.id),
    );
  } catch (err) {
    console.error(err);
    setError(t("myRecipes.deleteError"));
  } finally {
    setDeletingId(null);
  }
}

  if (loading) {
    return (
      <main className="my-recipes-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  return (
    <main className="my-recipes-page">
      <CookDashboardNav />

      <section className="my-recipes-header">
        <div>
  <p className="eyebrow">
    {t("myRecipes.eyebrow")}
  </p>

  <h1>{t("myRecipes.title")}</h1>

  <p>
    {t("myRecipes.subtitle")}
  </p>
</div>

<div className="my-recipes-header-actions">
  <Link
  to="/cook/recipes/import-instagram"
  className="instagram-import-button"
>
  <Download size={18} />
  {t("myRecipes.importInstagram")}
</Link>

  <Link
    to="/cook/recipes/new"
    className="primary-button"
  >
    <Plus size={18} />
    {t("myRecipes.createRecipe")}
  </Link>
</div>
      </section>

      {error && <p className="form-error">{error}</p>}

      {!error && recipes.length === 0 && (
        <section className="my-recipes-empty">
          <ChefHat size={34} />

          <h2>{t("myRecipes.noRecipesTitle")}</h2>

<p>
  {t("myRecipes.noRecipesText")}
</p>

<Link
  to="/cook/recipes/new"
  className="primary-button"
>
  <Plus size={18} />
  {t("myRecipes.createRecipe")}
</Link>
        </section>
      )}

      {!error && recipes.length > 0 && (
        <section className="my-recipes-grid">
          {recipes.map((recipe) => (
            <article key={recipe.id} className="my-recipe-card">
  <div className="my-recipe-card-media">
    {recipe.image_url ? (
      <img
        src={recipe.image_url}
        alt={recipe.title}
        className="my-recipe-card-image"
      />
    ) : (
      <div className="my-recipe-card-placeholder">
        <ChefHat size={30} />
      </div>
    )}

    {recipe.status !== "approved" && (
  <span
    className={`recipe-status recipe-status-${recipe.status}`}
  >
    {getStatusLabel(recipe.status)}
  </span>
)}
  </div>

  <div className="my-recipe-card-content">
    <h2>{recipe.title}</h2>

    {recipe.description && (
      <p>{recipe.description}</p>
    )}

    {recipe.admin_note && (
    <div className="my-recipe-admin-note">
      <strong>
  {recipe.status === "changes_requested"
    ? t("myRecipes.changesRequested")
    : t("myRecipes.adminNote")}
</strong>

      <p>{recipe.admin_note}</p>
    </div>
  )}

    <div className="my-recipe-meta">
  {recipe.prep_minutes !== null && (
    <span>
      {t("myRecipes.prepMinutes", {
        count: recipe.prep_minutes,
      })}
    </span>
  )}

  {recipe.cook_minutes !== null && (
    <span>
      {t("myRecipes.cookMinutes", {
        count: recipe.cook_minutes,
      })}
    </span>
  )}

  {recipe.servings !== null && (
    <span>
      {t("myRecipes.servings", {
        count: recipe.servings,
      })}
    </span>
  )}
</div>

    <div className="my-recipe-actions">
  {(
    recipe.status === "draft" ||
    recipe.status === "changes_requested" ||
    recipe.status === "declined"
  ) && (
    <Link
      to={`/cook/recipes/${recipe.id}/edit`}
      className="my-recipe-edit-button"
    >
      {recipe.status === "changes_requested"
  ? t("myRecipes.makeChanges")
  : recipe.status === "declined"
    ? t("myRecipes.reviseRecipe")
    : t("myRecipes.editRecipe")}
    </Link>
  )}

  {recipe.status === "pending" && (
    <span className="my-recipe-locked-note">
      {t("myRecipes.waitingForReview")}
    </span>
  )}

  {recipe.status === "approved" && (
    <span className="my-recipe-locked-note">
      {t("myRecipes.published")}
    </span>
  )}

  <button
    type="button"
    className="my-recipe-delete-button"
    onClick={() => handleDeleteRecipe(recipe)}
    disabled={deletingId === recipe.id}
  >
    <Trash2 size={15} />

    {deletingId === recipe.id
  ? t("myRecipes.deleting")
  : t("myRecipes.delete")}
  </button>
</div>
  </div>
</article>
          ))}
        </section>
      )}
    </main>
  );
}

export default MyRecipesPage;