import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type RoleAccess = "cook" | "admin";
type Access = RoleAccess | "authenticated";

type PermissionStatus =
  | "loading"
  | "allowed"
  | "denied"
  | "error";

function PermissionCheck({
  access,
  userId,
}: {
  access: RoleAccess;
  userId: string;
}) {
  const { t } = useTranslation();
  const [status, setStatus] =
    useState<PermissionStatus>("loading");

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    async function queryPermission() {
  if (access === "admin") {
    return supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .maybeSingle();
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .abortSignal(controller.signal)
    .maybeSingle();

  if (profileResult.error) {
    return {
      data: null,
      error: profileResult.error,
    };
  }

  if (profileResult.data?.role === "admin") {
    return {
      data: {
        is_approved: true,
      },
      error: null,
    };
  }

  return supabase
    .from("cook_profiles")
    .select("is_approved")
    .eq("user_id", userId)
    .abortSignal(controller.signal)
    .maybeSingle();
}

    async function checkPermission() {
      try {
        let result = await queryPermission();

        /*
         * A browser tab can occasionally still hold an expired
         * access token while Supabase already has a valid refresh
         * token. Refresh once and retry before showing an error.
         */
        if (result.error) {
          const {
            data: refreshData,
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (
            !refreshError &&
            refreshData.session &&
            !cancelled
          ) {
            result = await queryPermission();
          }
        }

        if (result.error) {
          throw result.error;
        }

        const allowed =
          access === "admin"
            ? Boolean(
                result.data &&
                  "role" in result.data &&
                  result.data.role === "admin",
              )
            : Boolean(
                result.data &&
                  "is_approved" in result.data &&
                  result.data.is_approved === true,
              );

        if (!cancelled) {
          setStatus(
            allowed ? "allowed" : "denied",
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Permission check failed:",
            error,
          );

          setStatus("error");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkPermission();

    return () => {
      cancelled = true;

      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [access, userId, attempt]);

  if (status === "loading") {
  return (
    <main role="status">
      {t("protectedRoute.checkingAccess")}
    </main>
  );
}

  if (status === "error") {
  return (
    <main>
      <p role="alert">
        {t("protectedRoute.accessError")}
      </p>

      <button
        type="button"
        onClick={() => {
          setStatus("loading");
          setAttempt((value) => value + 1);
        }}
      >
        {t("protectedRoute.tryAgain")}
      </button>

      <p>
        <Link to="/profile">
          {t("protectedRoute.backToProfile")}
        </Link>
      </p>
        </main>
  );
}

  if (status === "denied") {
    return (
      <Navigate
        to={
          access === "cook"
            ? "/become-creator"
            : "/profile"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default function ProtectedRoute({
  access = "authenticated",
}: {
  access?: Access;
}) {
const { user, loading } = useAuth();
const { t } = useTranslation();
const location = useLocation();

if (loading) {
  return (
    <main role="status">
      {t("protectedRoute.checkingSession")}
    </main>
  );
}

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from:
            location.pathname +
            location.search +
            location.hash,
        }}
      />
    );
  }

  if (access === "authenticated") {
  return <Outlet />;
}

return (
  <PermissionCheck
    key={`${user.id}:${access}`}
    access={access}
    userId={user.id}
  />
);
}