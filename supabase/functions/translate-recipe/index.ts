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

type Language = "en" | "fr" | "ar";

type Ingredient = {
  quantity?: unknown;
  unit?: unknown;
  ingredient?: unknown;
};

type Instruction = {
  step?: unknown;
  text?: unknown;
};

const sourceLanguageCodes: Record<Language, string> = {
  en: "EN",
  fr: "FR",
  ar: "AR",
};

const targetLanguageCodes: Record<Language, string> = {
  en: "EN-US",
  fr: "FR",
  ar: "AR",
};

async function translateTexts(
  apiKey: string,
  texts: string[],
  sourceLanguage: Language,
  targetLanguage: Language,
) {
  if (texts.length === 0) {
    return [];
  }

  const translated: string[] = [];
  const batchSize = 40;

  for (
    let index = 0;
    index < texts.length;
    index += batchSize
  ) {
    const batch =
      texts.slice(index, index + batchSize);

    const response = await fetch(
      "https://api-free.deepl.com/v2/translate",
      {
        method: "POST",
        headers: {
          Authorization:
            `DeepL-Auth-Key ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          text: batch,
          source_lang:
            sourceLanguageCodes[
              sourceLanguage
            ],
          target_lang:
            targetLanguageCodes[
              targetLanguage
            ],
          preserve_formatting: true,
        }),
      },
    );

    const payload =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      console.error(
        "DeepL translation failed",
        response.status,
        payload?.message ??
          "unknown error",
      );

      throw new Error(
        "Translation service failed",
      );
    }

    const batchTranslations =
      Array.isArray(
        payload?.translations,
      )
        ? payload.translations.map(
            (
              item: Record<
                string,
                unknown
              >,
            ) =>
              typeof item.text ===
              "string"
                ? item.text
                : "",
          )
        : [];

    if (
      batchTranslations.length !==
      batch.length
    ) {
      throw new Error(
        "Translation service returned an unexpected result",
      );
    }

    translated.push(
      ...batchTranslations,
    );
  }

  return translated;
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

    const deeplApiKey =
      Deno.env.get(
        "DEEPL_API_KEY",
      ) ?? "";

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey ||
      !deeplApiKey
    ) {
      const missing = [
        !supabaseUrl
          ? "SUPABASE_URL"
          : null,
        !publishableKey
          ? "Supabase publishable key"
          : null,
        !secretKey
          ? "Supabase secret key"
          : null,
        !deeplApiKey
          ? "DEEPL_API_KEY"
          : null,
      ].filter(Boolean);

      console.error(
        `Recipe translation function is missing configuration: ${missing.join(", ")}`,
      );

      return jsonResponse(
        {
          error:
            "Recipe translation is not configured",
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
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Could not verify translator access",
        profileError,
      );

      return jsonResponse(
        {
          error:
            "Could not verify access",
        },
        500,
      );
    }

    if (
      profile?.role !== "admin"
    ) {
      return jsonResponse(
        {
          error:
            "Admin access required",
        },
        403,
      );
    }

    let body: Record<
      string,
      unknown
    >;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          error:
            "Invalid request body",
        },
        400,
      );
    }

    const recipeId =
      typeof body.recipeId ===
        "string"
        ? body.recipeId.trim()
        : "";

    if (!recipeId) {
      return jsonResponse(
        {
          error:
            "Recipe ID is required",
        },
        400,
      );
    }

    const {
      data: recipe,
      error: recipeError,
    } = await admin
      .from("recipes")
      .select(
        "id, title, description, ingredients, instructions, original_language, status, updated_at",
      )
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeError) {
      console.error(
        "Could not load recipe for translation",
        recipeError,
      );

      return jsonResponse(
        {
          error:
            "Could not load recipe",
        },
        500,
      );
    }

    if (!recipe) {
      return jsonResponse(
        {
          error:
            "Recipe not found",
        },
        404,
      );
    }

    if (
      recipe.status !== "approved"
    ) {
      return jsonResponse(
        {
          error:
            "Only approved recipes can be translated",
        },
        409,
      );
    }

    const originalLanguage =
      recipe.original_language as Language;

    if (
      !(
        ["en", "fr", "ar"] as string[]
      ).includes(originalLanguage)
    ) {
      return jsonResponse(
        {
          error:
            "Unsupported recipe language",
        },
        400,
      );
    }

    const targetLanguages = (
      ["en", "fr", "ar"] as Language[]
    ).filter(
      (language) =>
        language !==
        originalLanguage,
    );

    const {
      data: existingTranslations,
      error: existingError,
    } = await admin
      .from("recipe_translations")
      .select(
        "language, source_updated_at",
      )
      .eq(
        "recipe_id",
        recipe.id,
      )
      .in(
        "language",
        targetLanguages,
      );

    if (existingError) {
      console.error(
        "Could not inspect existing translations",
        existingError,
      );

      return jsonResponse(
        {
          error:
            "Could not inspect translations",
        },
        500,
      );
    }

    const recipeUpdatedAt =
      recipe.updated_at ?? null;

    const currentLanguages =
      new Set(
        (
          existingTranslations ?? []
        )
          .filter(
            (row) =>
              row.source_updated_at &&
              recipeUpdatedAt &&
              new Date(
                row.source_updated_at,
              ).getTime() ===
                new Date(
                  recipeUpdatedAt,
                ).getTime(),
          )
          .map(
            (row) =>
              row.language,
          ),
      );

    const languagesToTranslate =
      targetLanguages.filter(
        (language) =>
          !currentLanguages.has(
            language,
          ),
      );

    if (
      languagesToTranslate.length ===
      0
    ) {
      return jsonResponse({
        translated: [],
        skipped: targetLanguages,
        alreadyCurrent: true,
      });
    }

    const sourceIngredients:
      Ingredient[] =
        Array.isArray(
          recipe.ingredients,
        )
          ? recipe.ingredients
          : [];

    const sourceInstructions:
      Instruction[] =
        Array.isArray(
          recipe.instructions,
        )
          ? recipe.instructions
          : [];

    const results: string[] = [];

    for (
      const targetLanguage of
      languagesToTranslate
    ) {
      const texts: string[] = [];

      const slots: Array<
        | { kind: "title" }
        | {
            kind:
              "description";
          }
        | {
            kind:
              "ingredient";
            index: number;
          }
        | {
            kind: "unit";
            index: number;
          }
        | {
            kind:
              "instruction";
            index: number;
          }
      > = [];

      const pushText = (
        value: unknown,
        slot:
          | { kind: "title" }
          | {
              kind:
                "description";
            }
          | {
              kind:
                "ingredient";
              index: number;
            }
          | {
              kind: "unit";
              index: number;
            }
          | {
              kind:
                "instruction";
              index: number;
            },
      ) => {
        if (
          typeof value ===
            "string" &&
          value.trim().length > 0
        ) {
          texts.push(value.trim());
          slots.push(slot);
        }
      };

      pushText(
        recipe.title,
        {
          kind: "title",
        },
      );

      pushText(
        recipe.description,
        {
          kind: "description",
        },
      );

      sourceIngredients.forEach(
        (
          ingredient,
          index,
        ) => {
          pushText(
            ingredient.ingredient,
            {
              kind:
                "ingredient",
              index,
            },
          );

          pushText(
            ingredient.unit,
            {
              kind: "unit",
              index,
            },
          );
        },
      );

      sourceInstructions.forEach(
        (
          instruction,
          index,
        ) => {
          const instructionText =
            typeof instruction ===
            "string"
              ? instruction
              : instruction?.text;

          pushText(
            instructionText,
            {
              kind:
                "instruction",
              index,
            },
          );
        },
      );

      const translatedTexts =
        await translateTexts(
          deeplApiKey,
          texts,
          originalLanguage,
          targetLanguage,
        );

      let translatedTitle =
        typeof recipe.title ===
        "string"
          ? recipe.title
          : "";

      let translatedDescription =
        typeof recipe.description ===
        "string"
          ? recipe.description
          : "";

      const translatedIngredients =
        sourceIngredients.map(
          (ingredient) => ({
            quantity:
              typeof ingredient.quantity ===
              "string"
                ? ingredient.quantity
                : "",
            unit:
              typeof ingredient.unit ===
              "string"
                ? ingredient.unit
                : "",
            ingredient:
              typeof ingredient.ingredient ===
              "string"
                ? ingredient.ingredient
                : "",
          }),
        );

      const translatedInstructions =
        sourceInstructions.map(
          (
            instruction,
            index,
          ) => ({
            step:
              typeof instruction ===
                "object" &&
              instruction !== null &&
              typeof instruction.step ===
                "number"
                ? instruction.step
                : index + 1,

            text:
              typeof instruction ===
              "string"
                ? instruction
                : typeof instruction?.text ===
                    "string"
                  ? instruction.text
                  : "",
          }),
        );

      slots.forEach(
        (slot, index) => {
          const translatedText =
            translatedTexts[index] ??
            "";

          if (
            slot.kind === "title"
          ) {
            translatedTitle =
              translatedText;
          } else if (
            slot.kind ===
            "description"
          ) {
            translatedDescription =
              translatedText;
          } else if (
            slot.kind ===
            "ingredient"
          ) {
            translatedIngredients[
              slot.index
            ].ingredient =
              translatedText;
          } else if (
            slot.kind === "unit"
          ) {
            translatedIngredients[
              slot.index
            ].unit =
              translatedText;
          } else if (
            slot.kind ===
            "instruction"
          ) {
            translatedInstructions[
              slot.index
            ].text =
              translatedText;
          }
        },
      );

      const {
        error: upsertError,
      } = await admin
        .from(
          "recipe_translations",
        )
        .upsert(
          {
            recipe_id:
              recipe.id,
            review_status: "pending",
            language:
              targetLanguage,
            title:
              translatedTitle,
            description:
              translatedDescription,
            ingredients:
              translatedIngredients,
            instructions:
              translatedInstructions,
            source_updated_at:
              recipeUpdatedAt,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "recipe_id,language",
          },
        );

      if (upsertError) {
        console.error(
          "Could not save recipe translation",
          upsertError,
        );

        return jsonResponse(
          {
            error:
              "Could not save recipe translation",
          },
          500,
        );
      }

      results.push(
        targetLanguage,
      );
    }

    return jsonResponse({
      translated: results,
      skipped:
        targetLanguages.filter(
          (language) =>
            !results.includes(
              language,
            ),
        ),
    });
  } catch (error) {
    console.error(
      "Unexpected recipe translation error",
      error,
    );

    return jsonResponse(
      {
        error:
          "Could not translate recipe",
      },
      500,
    );
  }
});
