import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getLegalLanguage,
  termsContent,
} from "../data/legalContent";

import "./LegalPage.css";

function TermsPage() {
  const { i18n } = useTranslation();

  const language =
    getLegalLanguage(
      i18n.resolvedLanguage ??
        i18n.language,
    );

  const content =
    termsContent[language];

  useEffect(() => {
    document.title =
      `${content.title} | Alf Sahten`;
  }, [content.title]);

  const backLabel =
    language === "fr"
      ? "Retour à l'accueil"
      : language === "ar"
        ? "العودة إلى الصفحة الرئيسية"
        : "Back to home";

  return (
    <main
      className="legal-page"
      dir={i18n.dir()}
    >
      <div className="legal-container">
        <header className="legal-header">
          <p className="legal-eyebrow">
            Alf Sahten
          </p>

          <h1>{content.title}</h1>

          <p className="legal-intro">
            {content.intro}
          </p>

          <p className="legal-updated">
            {content.lastUpdated}
          </p>
        </header>

        <div className="legal-content">
          {content.sections.map(
            (section) => (
              <section
                className="legal-section"
                key={section.title}
              >
                <h2>
                  {section.title}
                </h2>

                {section.paragraphs.map(
                  (paragraph) => (
                    <p key={paragraph}>
                      {paragraph}
                    </p>
                  ),
                )}
              </section>
            ),
          )}
        </div>

        <Link
          to="/"
          className="legal-back"
        >
          ← {backLabel}
        </Link>
      </div>
    </main>
  );
}

export default TermsPage;