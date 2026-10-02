import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  preferred_language: string;
  role: "user" | "creator" | "admin";
};

type SettingsSection =
  | "account"
  | "security";

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [name, setName] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [
    profileLoadError,
    setProfileLoadError,
  ] = useState(false);

  const [accountSaving, setAccountSaving] =
    useState(false);

  const [
    accountMessage,
    setAccountMessage,
  ] = useState("");

  const [
    accountSaveError,
    setAccountSaveError,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileLoadError(false);

      const { data, error } =
        await supabase
          .from("profiles")
          .select(
            "full_name, preferred_language, role",
          )
          .eq("id", user.id)
          .single();

      if (error) {
        console.error(error);
        setProfile(null);
        setProfileLoadError(true);
        setProfileLoading(false);
        return;
      }

      setProfile(data);
      setName(data.full_name ?? "");
      setProfileLoading(false);
    }

    void loadProfile();
  }, [user]);

  async function handleSaveAccount(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setAccountSaving(true);
    setAccountMessage("");
    setAccountSaveError(false);

    const language =
      i18n.language.split("-")[0];

    const { error } =
      await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          preferred_language: language,
        })
        .eq("id", user.id);

    if (error) {
      console.error(error);
      setAccountSaveError(true);
      setAccountSaving(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            full_name: name.trim(),
            preferred_language:
              language,
          }
        : current,
    );

    setAccountMessage(
      t("profile.saved"),
    );

    setAccountSaving(false);
  }

  async function handleChangePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!user?.email) {
      setPasswordError(
  t("settings.emailMissing"),
);
      return;
    }

    if (!currentPassword) {
      setPasswordError(
  t("settings.currentPasswordRequired"),
);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        t("settings.passwordTooShort"),
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setPasswordError(
  t("settings.passwordsDoNotMatch"),
);
      return;
    }

    if (
      newPassword === currentPassword
    ) {
      setPasswordError(
  t("settings.passwordMustBeDifferent"),
);
      return;
    }

    setPasswordSaving(true);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword(
          {
            email: user.email,
            password: currentPassword,
          },
        );

      if (signInError) {
        setPasswordError(
  t("settings.currentPasswordIncorrect"),
);
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setPasswordMessage(
  t("settings.passwordUpdated"),
);
    } catch (error) {
      console.error(
        "Password update failed:",
        error,
      );

      setPasswordError(
  t("settings.passwordUpdateError"),
);
    } finally {
      setPasswordSaving(false);
    }
  }

  const roleLabel =
    profile?.role === "creator"
      ? t("profile.creator")
      : profile?.role === "admin"
        ? t("profile.admin")
        : t("profile.regularUser");

  return (
    <main className="settings-page">
      <section className="settings-hero">
        <p className="section-kicker">
  {t("settings.kicker")}
</p>

<h1>{t("settings.title")}</h1>

<p>
  {t("settings.subtitle")}
</p>
      </section>

      <section className="settings-content">
        <aside className="settings-sidebar">
          <button
            type="button"
            className={`settings-nav-item ${
              activeSection === "account"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("account")
            }
          >
            <UserRound size={18} />
            <span>{t("settings.account")}</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${
              activeSection === "security"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("security")
            }
          >
            <LockKeyhole size={18} />
            <span>{t("settings.security")}</span>
          </button>
        </aside>

        <div className="settings-panel">
          {activeSection ===
          "account" ? (
            <>
              <div className="settings-panel-heading">
                <div className="settings-panel-icon">
                  <UserRound size={22} />
                </div>

                <div>
                  <h2>
  {t("settings.accountTitle")}
</h2>

<p>
  {t("settings.accountText")}
</p>
                </div>
              </div>

              {profileLoading ? (
                <p>
  {t("settings.loadingAccount")}
</p>
              ) : profileLoadError ? (
                <div>
                  <p
                    className="settings-error"
                    role="alert"
                  >
                    <p
  className="settings-error"
  role="alert"
>
  {t("settings.loadAccountError")}
</p>
                  </p>

                  <button
                    type="button"
                    className="settings-save-button"
                    onClick={() =>
                      window.location.reload()
                    }
                  >
                    {t("settings.tryAgain")}
                  </button>
                </div>
              ) : (
                <form
                  className="settings-password-form"
                  onSubmit={
                    handleSaveAccount
                  }
                >
                  <label className="settings-field">
                    <span>
                      {t(
                        "profile.name",
                      )}
                    </span>

                    <div className="settings-input">
                      <UserRound
                        size={18}
                      />

                      <input
                        type="text"
                        value={name}
                        onChange={(
                          event,
                        ) =>
                          setName(
                            event.target
                              .value,
                          )
                        }
                        placeholder={t(
                          "profile.name",
                        )}
                      />
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>
                      {t(
                        "profile.email",
                      )}
                    </span>

                    <div className="settings-input settings-readonly">
                      <Mail size={18} />

                      <span>
                        {user?.email ??
                          "—"}
                      </span>
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>
                      {t(
                        "profile.language",
                      )}
                    </span>

                    <div className="settings-input settings-readonly">
                      <Globe2
                        size={18}
                      />

                      <span>
                        {i18n.language.startsWith(
                          "ar",
                        )
                          ? "العربية"
                          : i18n.language.startsWith(
                                "fr",
                              )
                            ? "Français"
                            : "English"}
                      </span>
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>
                      {t(
                        "profile.accountType",
                      )}
                    </span>

                    <div className="settings-input settings-readonly">
                      <ShieldCheck
                        size={18}
                      />

                      <span>
                        {roleLabel}
                      </span>
                    </div>
                  </label>

                  {accountMessage && (
                    <p
                      className="settings-success"
                      role="status"
                    >
                      {accountMessage}
                    </p>
                  )}

                  {accountSaveError && (
                    <p
                      className="settings-error"
                      role="alert"
                    >
                      {t(
                        "profile.saveError",
                        {
                          defaultValue:
                            "We couldn't save your changes. Please try again.",
                        },
                      )}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="settings-save-button"
                    disabled={
                      accountSaving
                    }
                  >
                    {accountSaving
                      ? t(
                          "profile.saving",
                        )
                      : t(
                          "profile.saveChanges",
                        )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="settings-panel-heading">
                <div className="settings-panel-icon">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <div>
                  <h2>
  {t("settings.securityTitle")}
</h2>

<p>
  {t("settings.securityText")}
</p>
                </div>
              </div>

              <div className="settings-account-email">
                <span>
  {t("settings.signedInAs")}
</span>

                <strong>
                  {user?.email ?? "—"}
                </strong>
              </div>

              <form
                className="settings-password-form"
                onSubmit={
                  handleChangePassword
                }
              >
                <label className="settings-field">
                  <span>
  {t("settings.currentPassword")}
</span>

                  <div className="settings-input">
                    <LockKeyhole
                      size={18}
                    />

                    <input
                      type="password"
                      value={
                        currentPassword
                      }
                      onChange={(
                        event,
                      ) =>
                        setCurrentPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="current-password"
                      placeholder={t(
  "settings.currentPasswordPlaceholder",
)}
                      required
                    />
                  </div>
                </label>

                <label className="settings-field">
                  <span>
  {t("settings.newPassword")}
</span>

                  <div className="settings-input">
                    <LockKeyhole
                      size={18}
                    />

                    <input
                      type="password"
                      value={
                        newPassword
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="new-password"
                      placeholder={t(
  "settings.newPasswordPlaceholder",
)}
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                <label className="settings-field">
                  <span>
  {t("settings.confirmNewPassword")}
</span>

                  <div className="settings-input">
                    <LockKeyhole
                      size={18}
                    />

                    <input
                      type="password"
                      value={
                        confirmNewPassword
                      }
                      onChange={(
                        event,
                      ) =>
                        setConfirmNewPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="new-password"
                      placeholder={t(
  "settings.confirmNewPasswordPlaceholder",
)}
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                {passwordError && (
                  <p
                    className="settings-error"
                    role="alert"
                  >
                    {passwordError}
                  </p>
                )}

                {passwordMessage && (
                  <p
                    className="settings-success"
                    role="status"
                  >
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="settings-save-button"
                  disabled={
                    passwordSaving
                  }
                >
                 {passwordSaving
  ? t("settings.updatingPassword")
  : t("settings.changePassword")}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default SettingsPage;
