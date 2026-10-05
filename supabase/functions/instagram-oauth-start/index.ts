import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const INSTAGRAM_CALLBACK_URL =
  "https://ixsdehujvfncqsxqhsfb.supabase.co/functions/v1/instagram-oauth-callback";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getDefaultProjectKey(
  dictionaryName: string,
  legacyName: string,
) {
  const dictionary =
    Deno.env.get(dictionaryName);

  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary);

      if (
        typeof parsed?.default === "string" &&
        parsed.default.length > 0
      ) {
        return parsed.default;
      }
    } catch {
      // Fall back to the legacy environment variable below.
    }
  }

  return Deno.env.get(legacyName) ?? "";
}

function bytesToBase64Url(
  bytes: Uint8Array,
) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    const authorization =
      req.headers.get("Authorization");

    if (
      !authorization?.startsWith(
        "Bearer ",
      )
    ) {
      return jsonResponse(
        {
          error:
            "Authentication required",
        },
        401,
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ?? "";

    const publishableKey =
      getDefaultProjectKey(
        "SUPABASE_PUBLISHABLE_KEYS",
        "SUPABASE_ANON_KEY",
      );

    const secretKey =
      getDefaultProjectKey(
        "SUPABASE_SECRET_KEYS",
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    const instagramAppId =
      Deno.env.get(
        "INSTAGRAM_APP_ID",
      ) ?? "";

    const oauthStateSecret =
      Deno.env.get(
        "INSTAGRAM_OAUTH_STATE_SECRET",
      ) ?? "";

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey ||
      !instagramAppId ||
      !oauthStateSecret
    ) {
      console.error(
        "Instagram OAuth start is missing required configuration",
      );

      return jsonResponse(
        {
          error:
            "Instagram connection is not configured",
        },
        500,
      );
    }

    const userClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        global: {
          headers: {
            Authorization:
              authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } =
      await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error:
            "Invalid or expired session",
        },
        401,
      );
    }

    const admin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: cookProfile,
      error: cookError,
    } = await admin
      .from("cook_profiles")
      .select("is_approved")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cookError) {
      console.error(
        "Could not check Cook approval",
        cookError,
      );

      return jsonResponse(
        {
          error:
            "Could not verify Cook access",
        },
        500,
      );
    }

    if (!cookProfile?.is_approved) {
      return jsonResponse(
        {
          error:
            "Only approved Cooks can connect Instagram",
        },
        403,
      );
    }

    const stateBytes =
      new Uint8Array(32);

    crypto.getRandomValues(
      stateBytes,
    );

    const state =
      bytesToBase64Url(
        stateBytes,
      );

    const stateHash =
      await hmacState(
        state,
        oauthStateSecret,
      );

    const now = new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          10 * 60 * 1000,
      );

    await admin
      .from(
        "instagram_oauth_states",
      )
      .delete()
      .eq("user_id", user.id)
      .lt(
        "expires_at",
        now.toISOString(),
      );

    const {
      error: stateError,
    } = await admin
      .from(
        "instagram_oauth_states",
      )
      .insert({
        state_hash: stateHash,
        user_id: user.id,
        expires_at:
          expiresAt.toISOString(),
      });

    if (stateError) {
      console.error(
        "Could not create Instagram OAuth state",
        stateError,
      );

      return jsonResponse(
        {
          error:
            "Could not start Instagram connection",
        },
        500,
      );
    }

    const authorizeUrl =
      new URL(
        "https://www.instagram.com/oauth/authorize",
      );

    authorizeUrl.searchParams.set(
      "force_reauth",
      "true",
    );

    authorizeUrl.searchParams.set(
      "client_id",
      instagramAppId,
    );

    authorizeUrl.searchParams.set(
      "redirect_uri",
      INSTAGRAM_CALLBACK_URL,
    );

    authorizeUrl.searchParams.set(
      "response_type",
      "code",
    );

    authorizeUrl.searchParams.set(
      "scope",
      "instagram_business_basic",
    );

    authorizeUrl.searchParams.set(
      "state",
      state,
    );

    return jsonResponse({
      url: authorizeUrl.toString(),
    });
  } catch (error) {
    console.error(
      "Unexpected Instagram OAuth start error",
      error,
    );

    return jsonResponse(
      {
        error:
          "Could not start Instagram connection",
      },
      500,
    );
  }
});