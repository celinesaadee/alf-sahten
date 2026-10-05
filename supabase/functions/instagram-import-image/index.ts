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
      // Fall through to the legacy variable.
    }
  }

  return Deno.env.get(legacyName) ?? "";
}

function extensionFromContentType(
  contentType: string | null,
) {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";

  return "jpg";
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

    const body =
      await req.json().catch(() => null);

    const mediaId =
      typeof body?.mediaId === "string"
        ? body.mediaId.trim()
        : "";

    if (!mediaId) {
      return jsonResponse(
        {
          error:
            "Instagram media ID is required",
        },
        400,
      );
    }

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from("instagram_connections")
      .select(
        "access_token, token_expires_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      connectionError ||
      !connection?.access_token
    ) {
      return jsonResponse(
        {
          error:
            "Instagram is not connected",
        },
        400,
      );
    }

    if (
      connection.token_expires_at &&
      new Date(
        connection.token_expires_at,
      ).getTime() <= Date.now()
    ) {
      return jsonResponse(
        {
          error:
            "Instagram connection expired",
        },
        401,
      );
    }

    const mediaInfoUrl =
      new URL(
        `https://graph.instagram.com/${mediaId}`,
      );

    mediaInfoUrl.searchParams.set(
      "fields",
      "id,media_type,media_url,thumbnail_url",
    );

    const mediaInfoResponse =
      await fetch(mediaInfoUrl, {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${connection.access_token}`,
        },
      });

    const mediaInfo =
      await mediaInfoResponse
        .json()
        .catch(() => null);

    if (!mediaInfoResponse.ok) {
      console.error(
        "Instagram media details request failed",
        mediaInfoResponse.status,
        mediaInfo?.error?.type ??
          "unknown",
      );

      return jsonResponse(
        {
          error:
            "Could not load Instagram image",
        },
        502,
      );
    }

    const sourceUrl =
      typeof mediaInfo?.thumbnail_url ===
        "string" &&
      mediaInfo.thumbnail_url
        ? mediaInfo.thumbnail_url
        : typeof mediaInfo?.media_url ===
              "string" &&
            mediaInfo.media_url
          ? mediaInfo.media_url
          : null;

    if (!sourceUrl) {
      return jsonResponse(
        {
          error:
            "Instagram media has no image",
        },
        422,
      );
    }

    const imageResponse =
      await fetch(sourceUrl);

    if (!imageResponse.ok) {
      return jsonResponse(
        {
          error:
            "Could not download Instagram image",
        },
        502,
      );
    }

    const contentType =
      imageResponse.headers.get(
        "content-type",
      );

    if (
      !contentType?.startsWith(
        "image/",
      )
    ) {
      return jsonResponse(
        {
          error:
            "Instagram media is not an image",
        },
        422,
      );
    }

    const imageBytes =
      await imageResponse.arrayBuffer();

    const extension =
      extensionFromContentType(
        contentType,
      );

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const filePath =
      `${user.id}/${fileName}`;

    const {
      error: uploadError,
    } = await admin.storage
      .from("recipe-images")
      .upload(
        filePath,
        imageBytes,
        {
          contentType,
          cacheControl:
            "31536000",
          upsert: false,
        },
      );

    if (uploadError) {
      console.error(
        "Could not store Instagram image",
        uploadError,
      );

      return jsonResponse(
        {
          error:
            "Could not save Instagram image",
        },
        500,
      );
    }

    const {
      data: publicUrlData,
    } = admin.storage
      .from("recipe-images")
      .getPublicUrl(filePath);

    return jsonResponse({
      imageUrl:
        publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error(
      "Unexpected Instagram image import error",
      error,
    );

    return jsonResponse(
      {
        error:
          "Could not import Instagram image",
      },
      500,
    );
  }
});