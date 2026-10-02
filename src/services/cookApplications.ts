import { supabase } from "../lib/supabase";

export type CookApplicationStatus =
  | "pending"
  | "approved"
  | "declined";

export type AdminCookApplication = {
  user_id: string;

  display_name: string;
  bio: string | null;
  social_link: string | null;
  reason: string | null;

status: CookApplicationStatus;
admin_note: string | null;

cook: {
    display_name: string | null;
    username: string | null;
    bio: string | null;
    location: string | null;
    cook_type: string | null;
    specialties: string[] | null;
    instagram_url: string | null;
    website_url: string | null;
    whatsapp_contact: string | null;
    profile_image_url: string | null;
    is_approved: boolean;
  } | null;
};

export async function getCookApplications(
  status: CookApplicationStatus,
) {
  const {
    data: applications,
    error: applicationsError,
  } = await supabase
    .from("creator_applications")
    .select(
      `
        user_id,
        display_name,
        bio,
        social_link,
        reason,
        status,
        admin_note
      `,
    )
    .eq("status", status);

  if (applicationsError) {
    console.error(
      "Error loading Cook applications:",
      applicationsError,
    );

    throw applicationsError;
  }

  if (!applications?.length) {
    return [];
  }

  const userIds = [
    ...new Set(
      applications.map(
        (application) =>
          application.user_id,
      ),
    ),
  ];

  const {
    data: cooks,
    error: cooksError,
  } = await supabase
    .from("cook_profiles")
    .select(
      `
        user_id,
        display_name,
        username,
        bio,
        location,
        cook_type,
        specialties,
        instagram_url,
        website_url,
        whatsapp_contact,
        profile_image_url,
        is_approved
      `,
    )
    .in("user_id", userIds);

  if (cooksError) {
    console.error(
      "Error loading Cook profiles:",
      cooksError,
    );

    throw cooksError;
  }

  return applications.map(
    (application) => ({
      ...application,

      cook:
        cooks?.find(
          (cook) =>
            cook.user_id ===
            application.user_id,
        ) ?? null,
    }),
  ) as AdminCookApplication[];
}

export async function moderateCookApplication(
  userId: string,
  status: "approved" | "declined",
  adminNote: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to moderate Cook applications.",
    );
  }

  const { error } = await supabase.rpc(
    "moderate_creator_application",
    {
      target_user_id: userId,
      new_status: status,
      admin_note_text:
        adminNote.trim() || null,
    },
  );

  if (error) {
    console.error(
      "Error moderating Cook application:",
      error,
    );

    throw error;
  }
}