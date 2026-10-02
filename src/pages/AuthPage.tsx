import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useTranslation } from "react-i18next";

import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

function AuthPage() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  const requestedPath: unknown =
    location.state?.from;

  const returnTo =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage(
        t("auth.enterEmailFirst"),
      );

      return;
    }

    setLoading(true);
    setMessage("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        },
      );

    if (error) {
      console.error(error);

      setMessage(
        t("auth.resetEmailError"),
      );

      setLoading(false);
      return;
    }

    setMessage(
      t("auth.resetEmailSent"),
    );

    setLoading(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              full_name: name,
            },
          },
        });

      if (error) {
        console.error(error);

        setMessage(
          t("auth.signupError"),
        );

        setLoading(false);
        return;
      }

      if (data.session) {
        setLoading(false);

        navigate("/", {
          replace: true,
        });

        return;
      }

      setMessage(
        t("auth.signupConfirmation"),
      );

      setLoading(false);
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error(error);

      setMessage(
        t("auth.loginError"),
      );

      setLoading(false);
      return;
    }

    setLoading(false);

    navigate(returnTo, {
      replace: true,
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link
          to="/"
          className="auth-logo"
        >
          Alf Sahten
        </Link>

        <div className="auth-brand-copy">
          <p className="section-kicker">
            {t("auth.brandKicker")}
          </p>

          <h1>
            {t("auth.brandTitleLine1")}
            <br />
            {t("auth.brandTitleLine2")}
          </h1>

          <p>
            {t("auth.brandText")}
          </p>
        </div>

        <span className="auth-brand-note">
          Alf sahten ♡
        </span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="section-kicker">
            {mode === "login"
              ? t("auth.welcomeBack")
              : t("auth.join")}
          </p>

          <h2>
            {mode === "login"
              ? t("auth.signIn")
              : t(
                  "auth.createAccountTitle",
                )}
          </h2>

          <p className="auth-intro">
            {mode === "login"
              ? t("auth.loginIntro")
              : t("auth.signupIntro")}
          </p>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {mode === "signup" && (
              <label>
                <span>
                  {t("auth.name")}
                </span>

                <div className="auth-input">
                  <UserRound size={18} />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder={t(
                      "auth.namePlaceholder",
                    )}
                    required
                  />
                </div>
              </label>
            )}

            <label>
              <span>
                {t("auth.email")}
              </span>

              <div className="auth-input">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    "auth.emailPlaceholder",
                  )}
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              <span>
                {t("auth.password")}
              </span>

              <div className="auth-input">
                <LockKeyhole size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    "auth.passwordPlaceholder",
                  )}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? t(
                          "auth.hidePassword",
                        )
                      : t(
                          "auth.showPassword",
                        )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            {mode === "login" && (
              <button
                type="button"
                className="auth-forgot-password"
                onClick={
                  handleForgotPassword
                }
                disabled={loading}
              >
                {t(
                  "auth.forgotPassword",
                )}
              </button>
            )}

            {message && (
              <p className="auth-message">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? t("auth.pleaseWait")
                : mode === "login"
                  ? t("auth.signIn")
                  : t(
                      "auth.createAccount",
                    )}

              {!loading && (
                <ArrowRight
                  size={17}
                />
              )}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? t("auth.newHere")
                : t(
                    "auth.alreadyHaveAccount",
                  )}
            </span>

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "signup"
                    : "login",
                );

                setMessage("");
              }}
            >
              {mode === "login"
                ? t(
                    "auth.createAccount",
                  )
                : t("auth.signIn")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;