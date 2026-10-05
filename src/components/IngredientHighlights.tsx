import { ingredientMentions } from "../lib/ingredientMentions";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import "./IngredientHighlights.css";

export type IngredientAmount = { name: string; quantity: string; unit: string };
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

export default function IngredientHighlights({ text, ingredients }: { text: string; ingredients: IngredientAmount[] }) {
  const prefix = useId();
  const { t } = useTranslation();
  return <>{ingredientMentions(text, ingredients.map(item => item.name)).map((piece, index) => {
    if (!piece.ingredient) return piece.text;
    const amounts = ingredients.filter(item => normalizeName(item.name) === normalizeName(piece.text));
    if (!amounts.length) return <mark className="ingredient-mention" key={index}>{piece.text}</mark>;
    const id = `${prefix}-ingredient-${index}`;
    return <span className="ingredient-mention-wrapper" key={index}>
      <button type="button" className="ingredient-mention" popoverTarget={id}
        aria-label={t("ingredientQuantity.open", { ingredient: piece.text })}>{piece.text}</button>
      <span id={id} popover="auto" className="ingredient-quantity-popover" role="dialog" aria-label={piece.text}>
        <strong dir="auto">{piece.text}</strong>
        {amounts.map((item, row) => <span className="ingredient-quantity-value" dir="auto" key={row}>
          {[item.quantity, item.unit].filter(Boolean).join(" ") || t("ingredientQuantity.unspecified")}
        </span>)}
        <small>{t("ingredientQuantity.current")}</small>
        <button type="button" popoverTarget={id} popoverTargetAction="hide" autoFocus>{t("ingredientQuantity.close")}</button>
      </span>
    </span>;
  })}</>;
}
