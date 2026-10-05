import assert from "node:assert/strict";
import test from "node:test";
import { detectRecipeLanguage } from "../src/lib/recipeLanguage.ts";

test("recognizes supported recipe captions", () => {
  assert.equal(detectRecipeLanguage("Chocolate cake. Mix the flour and sugar with butter. Bake in the oven until cooked."), "en");
  assert.equal(detectRecipeLanguage("Gâteau au chocolat. Mélangez la farine et le sucre avec du beurre. Faites cuire dans le four."), "fr");
  assert.equal(detectRecipeLanguage("كيكة الشوكولاتة. امزج الدقيق والسكر مع الزبدة ثم اخبز في الفرن لمدة ثلاثين دقيقة."), "ar");
});

test("handles unaccented French and social noise", () => {
  assert.equal(detectRecipeLanguage("Melangez la farine et le sucre avec du beurre puis faites cuire au four. #ingredients #oven #cup https://example.com/english"), "fr");
  assert.equal(detectRecipeLanguage("Mix the flour and sugar with butter. Bake in the oven. #recette #farine #sucre @la"), "en");
});

test("does not guess short, empty, unsupported, or balanced mixed captions", () => {
  for (const caption of ["", "Chocolate cake", "Gâteau délicieux", "#recipe #recette #food", "Mezcla la harina con el azúcar y cocina en el horno.", "Смешайте муку и сахар и выпекайте в духовке.", "Mix flour and sugar. Melangez farine et sucre avec du beurre."])
    assert.equal(detectRecipeLanguage(caption), null, caption);
});
