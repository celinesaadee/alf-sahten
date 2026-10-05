import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CALLBACK_URL =
  "https://ixsdehujvfncqsxqhsfb.supabase.co/functions/v1/instagram-oauth-callback";

const DEFAULT_APP_URL =
  "http://localhost:5173";

function getDefaultProjectKey(
  dictionaryName: string,
  legacyName: string,
) {
  const dictionary =
    Deno.env.get(dictionaryName);

  if (dictionary) {
    try {
      const parsed =
        JSON.parse(dictionary);

      if (
        typeof parsed?.default ===
          "string" &&
        parsed.default.length > 0
      ) {
        return parsed.default;
      }
    } catch {
      // Fall back to the legacy environment variable below.
    }
  }

  return (
    Deno.env.get(legacyName) ?? ""
  );
}

async function hmacState(
  state: string,
  secret: string,
) {
  const encoder = new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(state),
    );

  return Array.from(
    new Uint8Array(signature),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

function appRedirect(
  status:
    | "connected"
    | "error",
  reason?: string,
) {
  const base =
    Deno.env.get(
      "ALF_SAHTEN_APP_URL",
    ) || DEFAULT_APP_URL;

 const url = new URL(
  "/cook/recipes/import-instagram",
  base,
);

  url.searchParams.set(
    "instagram",
    status,
  );

  if (reason) {
    url.searchParams.set(
      "reason",
      reason,
    );
  }

  return Response.redirect(
    url.toString(),
    302,
  );
}

async function safeJson(
  response: Response,
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(
      "Method not allowed",
      {
        status: 405,
      },
    );
  }

  try {
    const url =
      new URL(req.url);

    const code =
      url.searchParams.get("code");

    const state =
      url.searchParams.get("state");

    const oauthError =
      url.searchParams.get("error");

    if (oauthError) {
      return appRedirect(
        "error",
        "instagram_authorization_denied",
      );
    }

    if (!code || !state) {
      return appRedirect(
        "error",
        "missing_code_or_state",
      );
    }

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL",
      ) ?? "";

    const secretKey =
      getDefaultProjectKey(
        "SUPABASE_SECRET_KEYS",
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    const instagramAppId =
      Deno.env.get(
        "INSTAGRAM_APP_ID",
      ) ?? "";

    const instagramAppSecret =
      Deno.env.get(
        "INSTAGRAM_APP_SECRET",
      ) ?? "";

    const oauthStateSecret =
      Deno.env.get(
        "INSTAGRAM_OAUTH_STATE_SECRET",
      ) ?? "";

    if (
      !supabaseUrl ||
      !secretKey ||
      !instagramAppId ||
      !instagramAppSecret ||
      !oauthStateSecret
    ) {
      console.error(
        "Instagram OAuth callback is missing required configuration",
      );

      return appRedirect(
        "error",
        "server_configuration",
      );
    }

    const admin =
      createClient(
        supabaseUrl,
        secretKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

    const stateHash =
      await hmacState(
        state,
        oauthStateSecret,
      );

    const now =
      new Date().toISOString();

    const {
      data: stateRow,
      error: stateError,
    } = await admin
      .from(
        "instagram_oauth_states",
      )
      .update({
        used_at: now,
      })
      .eq(
        "state_hash",
        stateHash,
      )
      .is("used_at", null)
      .gt("expires_at", now)
      .select("user_id")
      .maybeSingle();

    if (stateError) {
      console.error(
        "Could not validate Instagram OAuth state",
        stateError,
      );

      return appRedirect(
        "error",
        "state_validation_failed",
      );
    }

    if (!stateRow?.user_id) {
      return appRedirect(
        "error",
        "invalid_or_expired_state",
      );
    }

    const tokenForm =
      new FormData();

    tokenForm.set(
      "client_id",
      instagramAppId,
    );

    tokenForm.set(
      "client_secret",
      instagramAppSecret,
    );

    tokenForm.set(
      "grant_type",
      "authorization_code",
    );

    tokenForm.set(
      "redirect_uri",
      CALLBACK_URL,
    );

    tokenForm.set(
      "code",
      code,
    );

    const shortTokenResponse =
      await fetch(
        "https://api.instagram.com/oauth/access_token",
        {
          method: "POST",
          body: tokenForm,
          headers: {
            Accept:
              "application/json",
          },
        },
      );

    const shortTokenPayload =
      await safeJson(
        shortTokenResponse,
      );

    if (!shortTokenResponse.ok) {
      console.error(
        "Instagram short-lived token exchange failed",
        shortTokenResponse.status,
      );

      return appRedirect(
        "error",
        "token_exchange_failed",
      );
    }

    const wrappedToken =
      Array.isArray(
        shortTokenPayload?.data,
      )
        ? shortTokenPayload.data[0]
        : null;

    const shortAccessToken =
      shortTokenPayload
        ?.access_token ??
      wrappedToken
        ?.access_token;

    if (!shortAccessToken) {
      console.error(
        "Instagram token response did not contain an access token",
      );

      return appRedirect(
        "error",
        "token_missing",
      );
    }

    const longTokenUrl =
      new URL(
        "https://graph.instagram.com/access_token",
      );

    longTokenUrl.searchParams.set(
      "grant_type",
      "ig_exchange_token",
    );

    longTokenUrl.searchParams.set(
      "client_secret",
      instagramAppSecret,
    );

    longTokenUrl.searchParams.set(
      "access_token",
      shortAccessToken,
    );

    const longTokenResponse =
      await fetch(
        longTokenUrl,
        {
          headers: {
            Accept:
              "application/json",
          },
        },
      );

    const longTokenPayload =
      await safeJson(
        longTokenResponse,
      );

    if (
      !longTokenResponse.ok ||
      !longTokenPayload
        ?.access_token
    ) {
      console.error(
        "Instagram long-lived token exchange failed",
        longTokenResponse.status,
      );

      return appRedirect(
        "error",
        "long_lived_token_failed",
      );
    }

    const longAccessToken =
      longTokenPayload
        .access_token as string;

    const expiresInSeconds =
      Number(
        longTokenPayload
          .expires_in ?? 0,
      );

    const tokenExpiresAt =
      expiresInSeconds > 0
        ? new Date(
            Date.now() +
              expiresInSeconds *
                1000,
          ).toISOString()
        : null;

    const profileResponse =
      await fetch(
        "https://graph.instagram.com/me?fields=id,username",
        {
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${longAccessToken}`,
          },
        },
      );

    const profilePayload =
      await safeJson(
        profileResponse,
      );

    if (
      !profileResponse.ok ||
      !profilePayload?.id
    ) {
      console.error(
        "Instagram profile lookup failed",
        profileResponse.status,
      );

      return appRedirect(
        "error",
        "profile_lookup_failed",
      );
    }

    const savedAt =
      new Date().toISOString();

    const {
      error: saveError,
    } = await admin
      .from(
        "instagram_connections",
      )
      .upsert(
        {
          user_id:
            stateRow.user_id,
          instagram_user_id:
            String(
              profilePayload.id,
            ),
          instagram_username:
            typeof profilePayload
                .username ===
              "string"
              ? profilePayload
                  .username
              : null,
          access_token:
            longAccessToken,
          token_expires_at:
            tokenExpiresAt,
          scopes: [
            "instagram_business_basic",
          ],
          connected_at:
            savedAt,
          updated_at:
            savedAt,
        },
        {
          onConflict:
            "user_id",
        },
      );

    if (saveError) {
      console.error(
        "Could not save Instagram connection",
        saveError,
      );

      return appRedirect(
        "error",
        "connection_save_failed",
      );
    }

    return appRedirect(
      "connected",
    );
  } catch (error) {
    console.error(
      "Unexpected Instagram OAuth callback error",
      error,
    );

    return appRedirect(
      "error",
      "unexpected_error",
    );
  }
});