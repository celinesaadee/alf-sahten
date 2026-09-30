import {
  Bookmark,
  Languages,
  Menu,
  UserRound,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

function AppHeader() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        Alf Sahten
      </Link>

      <nav className="app-header-links">
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          {t("nav.discover")}
        </NavLink>

        <NavLink
          to="/kitchen"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          {t("nav.kitchen")}
        </NavLink>

        <Link to="/#creators">
          {t("nav.creators")}
        </Link>

        <Link to="/#cookbooks">
          {t("nav.cookbooks")}
        </Link>
      </nav>

      <div className="app-header-actions">
        <div className="language-switcher">
          <Languages size={17} />

          <select
            value={i18n.language.split("-")[0]}
            onChange={(event) =>
              i18n.changeLanguage(event.target.value)
            }
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
            <option value="fr">FR</option>
          </select>
        </div>

        <NavLink
          to="/saved"
          className="header-saved-button"
        >
          <Bookmark size={17} strokeWidth={1.8} />

          <span>{t("nav.saved")}</span>
        </NavLink>

        <NavLink
  to={user ? "/profile" : "/auth"}
  className="header-icon-button"
  aria-label={t("nav.profile")}
>
  <UserRound size={20} strokeWidth={1.8} />
</NavLink>

        <button
          type="button"
          className="header-icon-button header-menu-button"
          aria-label="Menu"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}

export default AppHeader;