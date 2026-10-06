import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

function serverKey() {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (typeof keys.default === "string") return keys.default;
  } catch { /* Use the platform-provided legacy key when needed. */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

// These four counts are intentionally public; individual follows/saves stay private.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "methodNotAllowed" }, 405);
  try {
    const body = await req.text();
    if (body.length > 256) return json({ error: "invalidCook" }, 400);
    let cookId: unknown;
    try { cookId = JSON.parse(body)?.cookId; } catch { return json({ error: "invalidCook" }, 400); }
    if (typeof cookId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(cookId)) {
      return json({ error: "invalidCook" }, 400);
    }
    const client = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("get_cook_public_statistics", { p_cook_id: cookId });
    if (error) {
      console.warn("cook-statistics RPC failure", error.code ?? "unknown");
      return json({ error: "statsUnavailable" }, 503);
    }
    if (!data) return json({ error: "cookNotFound" }, 404);
    return json({ statistics: data });
  } catch (error) {
    console.warn("cook-statistics failure", error instanceof Error ? error.name : "unknown");
    return json({ error: "statsUnavailable" }, 503);
  }
});
