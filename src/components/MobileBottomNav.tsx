import {
  Bookmark,
  ChefHat,
  Compass,
  Home,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function MobileBottomNav() {
  const { t } = useTranslation();

  const navItems = [
    {
      label: t("common.home"),
      path: "/",
      icon: Home,
    },
    {
      label: t("nav.discover"),
      path: "/discover",
      icon: Compass,
    },
    {
      label: t("nav.kitchen"),
      path: "/kitchen",
      icon: ChefHat,
    },
    {
      label: t("common.saved"),
      path: "/saved",
      icon: Bookmark,
    },
    {
      label: t("nav.profile"),
      path: "/profile",
      icon: UserRound,
    },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <Icon size={21} strokeWidth={1.8} />

            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;