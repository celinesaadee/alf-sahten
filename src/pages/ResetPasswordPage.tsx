import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useTranslation } from "react-i18next";

import { supabase } from "../lib/supabase";

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (
          mounted &&
          data.session
        ) {
          setReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event ===
            "PASSWORD_RECOVERY" ||
          session
        ) {
          setReady(true);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage(
        t("resetPassword.tooShort"),
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        t("resetPassword.mismatch"),
      );

      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(error);

      setMessage(
        t(
          "resetPassword.updateError",
        ),
      );

      setLoading(false);
      return;
    }

    setMessage(
      t("resetPassword.updated"),
    );

    setLoading(false);

    setTimeout(() => {
      navigate("/");
    }, 1200);
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
            {t(
              "resetPassword.brandKicker",
            )}
          </p>

          <h1>
            {t(
              "resetPassword.brandTitleLine1",
            )}
            <br />
            {t(
              "resetPassword.brandTitleLine2",
            )}
          </h1>

          <p>
            {t(
              "resetPassword.brandText",
            )}
          </p>
        </div>

        <span className="auth-brand-note">
          Alf sahten ♡
        </span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="section-kicker">
            {t("resetPassword.kicker")}
          </p>

          <h2>
            {t("resetPassword.title")}
          </h2>

          {!ready ? (
            <>
              <p className="auth-intro">
                {t(
                  "resetPassword.invalidLink",
                )}
              </p>

              <Link
                to="/auth"
                className="auth-submit"
              >
                {t(
                  "resetPassword.backToSignIn",
                )}
              </Link>
            </>
          ) : (
            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>
                  {t(
                    "resetPassword.newPassword",
                  )}
                </span>

                <div className="auth-input">
                  <LockKeyhole
                    size={18}
                  />

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
                      "resetPassword.newPasswordPlaceholder",
                    )}
                    autoComplete="new-password"
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
                            "resetPassword.hidePassword",
                          )
                        : t(
                            "resetPassword.showPassword",
                          )
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>
                </div>
              </label>

              <label>
                <span>
                  {t(
                    "resetPassword.confirmPassword",
                  )}
                </span>

                <div className="auth-input">
                  <LockKeyhole
                    size={18}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder={t(
                      "resetPassword.confirmPasswordPlaceholder",
                    )}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </label>

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
                  ? t(
                      "resetPassword.updating",
                    )
                  : t(
                      "resetPassword.updatePassword",
                    )}

                {!loading && (
                  <ArrowRight
                    size={17}
                  />
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
