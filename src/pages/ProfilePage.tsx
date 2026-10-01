import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  ChefHat,
  Globe2,
  LogOut,
  Mail,
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
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, preferred_language, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setName(data.full_name ?? "");
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setSaving(true);
    setMessage("");

    const language = i18n.language.split("-")[0];

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        preferred_language: language,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            full_name: name.trim(),
            preferred_language: language,
          }
        : current,
    );

    setMessage(t("profile.saved"));
    setSaving(false);
  }

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

  const roleLabel =
    profile?.role === "creator"
      ? t("profile.creator")
      : profile?.role === "admin"
        ? t("profile.admin")
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

        <div className="profile-avatar">
          <UserRound size={34} />
        </div>
      </section>

      <section className="profile-content">
        <form
          className="profile-card"
          onSubmit={handleSave}
        >
          <div className="profile-field">
            <label>{t("profile.name")}</label>

            <div className="profile-input">
              <UserRound size={18} />

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder={t("profile.name")}
              />
            </div>
          </div>

          <div className="profile-field">
            <label>{t("profile.email")}</label>

            <div className="profile-input profile-readonly">
              <Mail size={18} />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="profile-field">
            <label>{t("profile.language")}</label>

            <div className="profile-input profile-readonly">
              <Globe2 size={18} />

              <span>
                {i18n.language.startsWith("ar")
                  ? "العربية"
                  : i18n.language.startsWith("fr")
                    ? "Français"
                    : "English"}
              </span>
            </div>
          </div>

          <div className="profile-field">
            <label>{t("profile.accountType")}</label>

            <div className="profile-input profile-readonly">
              <ShieldCheck size={18} />
              <span>{roleLabel}</span>
            </div>
          </div>

          {message && (
            <p className="profile-success">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="profile-save-button"
            disabled={saving}
          >
            {saving
              ? t("profile.saving")
              : t("profile.saveChanges")}
          </button>
        </form>

        <aside className="profile-side-card">
          <ChefHat size={27} />

          <p className="section-kicker">
            Alf Sahten
          </p>

          <h2>
            {name || user.email?.split("@")[0]}
          </h2>

                    <p>{roleLabel}</p>

<Link
  to="/my-requests"
  className="profile-cook-link"
>
  <UserRound size={17} />

  <span>{t("myServiceRequests.title")}</span>

  <ArrowRight size={16} />
</Link>

{profile?.role === "admin" && (
  <Link
    to="/admin/recipes"
    className="profile-cook-link"
  >
    <ShieldCheck size={17} />

    <span>{t("profile.adminDashboard")}</span>

    <ArrowRight size={16} />
  </Link>
)}

{profile?.role === "creator" ||
profile?.role === "admin" ? (
  <>
    <Link
      to="/cook/recipes"
      className="profile-cook-link"
    >
      <ChefHat size={17} />

      <span>{t("cookDashboard.myRecipes")}</span>

      <ArrowRight size={16} />
    </Link>

    <Link
      to="/cook/services"
      className="profile-cook-link"
    >
      <ChefHat size={17} />

      <span>{t("cookDashboard.whatIOffer")}</span>

      <ArrowRight size={16} />
    </Link>

    <Link
      to="/cook/requests"
      className="profile-cook-link"
    >
      <ChefHat size={17} />

      <span>{t("cookDashboard.requests")}</span>

      <ArrowRight size={16} />
    </Link>
  </>
) : (
  <Link
    to="/become-creator"
    className="profile-cook-link"
  >
    <ChefHat size={17} />

    <span>{t("profile.becomeCook")}</span>

    <ArrowRight size={16} />
  </Link>
)}

          <button
            type="button"
            className="profile-signout"
            onClick={handleSignOut}
          >
            <LogOut size={17} />
            {t("profile.signOut")}
          </button>
        </aside>
      </section>
    </main>
  );
}

export default ProfilePage;