import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  const dictionary = Deno.env.get(dictionaryName);

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

function normalizeCursor(value: unknown) {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    const authorization =
      req.headers.get("Authorization");

    if (
      !authorization?.startsWith("Bearer ")
    ) {
      return jsonResponse(
        { error: "Authentication required" },
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

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey
    ) {
      console.error(
        "Instagram media function is missing Supabase configuration",
      );

      return jsonResponse(
        {
          error:
            "Instagram import is not configured",
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
            Authorization: authorization,
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
    } = await userClient.auth.getUser();

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
            "Only approved Cooks can import from Instagram",
        },
        403,
      );
    }

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from("instagram_connections")
      .select(
        "instagram_user_id, instagram_username, access_token, token_expires_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Could not load Instagram connection",
        connectionError,
      );

      return jsonResponse(
        {
          error:
            "Could not load Instagram connection",
        },
        500,
      );
    }

    if (!connection?.access_token) {
      return jsonResponse({
        connected: false,
        media: [],
      });
    }

    if (
      connection.token_expires_at &&
      new Date(
        connection.token_expires_at,
      ).getTime() <= Date.now()
    ) {
      return jsonResponse({
        connected: false,
        expired: true,
        instagramUsername:
          connection.instagram_username ?? null,
        media: [],
      });
    }

    let after: string | null = null;

    try {
      const body = await req.json();
      after = normalizeCursor(body?.after);
    } catch {
      // Body is optional for the first page.
    }

    const mediaUrl = new URL(
      "https://graph.instagram.com/me/media",
    );

    mediaUrl.searchParams.set(
      "fields",
      [
        "id",
        "caption",
        "media_type",
        "media_product_type",
        "media_url",
        "thumbnail_url",
        "permalink",
        "timestamp",
      ].join(","),
    );

    mediaUrl.searchParams.set(
      "limit",
      "12",
    );

    if (after) {
      mediaUrl.searchParams.set(
        "after",
        after,
      );
    }

    const instagramResponse =
      await fetch(mediaUrl, {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${connection.access_token}`,
        },
      });

    const payload =
      await instagramResponse
        .json()
        .catch(() => null);

    if (!instagramResponse.ok) {
      console.error(
        "Instagram media request failed",
        instagramResponse.status,
        payload?.error?.type ??
          "unknown",
      );

      return jsonResponse(
        {
          error:
            "Could not load Instagram posts",
          reconnectRequired:
            instagramResponse.status === 400 ||
            instagramResponse.status === 401,
        },
        502,
      );
    }

    const media =
      Array.isArray(payload?.data)
        ? payload.data.map(
            (
              item: Record<
                string,
                unknown
              >,
            ) => ({
              id:
                typeof item.id ===
                "string"
                  ? item.id
                  : "",
              caption:
                typeof item.caption ===
                "string"
                  ? item.caption
                  : "",
              mediaType:
                typeof item.media_type ===
                "string"
                  ? item.media_type
                  : null,
              mediaProductType:
                typeof item.media_product_type ===
                "string"
                  ? item.media_product_type
                  : null,
              mediaUrl:
                typeof item.media_url ===
                "string"
                  ? item.media_url
                  : null,
              thumbnailUrl:
                typeof item.thumbnail_url ===
                "string"
                  ? item.thumbnail_url
                  : null,
              permalink:
                typeof item.permalink ===
                "string"
                  ? item.permalink
                  : null,
              timestamp:
                typeof item.timestamp ===
                "string"
                  ? item.timestamp
                  : null,
            }),
          )
        : [];

    return jsonResponse({
      connected: true,
      instagramUsername:
        connection.instagram_username ?? null,
      media,
      nextCursor:
        typeof payload?.paging
            ?.cursors?.after === "string"
          ? payload.paging.cursors.after
          : null,
      hasNextPage:
        Boolean(payload?.paging?.next),
    });
  } catch (error) {
    console.error(
      "Unexpected Instagram media error",
      error,
    );

    return jsonResponse(
      {
        error:
          "Could not load Instagram posts",
      },
      500,
    );
  }
});