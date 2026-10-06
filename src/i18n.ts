import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import fr from "./locales/fr";
import ar from "./locales/ar";
import { enOnboarding, frOnboarding, arOnboarding } from "./locales/onboarding";

const supportedLanguages = ["en", "fr", "ar"];

const savedLanguage = localStorage.getItem(
  "alf-sahten-language",
);

const browserLanguage =
  navigator.language.split("-")[0].toLowerCase();

const initialLanguage =
  savedLanguage &&
  supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : supportedLanguages.includes(browserLanguage)
      ? browserLanguage
      : "en";

function updateDocumentLanguage(language: string) {
  const languageCode = language.split("-")[0];

  document.documentElement.lang = languageCode;

  document.documentElement.dir =
    languageCode === "ar" ? "rtl" : "ltr";

  document.body.classList.toggle(
    "arabic-language",
    languageCode === "ar",
  );

  localStorage.setItem(
    "alf-sahten-language",
    languageCode,
  );
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en.translation, onboarding: enOnboarding } },
      fr: { translation: { ...fr.translation, onboarding: frOnboarding } },
      ar: { translation: { ...ar.translation, onboarding: arOnboarding } },
    },

    lng: initialLanguage,
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

updateDocumentLanguage(initialLanguage);

i18n.on("languageChanged", (language) => {
  updateDocumentLanguage(language);
});

export default i18n;
