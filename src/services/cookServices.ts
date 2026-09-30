import { supabase } from "../lib/supabase";

export const serviceTypes = {
  homemade_food: "Homemade food",
  catering: "Catering",
  cakes_desserts: "Cakes & desserts",
  meal_prep: "Meal prep",
  private_cooking: "Private cooking",
  cooking_classes: "Cooking classes",
  digital_recipe_books: "Digital recipe books",
  meal_plans: "Meal plans",
  other: "Other",
} as const;

export type ServiceType = keyof typeof serviceTypes;
export type ServiceStatus = "draft" | "available" | "paused" | "archived";
export type CookPlan = "free" | "pro";

export type CookServiceInput = {
  service_type: ServiceType;
  title: string;
  description: string;
  starting_price: number | null;
  currency: string | null;
  photo_url: string | null;
  status: ServiceStatus;
  availability_note: string;
};

export type CookService = CookServiceInput & {
  id: string;
  cook_id: string;
  created_at: string;
  updated_at: string;
};

export function prepareCookService(input: CookServiceInput): CookServiceInput {
  const title = input.title.trim();
  const description = input.description.trim();
  const availability_note = input.availability_note.trim();
  const currency = input.currency?.trim().toUpperCase() || null;
  const photo_url = input.photo_url?.trim() || null;
  if (!Object.hasOwn(serviceTypes, input.service_type)) throw new Error("Choose a valid service type.");
  if (!["draft", "available", "paused", "archived"].includes(input.status)) throw new Error("Choose a valid availability status.");
  if (!title || title.length > 100) throw new Error("Enter a service title of up to 100 characters.");
  if (description.length > 1000) throw new Error("Keep the description under 1,001 characters.");
  if (availability_note.length > 250) throw new Error("Keep the availability note under 251 characters.");
  if (input.starting_price !== null) {
    if (!Number.isFinite(input.starting_price) || input.starting_price < 0 || input.starting_price > 9999999999.99) {
      throw new Error("Enter a valid, non-negative starting price.");
    }
    if (!currency || !/^[A-Z]{3}$/.test(currency)) throw new Error("Choose a currency for the starting price.");
  } else if (currency) {
    throw new Error("Enter a starting price or clear the currency.");
  }
  if (photo_url) {
    let valid = false;
    try { valid = new URL(photo_url).protocol === "https:"; } catch { /* Handled below. */ }
    if (!valid || photo_url.length > 2048 || /\s/.test(photo_url)) throw new Error("Use a valid HTTPS photo URL.");
  }
  // Explicit fields prevent callers from changing ownership or system fields.
  return {
    service_type: input.service_type, title, description,
    starting_price: input.starting_price, currency, photo_url,
    status: input.status, availability_note,
  };
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in to manage your services.");
  return data.user.id;
}

export async function getPublicCookServices(
  cookId: string,
) {
  const { data, error } = await supabase
    .from("cook_services")
    .select("*")
    .eq("cook_id", cookId)
    .eq("status", "available")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as CookService[];
}

export async function getPublicCookService(
  serviceId: string,
) {
  const { data, error } = await supabase
    .from("cook_services")
    .select("*")
    .eq("id", serviceId)
    .eq("status", "available")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CookService | null;
}

export async function getMyCookServices(): Promise<CookService[]> {
  const cookId = await currentUserId();
  const { data, error } = await supabase.from("cook_services").select("*")
    .eq("cook_id", cookId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CookService[];
}

export async function createCookService(input: CookServiceInput): Promise<CookService> {
  const values = prepareCookService(input);
  const cookId = await currentUserId();
  const { data, error } = await supabase.from("cook_services")
    .insert({ ...values, cook_id: cookId }).select().single();
  if (error) throw error;
  return data as CookService;
}

export async function updateCookService(id: string, input: CookServiceInput): Promise<CookService> {
  const values = prepareCookService(input);
  const cookId = await currentUserId();
  const { data, error } = await supabase.from("cook_services").update(values)
    .eq("id", id).eq("cook_id", cookId).select().single();
  if (error) throw error;
  return data as CookService;
}

export async function archiveCookService(id: string): Promise<CookService> {
  const cookId = await currentUserId();
  const { data, error } = await supabase.from("cook_services").update({ status: "archived" })
    .eq("id", id).eq("cook_id", cookId).select().single();
  if (error) throw error;
  return data as CookService;
}

export async function getMyCookPlan(): Promise<CookPlan> {
  const cookId = await currentUserId();
  const { data, error } = await supabase.from("cook_profiles").select("plan_tier")
    .eq("user_id", cookId).single();
  if (error) throw error;
  return data.plan_tier as CookPlan;
}
