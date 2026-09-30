import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ChefHat,
  Clock3,
  Globe2,
  AtSign,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type CookType =
  | "home_cook"
  | "food_creator"
  | "professional_chef";

type CookProfile = {
  display_name: string;
  username: string | null;
  bio: string;
  location: string | null;
  cook_type: CookType;
  specialties: string[];
  instagram_url: string | null;
  website_url: string | null;
  whatsapp_contact: string | null;
  is_approved: boolean;
  follower_count: number;
  recipe_count: number;
};

type CreatorApplication = {
  reason: string;
  status:
    | "pending"
    | "approved"
    | "declined"
    | "changes_requested";
  admin_note: string | null;
};

function CreatorApplicationPage() {
  const { user, loading: authLoading } =
    useAuth();

  const [cookProfile, setCookProfile] =
    useState<CookProfile | null>(null);

  const [application, setApplication] =
    useState<CreatorApplication | null>(
      null,
    );

  const [displayName, setDisplayName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [cookType, setCookType] =
    useState<CookType>("home_cook");

  const [specialties, setSpecialties] =
    useState("");

  const [instagram, setInstagram] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadCookProfile() {
      if (authLoading) {
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const [
        profileResult,
        applicationResult,
      ] = await Promise.all([
        supabase
          .from("cook_profiles")
          .select(
            `
              display_name,
              username,
              bio,
              location,
              cook_type,
              specialties,
              instagram_url,
              website_url,
              whatsapp_contact,
              is_approved,
              follower_count,
              recipe_count
            `,
          )
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("creator_applications")
          .select(
            "reason, status, admin_note",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        console.error(
          "Could not load Cook profile:",
          profileResult.error,
        );
      }

      if (applicationResult.error) {
        console.error(
          "Could not load Cook application:",
          applicationResult.error,
        );
      }

      const profile =
        profileResult.data as CookProfile | null;

      if (profile) {
        setCookProfile(profile);

        setDisplayName(
          profile.display_name,
        );

        setUsername(
          profile.username ?? "",
        );

        setBio(profile.bio ?? "");

        setLocation(
          profile.location ?? "",
        );

        setCookType(
          profile.cook_type,
        );

        setSpecialties(
          profile.specialties.join(", "),
        );

        setInstagram(
          profile.instagram_url ?? "",
        );

        setWebsite(
          profile.website_url ?? "",
        );

        setWhatsapp(
          profile.whatsapp_contact ?? "",
        );
      }

      const existingApplication =
        applicationResult.data as
          | CreatorApplication
          | null;

      if (existingApplication) {
        setApplication(
          existingApplication,
        );

        setReason(
          existingApplication.reason ??
            "",
        );
      }

      setLoading(false);
    }

    void loadCookProfile();
  }, [user, authLoading]);

  function normalizeUsername(
    value: string,
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");
  }

  function buildSpecialties() {
    return specialties
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setMessage("");

    const cleanDisplayName =
      displayName.trim();

    const cleanUsername =
      normalizeUsername(username);

    if (!cleanDisplayName) {
      setMessage(
        "Please enter your Cook name.",
      );
      return;
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      setMessage(
        "Username must be between 3 and 30 characters.",
      );
      return;
    }

    setSaving(true);

    const cookPayload = {
      display_name: cleanDisplayName,
      username: cleanUsername,
      bio: bio.trim(),
      location:
        location.trim() || null,
      cook_type: cookType,
      specialties:
        buildSpecialties(),
      instagram_url:
        instagram.trim() || null,
      website_url:
        website.trim() || null,
      whatsapp_contact:
        whatsapp.trim() || null,
    };

    let savedCookProfile: CookProfile | null = null;
    let cookError = null;

    if (cookProfile) {
      const result = await supabase
        .from("cook_profiles")
        .update(cookPayload)
        .eq("user_id", user.id)
        .select(
          `
            display_name,
            username,
            bio,
            location,
            cook_type,
            specialties,
            instagram_url,
            website_url,
            whatsapp_contact,
            is_approved,
            follower_count,
            recipe_count
          `,
        )
        .single();

      cookError = result.error;

      savedCookProfile =
        result.data as CookProfile | null;
    } else {
      const result = await supabase
        .from("cook_profiles")
        .insert({
          user_id: user.id,
          ...cookPayload,
        })
        .select(
          `
            display_name,
            username,
            bio,
            location,
            cook_type,
            specialties,
            instagram_url,
            website_url,
            whatsapp_contact,
            is_approved,
            follower_count,
            recipe_count
          `,
        )
        .single();

      cookError = result.error;

      savedCookProfile =
        result.data as CookProfile | null;
    }

    if (cookError) {
      console.error(
        "Could not save Cook profile:",
        cookError,
      );

      if (
        cookError.code === "23505"
      ) {
        setMessage(
          "That username is already taken. Try another one.",
        );
      } else {
        setMessage(
          "We could not save your Cook profile. Please try again.",
        );
      }

      setSaving(false);
      return;
    }

    /*
     * Regular users still use the existing
     * approval workflow before they can
     * publish recipes publicly.
     *
     * Approved users/admins do not need
     * another application.
     */
    if (
      !savedCookProfile?.is_approved &&
      application?.status !==
        "approved"
    ) {
      const applicationPayload = {
        user_id: user.id,
        display_name:
          cleanDisplayName,
        bio: bio.trim(),
        social_link:
          instagram.trim() ||
          website.trim() ||
          null,
        reason: reason.trim(),
        status: "pending",
      };

      let applicationError;

      if (application) {
        const result = await supabase
          .from(
            "creator_applications",
          )
          .update(
            applicationPayload,
          )
          .eq("user_id", user.id);

        applicationError =
          result.error;
      } else {
        const result = await supabase
          .from(
            "creator_applications",
          )
          .insert(
            applicationPayload,
          );

        applicationError =
          result.error;
      }

      if (applicationError) {
        console.error(
          "Could not submit Cook application:",
          applicationError,
        );

        setMessage(
          "Your Cook profile was saved but we could not submit the approval request.",
        );

        setSaving(false);
        return;
      }

      setApplication({
        reason: reason.trim(),
        status: "pending",
        admin_note: null,
      });
    }

    if (savedCookProfile) {
      setCookProfile(
        savedCookProfile,
      );
    }

    setUsername(cleanUsername);

    setMessage(
      cookProfile
        ? "Your Cook profile was updated."
        : "Your Cook profile was created.",
    );

    setSaving(false);
  }

  if (authLoading || loading) {
    return (
      <main className="creator-application-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="creator-application-page">
        <section className="creator-application-login">
          <ChefHat size={38} />

          <h1>
            Become an Alf Sahten Cook
          </h1>

          <p>
            Sign in first to create your
            Cook profile.
          </p>

          <Link to="/auth">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

const pending =
  application?.status === "pending" &&
  !cookProfile?.is_approved;

  const changesRequested =
    application?.status ===
    "changes_requested";

  const declined =
    application?.status === "declined";

const approved =
  cookProfile?.is_approved === true ||
  application?.status === "approved";

  return (
    <main className="creator-application-page">
      <div className="creator-application-back">
        <Link to="/profile">
          <ArrowLeft size={16} />
          Back to profile
        </Link>
      </div>

      <section className="creator-application-hero">
        <p className="section-kicker">
          Your kitchen, your story
        </p>

        <h1>
          {cookProfile
            ? "Your Cook profile"
            : "Become a Cook"}
        </h1>

        <p>
          Create your public Cook
          identity on Alf Sahten. You
          can be a home cook, food
          creator or professional chef.
        </p>
      </section>

      <section className="creator-application-content">
        <form
          className="creator-application-form"
          onSubmit={handleSubmit}
        >
          {approved && (
            <div className="cook-status-banner cook-status-approved">
              <ChefHat size={18} />

              <div>
                <strong>
                  Approved Cook
                </strong>

                <p>
                  Your Cook profile can
                  be shown publicly.
                </p>
              </div>
            </div>
          )}

          {pending && !approved && (
            <div className="cook-status-banner">
              <Clock3 size={18} />

              <div>
                <strong>
                  Approval pending
                </strong>

                <p>
                  You can keep editing
                  your profile while we
                  review it.
                </p>
              </div>
            </div>
          )}

          {changesRequested && (
            <div className="creator-admin-note">
              <strong>
                Changes requested
              </strong>

              <p>
                {application?.admin_note ||
                  "Please review your Cook profile and submit it again."}
              </p>
            </div>
          )}

          {declined && (
            <div className="creator-admin-note">
              <strong>
                Application not approved
              </strong>

              <p>
                {application?.admin_note ||
                  "You can update your profile and submit it again."}
              </p>
            </div>
          )}

          <div className="creator-form-field">
            <label>
              Cook name
            </label>

            <div className="cook-input-with-icon">
              <UserRound size={17} />

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                placeholder="The name people will see"
                required
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              Username
            </label>

            <div className="cook-username-input">
              <span>@</span>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    normalizeUsername(
                      event.target.value,
                    ),
                  )
                }
                placeholder="your-kitchen"
                minLength={3}
                maxLength={30}
                required
              />
            </div>

            <small className="cook-field-help">
              This will be used for your
              public Cook profile.
            </small>
          </div>

          <div className="creator-form-field">
            <label>
              Cook type
            </label>

            <select
              value={cookType}
              onChange={(event) =>
                setCookType(
                  event.target
                    .value as CookType,
                )
              }
            >
              <option value="home_cook">
                Home Cook
              </option>

              <option value="food_creator">
                Food Creator
              </option>

              <option value="professional_chef">
                Professional Chef
              </option>
            </select>
          </div>

          <div className="creator-form-field">
            <label>
              About you
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value,
                )
              }
              placeholder="Tell people what you love to cook and what makes your kitchen yours."
              rows={5}
            />
          </div>

          <div className="creator-form-field">
            <label>
              Location
            </label>

            <div className="cook-input-with-icon">
              <MapPin size={17} />

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Beirut, Lebanon"
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              Specialties
            </label>

            <input
              type="text"
              value={specialties}
              onChange={(event) =>
                setSpecialties(
                  event.target.value,
                )
              }
              placeholder="Lebanese, desserts, healthy cooking"
            />

            <small className="cook-field-help">
              Separate specialties with
              commas.
            </small>
          </div>

          <div className="creator-form-field">
            <label>
              Instagram
            </label>

            <div className="cook-input-with-icon">
              <AtSign size={17} />

              <input
                type="url"
                value={instagram}
                onChange={(event) =>
                  setInstagram(
                    event.target.value,
                  )
                }
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              Website
            </label>

            <div className="cook-input-with-icon">
              <Globe2 size={17} />

              <input
                type="url"
                value={website}
                onChange={(event) =>
                  setWebsite(
                    event.target.value,
                  )
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              WhatsApp or contact
            </label>

            <input
              type="text"
              value={whatsapp}
              onChange={(event) =>
                setWhatsapp(
                  event.target.value,
                )
              }
              placeholder="+961..."
            />
          </div>

          {!approved && (
            <div className="creator-form-field">
              <label>
                What would you like to
                share on Alf Sahten?
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder="Tell us a little about the recipes or cooking you would like to share."
                rows={4}
              />
            </div>
          )}

          {message && (
            <p className="creator-form-message">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
          >
            <Save size={17} />

            {saving
              ? "Saving..."
              : cookProfile
                ? "Save Cook profile"
                : "Create Cook profile"}
          </button>
        </form>

        <aside className="creator-application-side">
          <ChefHat size={30} />

          <p className="section-kicker">
            Alf Sahten Cooks
          </p>

          <h2>
            Good food always has a
            person behind it.
          </h2>

          <p>
            Build your Cook identity
            now. Recipes, followers and
            community activity will
            appear here as Alf Sahten
            grows.
          </p>

          {cookProfile && (
            <div className="cook-profile-stats">
              <div>
                <strong>
                  {
                    cookProfile.recipe_count
                  }
                </strong>
                <span>Recipes</span>
              </div>

              <div>
                <strong>
                  {
                    cookProfile.follower_count
                  }
                </strong>
                <span>Followers</span>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default CreatorApplicationPage;