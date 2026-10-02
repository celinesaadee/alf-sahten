import {
  ArrowRight,
  ChefHat,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./AdminDashboardPage.css";

function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-header">
          <p className="eyebrow">
            {t("adminDashboard.kicker", {
              defaultValue: "Admin",
            })}
          </p>

          <h1>
            {t("adminDashboard.title", {
              defaultValue: "Admin dashboard",
            })}
          </h1>

          <p>
            {t("adminDashboard.intro", {
              defaultValue:
                "Manage Cook applications and review recipes before they go live.",
            })}
          </p>
        </header>

        <section className="admin-dashboard-grid">
          <Link
            to="/admin/cook-applications"
            className="admin-dashboard-card"
          >
            <div className="admin-dashboard-card-icon">
              <ShieldCheck size={25} />
            </div>

            <div className="admin-dashboard-card-copy">
              <h2>
                {t(
                  "adminDashboard.cookApplicationsTitle",
                  {
                    defaultValue:
                      "Cook applications",
                  },
                )}
              </h2>

              <p>
                {t(
                  "adminDashboard.cookApplicationsText",
                  {
                    defaultValue:
                      "Review people who want to become Cooks on Alf Sahten.",
                  },
                )}
              </p>
            </div>

            <ArrowRight
              size={19}
              className="admin-dashboard-card-arrow"
            />
          </Link>

          <Link
            to="/admin/recipes"
            className="admin-dashboard-card"
          >
            <div className="admin-dashboard-card-icon">
              <ChefHat size={25} />
            </div>

            <div className="admin-dashboard-card-copy">
              <h2>
                {t(
                  "adminDashboard.recipeReviewsTitle",
                  {
                    defaultValue:
                      "Recipe reviews",
                  },
                )}
              </h2>

              <p>
                {t(
                  "adminDashboard.recipeReviewsText",
                  {
                    defaultValue:
                      "Review recipes submitted by Cooks before they appear publicly.",
                  },
                )}
              </p>
            </div>

            <ArrowRight
              size={19}
              className="admin-dashboard-card-arrow"
            />
          </Link>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboardPage;