import {
  Link,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";

function CookDashboardNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const recipesActive =
    location.pathname.startsWith(
      "/cook/recipes",
    );

  const servicesActive =
    location.pathname.startsWith(
      "/cook/services",
    );

  const requestsActive =
    location.pathname.startsWith(
      "/cook/requests",
    );

  return (
    <nav className="cook-dashboard-nav">
      <Link
        to="/cook/recipes"
        className={
          recipesActive
            ? "cook-dashboard-nav-link active"
            : "cook-dashboard-nav-link"
        }
      >
        {t(
          "cookDashboard.myRecipes",
        )}
      </Link>

      <Link
        to="/cook/services"
        className={
          servicesActive
            ? "cook-dashboard-nav-link active"
            : "cook-dashboard-nav-link"
        }
      >
        {t(
          "cookDashboard.whatIOffer",
        )}
      </Link>

      <Link
        to="/cook/requests"
        className={
          requestsActive
            ? "cook-dashboard-nav-link active"
            : "cook-dashboard-nav-link"
        }
      >
        {t(
          "cookDashboard.requests",
        )}
      </Link>
    </nav>
  );
}

export default CookDashboardNav;