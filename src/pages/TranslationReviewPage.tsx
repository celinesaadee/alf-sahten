import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loadTranslationReview, saveTranslation, type Language, type ReviewRecipe, type Translation, type TranslationContent } from "../services/translationReview";
import { translatePublishedRecipe } from "../services/recipes";
import "./TranslationReviewPage.css";

const languages: Language[] = ["en", "fr", "ar"];
const names = { en: "English", fr: "Français", ar: "العربية" };
const copy = {
  en: { heading: "Review translations", original: "Original", pending: "Pending review", approved: "Approved", missing: "Not generated", save: "Save draft", approve: "Approve translation", generate: "Generate translations", title: "Title", description: "Description", ingredients: "Ingredients", instructions: "Instructions", note: "Translations become public only after approval. Saving a draft removes its approval.", error: "Could not load translations. Please try again.", loading: "Loading…", saved: "Translation saved.", back: "Back to my recipes", retry: "Retry", quantity: "Quantity", unit: "Unit", ingredient: "Ingredient" },
  fr: { heading: "Réviser les traductions", original: "Original", pending: "À réviser", approved: "Approuvée", missing: "Non générée", save: "Enregistrer le brouillon", approve: "Approuver la traduction", generate: "Générer les traductions", title: "Titre", description: "Description", ingredients: "Ingrédients", instructions: "Instructions", note: "Les traductions deviennent publiques après approbation. Enregistrer un brouillon retire son approbation.", error: "Impossible de charger les traductions. Réessayez.", loading: "Chargement…", saved: "Traduction enregistrée.", back: "Retour à mes recettes", retry: "Réessayer", quantity: "Quantité", unit: "Unité", ingredient: "Ingrédient" },
  ar: { heading: "مراجعة الترجمات", original: "الأصل", pending: "بانتظار المراجعة", approved: "معتمدة", missing: "لم تُنشأ بعد", save: "حفظ المسودة", approve: "اعتماد الترجمة", generate: "إنشاء الترجمات", title: "العنوان", description: "الوصف", ingredients: "المكونات", instructions: "الخطوات", note: "تظهر الترجمات للعامة بعد اعتمادها فقط. حفظ المسودة يلغي اعتمادها.", error: "تعذر تحميل الترجمات. حاول مجددًا.", loading: "جارٍ التحميل…", saved: "تم حفظ الترجمة.", back: "العودة إلى وصفاتي", retry: "إعادة المحاولة", quantity: "الكمية", unit: "الوحدة", ingredient: "المكون" },
};

export default function TranslationReviewPage() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const c = copy[locale];
  const [recipe, setRecipe] = useState<ReviewRecipe | null>(null);
  const [rows, setRows] = useState<Translation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Language | "original">("original");
  const [draft, setDraft] = useState<TranslationContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (id) void loadTranslationReview(id).then(result => {
      if (!cancelled) { setRecipe(result.recipe); setRows(result.translations); setIsAdmin(result.isAdmin); setError(false); setTab("original"); setDraft(null); }
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [id, reload]);
  const row = rows.find(item => item.language === tab);
  const original = tab === "original" || tab === recipe?.original_language;
  const content = original ? recipe : draft;
  async function save(approve: boolean) {
    if (!row || !draft || busy) return;
    setBusy(true); setMessage("");
    try {
      const saved = await saveTranslation(row, draft, approve);
      setRows(current => current.map(item => item.id === saved.id ? saved : item));
      setMessage(c.saved);
    } catch (e) { setMessage(e instanceof Error ? e.message : c.error); }
    finally { setBusy(false); }
  }
  async function generate() {
    if (!id || busy) return;
    setBusy(true); setMessage("");
    try { await translatePublishedRecipe(id); setReload(value => value + 1); }
    catch { setMessage(c.error); }
    finally { setBusy(false); }
  }
  return <main className="translation-review" dir={locale === "ar" ? "rtl" : "ltr"}>
    <Link to={isAdmin ? "/admin/recipes" : "/cook/recipes"}>{c.back}</Link>
    <h1>{c.heading}</h1><p>{c.note}</p>
    {error ? <p role="alert">{c.error} <button onClick={() => setReload(v => v + 1)}>{c.retry}</button></p> : !recipe ? <p role="status">{c.loading}</p> : <>
      <h2>{recipe.title}</h2>
      <div className="translation-tabs" aria-label={c.heading}>
        {(["original", ...languages] as const).map(language => <button key={language} disabled={busy} aria-pressed={tab === language} onClick={() => {
          setTab(language); setDraft(rows.find(item => item.language === language) ?? null); setMessage("");
        }}>
          {language === "original" ? c.original : names[language]}
          {language !== "original" && <small>{language === recipe.original_language ? c.original : rows.find(r => r.language === language)?.review_status === "approved" ? c.approved : rows.some(r => r.language === language) ? c.pending : c.missing}</small>}
        </button>)}
      </div>
      {isAdmin && <button disabled={busy} onClick={generate}>{busy ? c.loading : c.generate}</button>}
      {content ? <form dir={(original ? recipe.original_language : tab) === "ar" ? "rtl" : "ltr"} onSubmit={e => { e.preventDefault(); void save(false); }}>
        <label>{c.title}<input required disabled={busy} readOnly={original} value={content.title} onChange={e => setDraft({ ...content, title: e.target.value })} /></label>
        <label>{c.description}<textarea disabled={busy} readOnly={original} value={content.description ?? ""} onChange={e => setDraft({ ...content, description: e.target.value })} /></label>
        <h3>{c.ingredients}</h3>
        {content.ingredients.map((item, index) => <div className="translation-ingredient" key={index}>
          {(["quantity", "unit", "ingredient"] as const).map(field => <label key={field}>{c[field]}<input required={field === "ingredient"} disabled={busy} readOnly={original} value={item[field]} onChange={e => setDraft({ ...content, ingredients: content.ingredients.map((value, i) => i === index ? { ...value, [field]: e.target.value } : value) })} /></label>)}
        </div>)}
        <h3>{c.instructions}</h3>
        {content.instructions.map((item, index) => <label key={index}>{index + 1}<textarea required disabled={busy} readOnly={original} value={item.text} onChange={e => setDraft({ ...content, instructions: content.instructions.map((value, i) => i === index ? { ...value, text: e.target.value } : value) })} /></label>)}
        {!original && <div className="translation-actions"><button disabled={busy} type="submit">{c.save}</button><button disabled={busy} type="button" onClick={e => { if (e.currentTarget.form?.reportValidity()) void save(true); }}>{c.approve}</button></div>}
      </form> : <p>{c.missing}</p>}
    </>}
    {message && <p role="status">{message}</p>}
  </main>;
}
