import { supabase } from "../lib/supabase";
import type { PublicCookProfile } from "./cooks";

export type CookStatistics = { follower_count: number; following_count: number; recipe_count: number; total_saves: number };

export async function getCookStatistics(cookId: string): Promise<CookStatistics> {
  const { data, error } = await supabase.functions.invoke("cook-statistics", { body: { cookId } });
  if (error || !data?.statistics) throw new Error("statsUnavailable");
  const statistics = data.statistics as Record<string, unknown>;
  const keys = ["follower_count", "following_count", "recipe_count", "total_saves"] as const;
  if (keys.some(key => typeof statistics[key] !== "number" || !Number.isSafeInteger(statistics[key]) || (statistics[key] as number) < 0)) {
    throw new Error("statsUnavailable");
  }
  return statistics as CookStatistics;
}

export async function getOwnFollowing(userId: string, offset: number) {
  const { data, error, count } = await supabase.from("cook_follows")
    .select("cook_id, created_at", { count: "exact" }).eq("follower_id", userId)
    .order("created_at", { ascending: false }).order("cook_id").range(offset, offset + 19);
  if (error) throw error;
  const follows = data ?? [];
  if (follows.length === 0) return { cooks: [], count: count ?? 0, nextOffset: offset, hasMore: false };
  const { data: cooks, error: cooksError } = await supabase.from("public_cook_profiles")
    .select("user_id, display_name, username, profile_image_url").eq("is_approved", true).in("user_id", follows.map(row => row.cook_id));
  if (cooksError) throw cooksError;
  const nextOffset = offset + follows.length;
  return {
    cooks: follows.flatMap(row => (cooks ?? []).filter(cook => cook.user_id === row.cook_id)) as Pick<PublicCookProfile, "user_id" | "display_name" | "username" | "profile_image_url">[],
    count: count ?? 0, nextOffset, hasMore: nextOffset < (count ?? 0),
  };
}
