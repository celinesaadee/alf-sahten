type SupportedRecipeLanguage =
  | "en"
  | "ar"
  | "fr";

type LanguageTranslation = {
  ar: string;
  fr: string;
};

const ingredientNames: Record<
  string,
  LanguageTranslation
> = {
  Tomatoes: {
    ar: "بندورة",
    fr: "Tomates",
  },

  Tomato: {
    ar: "بندورة",
    fr: "Tomate",
  },

  Cucumber: {
    ar: "خيار",
    fr: "Concombre",
  },

  "Small onion": {
    ar: "بصلة صغيرة",
    fr: "Petit oignon",
  },

  Onion: {
    ar: "بصل",
    fr: "Oignon",
  },

  Parsley: {
    ar: "بقدونس",
    fr: "Persil",
  },

  "Pita breads": {
    ar: "خبز عربي",
    fr: "Pains pita",
  },

  Lemon: {
    ar: "ليمون",
    fr: "Citron",
  },

  Lemons: {
    ar: "ليمون",
    fr: "Citrons",
  },

  "Olive oil": {
    ar: "زيت زيتون",
    fr: "Huile d’olive",
  },

  Sumac: {
    ar: "سماق",
    fr: "Sumac",
  },

  Salt: {
    ar: "ملح",
    fr: "Sel",
  },

  "Chicken breasts": {
    ar: "صدور دجاج",
    fr: "Blancs de poulet",
  },

  "Garlic cloves": {
    ar: "فصوص ثوم",
    fr: "Gousses d’ail",
  },

  "Dried oregano": {
    ar: "أوريغانو مجفف",
    fr: "Origan séché",
  },

  Oregano: {
    ar: "أوريغانو",
    fr: "Origan",
  },

  "Salt and black pepper": {
    ar: "ملح وفلفل أسود",
    fr: "Sel et poivre noir",
  },

  Labneh: {
    ar: "لبنة",
    fr: "Labneh",
  },

  "Fresh mint": {
    ar: "نعنع أخضر",
    fr: "Menthe fraîche",
  },

  Olives: {
    ar: "زيتون",
    fr: "Olives",
  },

  Potatoes: {
    ar: "بطاطا",
    fr: "Pommes de terre",
  },

  Pasta: {
    ar: "باستا",
    fr: "Pâtes",
  },

  Mushrooms: {
    ar: "فطر",
    fr: "Champignons",
  },

  "Cooking cream": {
    ar: "كريمة طبخ",
    fr: "Crème de cuisson",
  },

  Parmesan: {
    ar: "بارميزان",
    fr: "Parmesan",
  },

  Flour: {
    ar: "طحين",
    fr: "Farine",
  },

  Sugar: {
    ar: "سكر",
    fr: "Sucre",
  },

  Eggs: {
    ar: "بيض",
    fr: "Œufs",
  },

  Butter: {
    ar: "زبدة",
    fr: "Beurre",
  },

  "Baking powder": {
    ar: "بايكنغ باودر",
    fr: "Levure chimique",
  },

  Milk: {
    ar: "حليب",
    fr: "Lait",
  },
};

function normalizeLanguage(
  language: string,
): SupportedRecipeLanguage {
  const languageCode =
    language.split("-")[0];

  if (
    languageCode === "ar" ||
    languageCode === "fr"
  ) {
    return languageCode;
  }

  return "en";
}

export function getLocalizedIngredientName(
  name: string,
  language: string,
): string {
  const normalizedLanguage =
    normalizeLanguage(language);

  if (
    normalizedLanguage === "en"
  ) {
    return name;
  }

  const directMatch =
    ingredientNames[name]?.[
      normalizedLanguage
    ];

  if (directMatch) {
    return directMatch;
  }

  const matchedKey =
    Object.keys(
      ingredientNames,
    ).find(
      (key) =>
        key.toLowerCase() ===
        name
          .trim()
          .toLowerCase(),
    );

  if (!matchedKey) {
    return name;
  }

  return (
    ingredientNames[
      matchedKey
    ]?.[
      normalizedLanguage
    ] ?? name
  );
}

export function getCanonicalIngredientName(
  value: string,
  language: string,
): string {
  const cleanValue =
    value.trim();

  if (!cleanValue) {
    return "";
  }

  const directCanonical =
    Object.keys(
      ingredientNames,
    ).find(
      (key) =>
        key.toLowerCase() ===
        cleanValue.toLowerCase(),
    );

  if (directCanonical) {
    return directCanonical;
  }

  const normalizedLanguage =
    normalizeLanguage(language);

  if (
    normalizedLanguage !== "en"
  ) {
    const translatedMatch =
      Object.entries(
        ingredientNames,
      ).find(
        ([, translations]) =>
          translations[
            normalizedLanguage
          ]
            .toLowerCase()
            .trim() ===
          cleanValue
            .toLowerCase()
            .trim(),
      );

    if (translatedMatch) {
      return translatedMatch[0];
    }
  }

  return cleanValue;
}