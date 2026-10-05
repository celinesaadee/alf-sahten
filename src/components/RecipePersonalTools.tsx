import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./RecipePersonalTools.css";

type Entry = { notes: string; is_cooked: boolean };
function PersonalEditor({ recipeId, userId }: { recipeId: string; userId: string }) {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<Entry>({ notes: "", is_cooked: false });
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void supabase.from("personal_recipe_entries").select("notes, is_cooked")
      .eq("user_id", userId).eq("recipe_id", recipeId).maybeSingle().then(result => {
        if (cancelled) return;
        setLoading(false); setFailed(Boolean(result.error));
        if (!result.error) {
          const value = result.data ?? { notes: "", is_cooked: false };
          setEntry(value); setDraft(value.notes);
        }
      });
    return () => { cancelled = true; };
  }, [recipeId, userId, retry]);
  async function save(field: "notes" | "cooked") {
    if (busy || failed || loading) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.rpc("save_personal_recipe_entry", {
        p_recipe_id: recipeId,
        ...(field === "notes" ? { p_notes: draft } : { p_is_cooked: !entry.is_cooked }),
      }).single();
      if (error) throw error;
      setEntry(data as Entry);
      setMessage(t("personalRecipe.saved"));
    } catch { setMessage(t("personalRecipe.saveError")); }
    finally { setBusy(false); }
  }
  return <>
    {loading ? <p role="status">{t("personalRecipe.loading")}</p> : failed ? <p role="alert">
      {t("personalRecipe.loadError")} <button onClick={() => { setLoading(true); setRetry(v => v + 1); }}>{t("personalRecipe.retry")}</button>
    </p> : <>
      <button type="button" aria-pressed={entry.is_cooked} disabled={busy} onClick={() => void save("cooked")}>
        {t(entry.is_cooked ? "personalRecipe.cooked" : "personalRecipe.markCooked")}
      </button>
      <p>{t("personalRecipe.cookedHint")}</p>
      <label htmlFor="private-recipe-note">{t("personalRecipe.notes")}</label>
      <textarea id="private-recipe-note" rows={4} maxLength={5000} value={draft}
        disabled={busy} onChange={event => { setDraft(event.target.value); setMessage(""); }} />
      <small>{t("personalRecipe.private")}</small>
      <button type="button" disabled={busy || draft === entry.notes} onClick={() => void save("notes")}>
        {t(busy ? "personalRecipe.saving" : "personalRecipe.save")}
      </button>
    </>}
    {message && <p role="status">{message}</p>}
  </>;
}

export default function RecipePersonalTools({ recipeId }: { recipeId: string }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  return <section className="recipe-personal-tools" aria-label={t("personalRecipe.heading")}>
    <h2>{t("personalRecipe.heading")}</h2>
    {loading ? <p>{t("personalRecipe.loading")}</p> : user
      ? <PersonalEditor key={`${user.id}:${recipeId}`} recipeId={recipeId} userId={user.id} />
      : <Link to="/auth" state={{ from: `/recipe/${recipeId}` }}>{t("personalRecipe.signIn")}</Link>}
  </section>;
}
