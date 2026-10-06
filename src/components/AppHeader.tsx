import { useState } from "react";

import {
  Bookmark,
  Languages,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";

import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

import NotificationBell from "./NotificationBell";

function AppHeader() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        <img src="/alf-sahten-logo.png" alt="Alf Sahten" className="app-brand-logo" />
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
  className="language-select"
  dir="ltr"
  value={i18n.language.split("-")[0]}
  onChange={(event) =>
    i18n.changeLanguage(event.target.value)
  }
  aria-label={t("nav.selectLanguage")}
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
  className="header-icon-button header-profile-button"
  aria-label={t("nav.profile")}
>
  <UserRound size={20} strokeWidth={1.8} />
</NavLink>

        <NotificationBell />

        <div className="header-menu-wrap">
  <button
    type="button"
    className="header-icon-button header-menu-button"
    aria-label={t("nav.menu")}
    aria-expanded={menuOpen}
    onClick={() =>
      setMenuOpen((current) => !current)
    }
  >
    <Menu size={22} strokeWidth={1.8} />
  </button>

  {menuOpen && (
    <div className="header-account-menu">
      {user ? (
        <>

          <Link
            to="/settings"
            className="header-account-menu-item"
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={17} />
            <span>{t("nav.settings")}</span>
          </Link>

          <Link
            to="/my-requests"
            className="header-account-menu-item"
            onClick={() => setMenuOpen(false)}
          >
            <Bookmark size={17} />
            <span>{t("nav.myRequests")}</span>
          </Link>

          <div className="header-account-menu-divider" />

          <button
            type="button"
            className="header-account-menu-item header-account-menu-signout"
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
          >
            <LogOut
  size={17}
  className="header-directional-icon"
/>
            <span>{t("nav.signOut")}</span>
          </button>
        </>
      ) : (
        <Link
          to="/auth"
          className="header-account-menu-item"
          onClick={() => setMenuOpen(false)}
        >
          <UserRound size={17} />
          <span>{t("nav.signIn")}</span>
        </Link>
      )}
    </div>
  )}
</div>
      </div>
    </header>
  );
}

export default AppHeader;
