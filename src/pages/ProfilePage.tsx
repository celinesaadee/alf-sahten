import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  ChefHat,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  preferred_language: string;
  role: "user" | "creator" | "admin";
};

function ProfilePage() {
 const { t } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
const [name, setName] = useState("");
const [followerCount, setFollowerCount] =
  useState<number | null>(null);

const [isApprovedCook, setIsApprovedCook] =
  useState(false);
  const [cookUsername, setCookUsername] =
  useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [profileLoadError, setProfileLoadError] =
  useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
  setProfile(null);
  setLoading(false);
  return;
}

setLoading(true);
setProfileLoadError(false);

const { data, error } = await supabase
        .from("profiles")
        .select("full_name, preferred_language, role")
        .eq("id", user.id)
        .single();

      if (error) {
  console.error(error);
  setProfile(null);
  setProfileLoadError(true);
  setLoading(false);
  return;
}

setProfile(data);
setName(data.full_name ?? "");

const { data: cookData, error: cookError } =
  await supabase
    .from("cook_profiles")
    .select("follower_count, is_approved, username")
    .eq("user_id", user.id)
    .maybeSingle();

if (cookError) {
  console.error(
    "Could not load Cook follower count:",
    cookError,
  );
}

setIsApprovedCook(
  cookData?.is_approved === true,
);

setCookUsername(
  cookData?.username ?? null,
);

setFollowerCount(
  cookData?.is_approved
    ? cookData.follower_count ?? 0
    : null,
);
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  async function handleSignOut() {
    await signOut();
  }

  if (authLoading || loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-signed-out">
          <div className="profile-signed-out-icon">
            <UserRound size={31} />
          </div>

          <p className="section-kicker">
            {t("profile.kicker")}
          </p>

          <h1>{t("profile.signInTitle")}</h1>

          <p>{t("profile.signInText")}</p>

          <Link to="/auth">
            {t("profile.signIn")}
          </Link>
        </section>
      </main>
    );
  }

  if (profileLoadError) {
  return (
    <main className="profile-page">
      <section className="profile-signed-out">
        <div className="profile-signed-out-icon">
          <UserRound size={31} />
        </div>

        <h1>
          {t("profile.loadErrorTitle", {
            defaultValue: "We couldn't load your profile",
          })}
        </h1>

        <p>
          {t("profile.loadErrorText", {
            defaultValue:
              "Please refresh the page and try again.",
          })}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
        >
          {t("profile.tryAgain", {
            defaultValue: "Try again",
          })}
        </button>
      </section>
    </main>
  );
}

const roleLabel =
  profile?.role === "admin"
    ? t("profile.admin")
    : isApprovedCook
      ? t("profile.creator")
      : t("profile.regularUser");

  return (
    <main className="profile-page">
      <section className="profile-hero">
  <div>
    <p className="section-kicker">
      {t("profile.kicker")}
    </p>

    <h1>{t("profile.title")}</h1>

    <p>{t("profile.subtitle")}</p>
  </div>
</section>

<section className="profile-content">
  <section className="profile-dashboard-card">
    <div className="profile-dashboard-heading">
      <div className="profile-dashboard-icon">
        <UserRound size={24} />
      </div>

      <div>
        <p className="section-kicker">
          {t("profile.accountKicker")}
        </p>

        <h2>
          {name ||
            user.email?.split("@")[0]}
        </h2>

        <p>{roleLabel}</p>

        {followerCount !== null && (
          <div className="profile-follower-count">
            <strong>
              {followerCount}
            </strong>

            <span>
              {followerCount === 1
                ? t("profile.follower")
                : t("profile.followers")}
            </span>
          </div>
        )}
      </div>
    </div>

    <div className="profile-dashboard-actions">
      <Link
        to="/settings"
        className="profile-dashboard-action"
      >
        <Settings size={20} />

        <div>
          <strong>
            {t("profile.settingsTitle")}
          </strong>

          <span>
            {t("profile.settingsText")}
          </span>
        </div>

        <ArrowRight size={17} />
      </Link>

      <Link
        to="/my-requests"
        className="profile-dashboard-action"
      >
        <UserRound size={20} />

        <div>
          <strong>
            {t("myServiceRequests.title")}
          </strong>

          <span>
            {t("profile.requestsText")}
          </span>
        </div>

        <ArrowRight size={17} />
      </Link>
    </div>
  </section>

  <aside className="profile-side-card">
    <ChefHat size={27} />

    <p className="section-kicker">
      {t("profile.cookSpace")}
    </p>

    <h2>
      {t("profile.cookWorkspace", {
        defaultValue:
          "Cook workspace",
      })}
    </h2>

    <p>
      {t("profile.kitchenText")}
    </p>

    {isApprovedCook ||
    profile?.role === "admin" ? (
      <>
        {cookUsername && (
          <Link
            to={`/cooks/${cookUsername}`}
            className="profile-cook-link"
          >
            <UserRound size={17} />

            <span>
              {t(
                "profile.viewPublicProfile",
                {
                  defaultValue:
                    "View public profile",
                },
              )}
            </span>

            <ArrowRight size={16} />
          </Link>
        )}

        <Link
          to="/cook/recipes"
          className="profile-cook-link"
        >
          <ChefHat size={17} />

          <span>
            {t(
              "cookDashboard.myRecipes",
            )}
          </span>

          <ArrowRight size={16} />
        </Link>

        <Link
          to="/cook/services"
          className="profile-cook-link"
        >
          <ChefHat size={17} />

          <span>
            {t(
              "cookDashboard.whatIOffer",
            )}
          </span>

          <ArrowRight size={16} />
        </Link>

        <Link
          to="/cook/requests"
          className="profile-cook-link"
        >
          <ChefHat size={17} />

          <span>
            {t(
              "cookDashboard.requests",
            )}
          </span>

          <ArrowRight size={16} />
        </Link>
      </>
    ) : (
      <Link
        to="/become-creator"
        className="profile-cook-link"
      >
        <ChefHat size={17} />

        <span>
          {t("profile.becomeCook")}
        </span>

        <ArrowRight size={16} />
      </Link>
    )}

    {profile?.role === "admin" && (
      <div className="profile-admin-tools">
        <div className="profile-admin-tools-heading">
          <ShieldCheck size={17} />

          <strong>
            {t("profile.adminTools", {
              defaultValue:
                "Admin tools",
            })}
          </strong>
        </div>

        <Link
          to="/admin"
          className="profile-cook-link"
        >
          <ShieldCheck size={17} />

          <span>
            {t(
              "profile.adminDashboard",
              {
                defaultValue:
                  "Admin dashboard",
              },
            )}
          </span>

          <ArrowRight size={16} />
        </Link>
      </div>
    )}

    <div className="profile-signout-area">
      <button
        type="button"
        className="profile-signout"
        onClick={handleSignOut}
      >
        <LogOut size={17} />
        {t("profile.signOut")}
      </button>
    </div>
  </aside>
</section>
    </main>
  );
}

export default ProfilePage;