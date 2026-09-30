import { useEffect, useState } from "react";
import {
  ArrowRight,
  AtSign,
  Check,
  ChefHat,
  Clock3,
  Globe,
  Heart,
  MapPin,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  followCook,
  getCurrentUserId,
  getPublicCookProfile,
  getPublishedCookRecipes,
  isFollowingCook,
  unfollowCook,
  type PublicCookProfile,
} from "../services/cooks";

import {
  getPublicCookServices,
  type CookService,
} from "../services/cookServices";

import "./PublicCookPage.css";

type CookRecipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  published_at: string | null;
  created_at: string;
};

function PublicCookPage() {
  const { t } = useTranslation();
  const { username } = useParams();

  const [cook, setCook] =
    useState<PublicCookProfile | null>(null);

  const [recipes, setRecipes] =
    useState<CookRecipe[]>([]);

  const [services, setServices] =
    useState<CookService[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [following, setFollowing] =
    useState(false);

  const [followBusy, setFollowBusy] =
    useState(false);

  const [followError, setFollowError] =
    useState("");

  const [followerCount, setFollowerCount] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCook() {
      if (!username) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);
      setCook(null);
      setRecipes([]);
      setServices([]);
      setFollowing(false);
      setFollowError("");

      try {
        /*
         * The cook profile is the only critical request.
         * If this fails, the page genuinely cannot load.
         */
        const profile =
          await getPublicCookProfile(username);

        if (cancelled) {
          return;
        }

        if (!profile) {
          setError(true);
          return;
        }

        setCook(profile);

        setFollowerCount(
          profile.follower_count ?? 0,
        );

        /*
         * Follow state is optional.
         * A failure here must never hide a valid cook.
         */
        try {
          const visitorId =
            await getCurrentUserId();

          if (cancelled) {
            return;
          }

          setCurrentUserId(visitorId);

          if (
            visitorId &&
            visitorId !== profile.user_id
          ) {
            try {
              const visitorFollowing =
                await isFollowingCook(
                  profile.user_id,
                );

              if (!cancelled) {
                setFollowing(
                  visitorFollowing,
                );
              }
            } catch (followStateError) {
              console.error(
                "Could not load follow state:",
                followStateError,
              );

              if (!cancelled) {
                setFollowing(false);
              }
            }
          } else {
            setFollowing(false);
          }
        } catch (visitorError) {
          console.error(
            "Could not load current user:",
            visitorError,
          );

          if (!cancelled) {
            setCurrentUserId(null);
            setFollowing(false);
          }
        }

        /*
         * Recipes and services are also optional.
         * One failing must not prevent the other
         * or hide the cook profile.
         */
        const [
          recipeResult,
          serviceResult,
        ] = await Promise.allSettled([
          getPublishedCookRecipes(
            profile.user_id,
          ),
          getPublicCookServices(
            profile.user_id,
          ),
        ]);

        if (cancelled) {
          return;
        }

        if (
          recipeResult.status ===
          "fulfilled"
        ) {
          setRecipes(
            recipeResult.value as CookRecipe[],
          );
        } else {
          console.error(
            "Could not load cook recipes:",
            recipeResult.reason,
          );

          setRecipes([]);
        }

        if (
          serviceResult.status ===
          "fulfilled"
        ) {
          setServices(
            serviceResult.value,
          );
        } else {
          console.error(
            "Could not load cook services:",
            serviceResult.reason,
          );

          setServices([]);
        }
      } catch (err) {
        console.error(
          "Could not load cook profile:",
          err,
        );

        if (!cancelled) {
          setError(true);
          setCook(null);
          setRecipes([]);
          setServices([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCook();

    return () => {
      cancelled = true;
    };
  }, [username]);

  async function handleFollowToggle() {
    if (!cook) {
      return;
    }

    if (!currentUserId) {
   setFollowError(
  t("publicCookProfile.signInToFollow"),
);

      return;
    }

    if (
      currentUserId === cook.user_id
    ) {
      return;
    }

    try {
      setFollowBusy(true);
      setFollowError("");

      if (following) {
        await unfollowCook(
          cook.user_id,
        );

        setFollowing(false);

        setFollowerCount(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      } else {
        await followCook(
          cook.user_id,
        );

        setFollowing(true);

        setFollowerCount(
          (current) =>
            current + 1,
        );
      }
    } catch (err) {
      console.error(
        "Could not update follow:",
        err,
      );

      setFollowError(
  t("publicCookProfile.followError"),
);
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="public-cook-page">
        <div className="profile-loading">
          <ChefHat size={30} />
        </div>
      </main>
    );
  }

  if (
    error ||
    !cook
  ) {
    return (
      <main className="public-cook-page">
        <section className="public-cook-empty">
          <ChefHat
            size={42}
            strokeWidth={1.4}
          />

          <h1>
  {t("publicCookProfile.notFoundTitle")}
</h1>

<p>
  {t("publicCookProfile.notFoundText")}
</p>

<Link to="/discover">
  {t("publicCookProfile.discoverRecipes")}

  <ArrowRight
    size={16}
  />
</Link>
        </section>
      </main>
    );
  }

  const displayName =
    cook.display_name ??
    cook.username ??
    "Cook";

  return (
    <main className="public-cook-page">
      <section className="public-cook-hero">
        {cook.cover_image_url && (
          <div className="public-cook-cover">
            <img
              src={
                cook.cover_image_url
              }
              alt=""
            />
          </div>
        )}

        <div className="public-cook-profile">
          <div className="public-cook-avatar">
            {cook.profile_image_url ? (
              <img
                src={
                  cook.profile_image_url
                }
                alt={
                  displayName
                }
              />
            ) : (
              <ChefHat
                size={38}
                strokeWidth={1.4}
              />
            )}
          </div>

          <div className="public-cook-intro">
            <p className="section-kicker">
  {t("publicCookProfile.badge")}
</p>

            <h1>
              {displayName}
            </h1>

            {cook.username && (
              <span className="public-cook-username">
                @{cook.username}
              </span>
            )}

            {cook.bio && (
              <p className="public-cook-bio">
                {cook.bio}
              </p>
            )}

            <div className="public-cook-details">
              {cook.location && (
                <span>
                  <MapPin
                    size={16}
                  />

                  {
                    cook.location
                  }
                </span>
              )}

              {cook.cook_type && (
                <span>
                  <ChefHat
                    size={16}
                  />

                  {
                    cook.cook_type
                  }
                </span>
              )}
            </div>

            <div className="public-cook-follow-row">
              <div className="public-cook-follow-count">
                <strong>
                  {followerCount}
                </strong>

                <span>
  {followerCount === 1
    ? t("publicCookProfile.follower")
    : t("publicCookProfile.followers")}
</span>
              </div>

              {currentUserId !==
                cook.user_id && (
                <button
                  type="button"
                  className={`public-cook-follow-button ${
                    following
                      ? "following"
                      : ""
                  }`}
                  onClick={() => {
                    void handleFollowToggle();
                  }}
                  disabled={
                    followBusy
                  }
                  aria-pressed={
                    following
                  }
                >
                  {following ? (
                    <Check
                      size={17}
                    />
                  ) : (
                    <Heart
                      size={17}
                    />
                  )}

                  {followBusy
  ? t("publicCookProfile.updating")
  : following
    ? t("publicCookProfile.following")
    : t("publicCookProfile.follow")}
                </button>
              )}
            </div>

            {followError && (
              <p className="public-cook-follow-error">
                {followError}
              </p>
            )}

            <div className="public-cook-links">
  {cook.instagram_url && (
    <a
      href={
        cook.instagram_url
      }
      target="_blank"
      rel="noreferrer"
    >
      <AtSign
        size={17}
      />

      {t("publicCookProfile.instagram")}
    </a>
  )}

  {cook.website_url && (
    <a
      href={
        cook.website_url
      }
      target="_blank"
      rel="noreferrer"
    >
      <Globe
        size={17}
      />

      {t("publicCookProfile.website")}
    </a>
  )}
</div>
          </div>
        </div>
      </section>

      {cook.specialties &&
        cook.specialties.length >
          0 && (
          <section className="public-cook-specialties">
            <p className="section-kicker">
  {t("publicCookProfile.specialties")}
</p>

            <div>
              {cook.specialties.map(
                (specialty) => (
                  <span
                    key={
                      specialty
                    }
                  >
                    {specialty}
                  </span>
                ),
              )}
            </div>
          </section>
        )}

      {services.length > 0 && (
        <section className="public-cook-services">
          <div className="public-cook-services-heading">
            <div>
              <p className="section-kicker">
                {t(
                  "publicCookServices.kicker",
                )}
              </p>

              <h2>
                {t(
                  "publicCookServices.title",
                  {
                    name: displayName,
                  },
                )}
              </h2>

              <p>
                {t(
                  "publicCookServices.subtitle",
                )}
              </p>
            </div>

            <span>
              {t(
                "publicCookServices.serviceCount",
                {
                  count:
                    services.length,
                },
              )}
            </span>
          </div>

          <div className="public-cook-service-grid">
            {services.map(
              (service) => (
                <article
                  key={
                    service.id
                  }
                  className="public-cook-service-card"
                >
                  {service.photo_url ? (
                    <div className="public-cook-service-image">
                      <img
                        src={
                          service.photo_url
                        }
                        alt={
                          service.title
                        }
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="public-cook-service-placeholder">
                      <ChefHat
                        size={34}
                        strokeWidth={
                          1.4
                        }
                      />
                    </div>
                  )}

                  <div className="public-cook-service-content">
                    <p className="public-cook-service-type">
                      {t(
                        `cookServices.serviceTypes.${service.service_type}`,
                        {
                          defaultValue:
                            service.service_type,
                        },
                      )}
                    </p>

                    <h3>
                      {
                        service.title
                      }
                    </h3>

                    <p className="public-cook-service-description">
                      {
                        service.description
                      }
                    </p>

                    <div className="public-cook-service-info">
                      {service.starting_price !==
                        null &&
                        service.currency && (
                          <div>
                            <span>
                              {t(
                                "publicCookServices.startingFrom",
                              )}
                            </span>

                            <strong>
                              {
                                service.starting_price
                              }{" "}
                              {
                                service.currency
                              }
                            </strong>
                          </div>
                        )}

                      {service.availability_note && (
                        <div>
                          <span>
                            {t(
                              "publicCookServices.availability",
                            )}
                          </span>

                          <strong>
                            {
                              service.availability_note
                            }
                          </strong>
                        </div>
                      )}
                    </div>

                    <Link
  to={`/services/${service.id}/request?from=${encodeURIComponent(
    `/cooks/${cook.username ?? username}`,
  )}`}
  className="public-cook-service-request"
>
                      {t(
                        "publicCookServices.requestService",
                      )}

                      <ArrowRight
                        size={16}
                      />
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}

      <section className="public-cook-recipes">
  <div className="public-cook-recipes-heading">
    <div>
      <p className="section-kicker">
        {t("publicCookProfile.recipes")}
      </p>

      <h2>
        {t("publicCookProfile.recipesBy", {
          name: displayName,
        })}
      </h2>
    </div>

    <span>
      {recipes.length === 1
        ? t("publicCookProfile.recipeCount", {
            count: recipes.length,
          })
        : t("publicCookProfile.recipeCountPlural", {
            count: recipes.length,
          })}
    </span>
  </div>

        {recipes.length > 0 ? (
          <div className="public-cook-recipe-grid">
            {recipes.map(
              (recipe) => {
                const totalMinutes =
                  (recipe.prep_minutes ??
                    0) +
                  (recipe.cook_minutes ??
                    0);

                return (
                  <article
                    className="public-cook-recipe-card"
                    key={
                      recipe.id
                    }
                  >
                    <Link
                      to={`/recipe/${recipe.id}`}
                      className="public-cook-recipe-image"
                    >
                      {recipe.image_url ? (
                        <img
                          src={
                            recipe.image_url
                          }
                          alt={
                            recipe.title
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="public-cook-recipe-placeholder">
                          <ChefHat
                            size={
                              34
                            }
                            strokeWidth={
                              1.4
                            }
                          />
                        </div>
                      )}
                    </Link>

                    <div className="public-cook-recipe-content">
                      <div className="public-cook-recipe-meta">
                        {recipe.category && (
                          <span>
                            {
                              recipe.category
                            }
                          </span>
                        )}

                        {totalMinutes >
  0 && (
  <span>
    <Clock3
      size={
        14
      }
    />

    {
      totalMinutes
    }{" "}
    {t("publicCookProfile.minuteShort")}
  </span>
)}
                      </div>

                      <Link
                        to={`/recipe/${recipe.id}`}
                      >
                        <h3>
                          {
                            recipe.title
                          }
                        </h3>
                      </Link>

                      {recipe.description && (
                        <p>
                          {
                            recipe.description
                          }
                        </p>
                      )}

                      <Link
                        to={`/recipe/${recipe.id}`}
                        className="public-cook-view-recipe"
                      >
                        {t("publicCookProfile.viewRecipe")}

                        <ArrowRight
                          size={
                            15
                          }
                        />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="public-cook-no-recipes">
  <ChefHat
    size={32}
    strokeWidth={1.4}
  />

  <h3>
    {t("publicCookProfile.noRecipesTitle")}
  </h3>

  <p>
    {t("publicCookProfile.noRecipesText")}
  </p>
</div>
        )}
      </section>
    </main>
  );
}

export default PublicCookPage;