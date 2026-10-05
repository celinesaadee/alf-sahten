import assert from "node:assert/strict";
import test from "node:test";
import { ingredientMentions } from "../src/lib/ingredientMentions.ts";
const highlighted = (text: string, names: string[]) => ingredientMentions(text, names).filter(p => p.ingredient).map(p => p.text);

test("repeated ingredients match case-insensitively; all text is preserved", () => {
  const text = "Mix FLOUR, sugar and flour.\nAdd water.";
  assert.deepEqual(highlighted(text, ["flour", "sugar", "water"]), ["FLOUR", "sugar", "flour", "water"]);
  assert.equal(ingredientMentions(text, ["flour", "sugar", "water"]).map(p => p.text).join(""), text);
});
test("matches phrases longest first and respects word boundaries", () => {
  assert.deepEqual(highlighted("Add olive oil and oil, not oilseed; ham is not champignon.", ["oil", "olive oil", "ham"]), ["olive oil", "oil", "ham"]);
  assert.deepEqual(highlighted("Add olive\n oil.", ["olive oil"]), ["olive\n oil"]);
});
test("French and Arabic ingredient names match without breaking words", () => {
  assert.deepEqual(highlighted("Ajoutez du sucre et des œufs.", ["sucre", "œufs"]), ["sucre", "œufs"]);
  assert.deepEqual(highlighted("امزج الدقيق مع السكر ثم أضف ماء.", ["الدقيق", "السكر", "ماء"]), ["الدقيق", "السكر", "ماء"]);
  assert.deepEqual(highlighted("دقيق دقيقات", ["دقيق"]), ["دقيق"]);
});
test("escapes regex metacharacters and safely preserves markup-like input", () => {
  const text = "Add flour (plain), then <script>alert(1)</script>.";
  assert.deepEqual(highlighted(text, ["flour (plain)", "["]), ["flour (plain)"]);
  assert.equal(ingredientMentions(text, ["flour (plain)"]).map(p => p.text).join(""), text);
  assert.deepEqual(highlighted("Mix everything together.", []), []);
  assert.equal(ingredientMentions("", ["flour"])[0].text, "");
});
