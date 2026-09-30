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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath: unknown = location.state?.from;

const returnTo =
  typeof requestedPath === "string" &&
  requestedPath.startsWith("/") &&
  !requestedPath.startsWith("//")
    ? requestedPath
    : "/profile";

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [name, setName] = useState("");
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
      "Enter your email address first.",
    );
    return;
  }

  setLoading(true);
  setMessage("");

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

  if (error) {
    setMessage(error.message);
    setLoading(false);
    return;
  }

  setMessage(
    "If an account exists for this email, we sent a password reset link.",
  );

  setLoading(false);
}  

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } =
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
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Account created. Check your email if confirmation is required.",
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
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate(returnTo, { replace: true });
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
            Welcome to the table
          </p>

          <h1>
            Cook more.
            <br />
            Waste less.
          </h1>

          <p>
            Save recipes, build your kitchen and discover what
            you can cook with what you already have.
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
              ? "Welcome back"
              : "Join Alf Sahten"}
          </p>

          <h2>
            {mode === "login"
              ? "Sign in"
              : "Create your account"}
          </h2>

          <p className="auth-intro">
            {mode === "login"
              ? "Your saved recipes and kitchen are waiting."
              : "Start building your personal Alf Sahten kitchen."}
          </p>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {mode === "signup" && (
              <label>
                <span>Name</span>

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
                    placeholder="Your name"
                    required
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email</span>

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
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>

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
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
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
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}

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
                ? "New to Alf Sahten?"
                : "Already have an account?"}
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
                ? "Create an account"
                : "Sign in"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
