import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { isSearchQuery, normalizeFood } from "./foods.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });
const cache = new Map<string, { expires: number; foods: ReturnType<typeof normalizeFood>[] }>();
// Best-effort per-instance limits; USDA's own limit remains authoritative.
const requests = new Map<string, { start: number; count: number }>();

class LookupError extends Error {
  constructor(public code: string) { super(code); }
}

function publicKey() {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    if (typeof keys.default === "string") return keys.default;
  } catch { /* Fall back to the platform-provided anon key. */ }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ code: "methodNotAllowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!/^Bearer \S+$/.test(authorization)) return json({ code: "signInRequired" }, 401);
  try {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, publicKey(), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user || user.is_anonymous) return json({ code: "signInRequired" }, 401);
    const body = await req.text();
    if (body.length > 2048) return json({ code: "invalidQuery" }, 400);
    let payload: { query?: unknown };
    try { payload = JSON.parse(body); } catch { return json({ code: "invalidQuery" }, 400); }
    if (!payload || !isSearchQuery(payload.query)) return json({ code: "invalidQuery" }, 400);
    const apiKey = Deno.env.get("USDA_FDC_API_KEY")?.trim();
    if (!apiKey) return json({ code: "notConfigured" }, 503);
    const query = payload.query.trim();
    const cacheKey = query.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return json({ foods: cached.foods });
    const now = Date.now();
    for (const [id, value] of requests) if (now - value.start >= 3600000) requests.delete(id);
    const budget = requests.get(user.id) ?? { start: now, count: 0 };
    if (budget.count >= 60 || (!requests.has(user.id) && requests.size >= 1000)) {
      return json({ code: "rateLimited" }, 429);
    }
    budget.count++;
    requests.set(user.id, budget);

    async function usda(path: string, payload: unknown) {
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/${path}?api_key=${encodeURIComponent(apiKey!)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        // Status and endpoint name are safe to log; URLs and bodies can contain secrets.
        console.warn("nutrition-foods upstream", path, response.status);
        throw new LookupError(response.status === 429 ? "rateLimited" :
          response.status === 401 || response.status === 403 ? "invalidApiKey" : "providerUnavailable");
      }
      return response.json();
    }
    // Generic foods provide preparation-specific data and useful household portions.
    const search = await usda("foods/search", {
      query, pageSize: 5, dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
    });
    const ids = (search.foods ?? []).map((food: { fdcId: number }) => food.fdcId);
    const details = ids.length ? await usda("foods", { fdcIds: ids, format: "full" }) : [];
    const foods = details.map(normalizeFood).filter((food: ReturnType<typeof normalizeFood>) =>
      Object.keys(food.nutrients).length > 0).sort((a: ReturnType<typeof normalizeFood>, b: ReturnType<typeof normalizeFood>) =>
      ids.indexOf(a.id) - ids.indexOf(b.id));
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { expires: Date.now() + 86400000, foods });
    return json({ foods });
  } catch (error) {
    const code = error instanceof LookupError ? error.code :
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "providerTimeout" : "lookupFailed";
    // Do not log exception messages or stacks: upstream URLs contain the USDA key.
    console.warn("nutrition-foods failure", code, error instanceof Error ? error.name : "unknown");
    return json({ code }, code === "rateLimited" ? 429 : 502);
  }
});
