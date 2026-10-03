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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
    t("creatorApplication.enterCookName"),
  );
  return;
}

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      setMessage(
  t("creatorApplication.usernameLength"),
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

    let savedCookProfile: CookProfile | null;
    let cookError;

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
  t("creatorApplication.usernameTaken"),
);
      } else {
        setMessage(
  t("creatorApplication.saveError"),
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
  t(
    "creatorApplication.approvalRequestError",
  ),
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
    ? t(
        "creatorApplication.profileUpdated",
      )
    : t(
        "creatorApplication.profileCreated",
      ),
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
            {t(
              "creatorApplication.signInTitle",
            )}
          </h1>

          <p>
            {t(
              "creatorApplication.signInText",
            )}
          </p>

          <Link to="/auth">
            {t(
              "creatorApplication.signIn",
            )}
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
    cookProfile?.is_approved === true;

  return (
    <main className="creator-application-page">
      <div className="creator-application-back">
        <Link to="/profile">
          <ArrowLeft size={16} />

          {t(
            "creatorApplication.backToProfile",
          )}
        </Link>
      </div>

      <section className="creator-application-hero">
        <p className="section-kicker">
          {t(
            "creatorApplication.heroKicker",
          )}
        </p>

        <h1>
          {cookProfile
            ? t(
                "creatorApplication.yourCookProfile",
              )
            : t(
                "creatorApplication.becomeCook",
              )}
        </h1>

        <p>
  {approved
    ? t(
        "creatorApplication.approvedHeroText",
      )
    : t(
        "creatorApplication.heroText",
      )}
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
                  {t(
                    "creatorApplication.approvedCook",
                  )}
                </strong>

                <p>
                  {t(
                    "creatorApplication.approvedText",
                  )}
                </p>
              </div>
            </div>
          )}

          {pending && !approved && (
            <div className="cook-status-banner">
              <Clock3 size={18} />

              <div>
                <strong>
                  {t(
                    "creatorApplication.approvalPending",
                  )}
                </strong>

                <p>
                  {t(
                    "creatorApplication.pendingText",
                  )}
                </p>
              </div>
            </div>
          )}

          {changesRequested && (
            <div className="creator-admin-note">
              <strong>
                {t(
                  "creatorApplication.changesRequested",
                )}
              </strong>

              <p>
                {application?.admin_note ||
                  t(
                    "creatorApplication.changesFallback",
                  )}
              </p>
            </div>
          )}

          {declined && (
            <div className="creator-admin-note">
              <strong>
                {t(
                  "creatorApplication.declinedTitle",
                )}
              </strong>

              <p>
                {application?.admin_note ||
                  t(
                    "creatorApplication.declinedFallback",
                  )}
              </p>
            </div>
          )}

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.cookName",
              )}
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
                placeholder={t(
                  "creatorApplication.cookNamePlaceholder",
                )}
                required
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.username",
              )}
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
                placeholder={t(
                  "creatorApplication.usernamePlaceholder",
                )}
                minLength={3}
                maxLength={30}
                required
              />
            </div>

            <small className="cook-field-help">
              {t(
                "creatorApplication.usernameHelp",
              )}
            </small>
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.cookType",
              )}
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
                {t(
                  "creatorApplication.homeCook",
                )}
              </option>

              <option value="food_creator">
                {t(
                  "creatorApplication.foodCreator",
                )}
              </option>

              <option value="professional_chef">
                {t(
                  "creatorApplication.professionalChef",
                )}
              </option>
            </select>
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.aboutYou",
              )}
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value,
                )
              }
              placeholder={t(
                "creatorApplication.aboutPlaceholder",
              )}
              rows={5}
            />
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.location",
              )}
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
                placeholder={t(
                  "creatorApplication.locationPlaceholder",
                )}
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.specialties",
              )}
            </label>

            <input
              type="text"
              value={specialties}
              onChange={(event) =>
                setSpecialties(
                  event.target.value,
                )
              }
              placeholder={t(
                "creatorApplication.specialtiesPlaceholder",
              )}
            />

            <small className="cook-field-help">
              {t(
                "creatorApplication.specialtiesHelp",
              )}
            </small>
          </div>

          <div className="creator-form-field">
            <label>
              {t(
                "creatorApplication.instagram",
              )}
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
              {t(
                "creatorApplication.website",
              )}
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
              {t(
                "creatorApplication.whatsapp",
              )}
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
                {t(
                  "creatorApplication.shareQuestion",
                )}
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder={t(
                  "creatorApplication.sharePlaceholder",
                )}
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
              ? t(
                  "creatorApplication.saving",
                )
              : cookProfile
                ? t(
                    "creatorApplication.saveProfile",
                  )
                : t(
                    "creatorApplication.createProfile",
                  )}
          </button>
        </form>

        <aside className="creator-application-side">
          <ChefHat size={30} />

          <p className="section-kicker">
            {t(
              "creatorApplication.sideKicker",
            )}
          </p>

          <h2>
            {t(
              "creatorApplication.sideTitle",
            )}
          </h2>

          <p>
            {t(
              "creatorApplication.sideText",
            )}
          </p>

          {cookProfile && (
            <div className="cook-profile-stats">
              <div>
                <strong>
                  {
                    cookProfile.recipe_count
                  }
                </strong>

                <span>
                  {t(
                    "creatorApplication.recipes",
                  )}
                </span>
              </div>

              <div>
                <strong>
                  {
                    cookProfile.follower_count
                  }
                </strong>

                <span>
                  {t(
                    "creatorApplication.followers",
                  )}
                </span>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default CreatorApplicationPage;
