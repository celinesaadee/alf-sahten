import { ingredientMentions } from "../lib/ingredientMentions";
import "./IngredientHighlights.css";

export default function IngredientHighlights({ text, ingredients }: { text: string; ingredients: string[] }) {
  return <>{ingredientMentions(text, ingredients).map((piece, index) => piece.ingredient
    ? <mark className="ingredient-mention" key={index}>{piece.text}</mark>
    : piece.text)}</>;
}
