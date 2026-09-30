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
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

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
          event === "PASSWORD_RECOVERY" ||
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
    event: FormEvent,
  ) {
    event.preventDefault();

    setMessage("");

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setMessage(
        "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Your password has been updated.",
    );

    setLoading(false);

    setTimeout(() => {
      navigate("/profile");
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
            Account recovery
          </p>

          <h1>
            Choose a new
            <br />
            password.
          </h1>

          <p>
            Create a new password for
            your Alf Sahten account.
          </p>
        </div>

        <span className="auth-brand-note">
          Alf sahten ♡
        </span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="section-kicker">
            Reset password
          </p>

          <h2>
            Create a new password
          </h2>

          {!ready ? (
            <>
              <p className="auth-intro">
                Open this page from the
                password reset link sent
                to your email.
              </p>

              <Link
                to="/auth"
                className="auth-submit"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>
                  New password
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
                        event.target
                          .value,
                      )
                    }
                    placeholder="At least 6 characters"
                    minLength={6}
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
                        ? "Hide password"
                        : "Show password"
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
                  Confirm password
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
                        event.target
                          .value,
                      )
                    }
                    placeholder="Repeat your password"
                    minLength={6}
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
                  ? "Updating..."
                  : "Update password"}

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