import { useEffect, useRef, useState } from "react";
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

import { useAuth } from "../context/AuthContext";

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
  const { username } = useParams();
  const { user, loading } = useAuth();
  if (loading) return <main className="public-cook-page" aria-busy="true" />;
  return (
    <PublicCookContent
      key={username + ":" + (user?.id ?? "guest")}
      username={username}
      currentUserId={user?.id ?? null}
    />
  );
}

function PublicCookContent({ username, currentUserId }: {
  username: string | undefined;
  currentUserId: string | null;
}) {
  const { t, i18n } =
  useTranslation();

const currentLanguage:
  "en" | "fr" | "ar" =
  i18n.resolvedLanguage?.startsWith("ar")
    ? "ar"
    : i18n.resolvedLanguage?.startsWith("fr")
      ? "fr"
      : "en";
  const [cook, setCook] = useState<PublicCookProfile | null>(null);
  const [recipes, setRecipes] = useState<CookRecipe[]>([]);
  const [services, setServices] = useState<CookService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [recipesError, setRecipesError] = useState(false);
  const [servicesError, setServicesError] = useState(false);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const followLock = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    let cancelled = false;
    requestVersion.current += 1;
    async function loadCook() {
      setLoading(true);
      setError(false);
      setNotFound(false);
      setRecipesError(false);
      setServicesError(false);
      setFollowing(null);
      setFollowError("");
      try {
        const profile = username ? await getPublicCookProfile(username) : null;
        if (cancelled) return;
        if (!profile) {
          setNotFound(true);
          setCook(null);
          return;
        }
        setCook(profile);
        setFollowerCount(profile.follower_count ?? 0);
        const [recipeResult, serviceResult, followResult] = await Promise.allSettled([
          getPublishedCookRecipes(
  profile.user_id,
  currentLanguage,
),
          getPublicCookServices(profile.user_id),
          currentUserId && currentUserId !== profile.user_id
            ? isFollowingCook(profile.user_id)
            : Promise.resolve(false),
        ]);
        if (cancelled) return;
        setRecipes(recipeResult.status === "fulfilled" ? recipeResult.value as CookRecipe[] : []);
        setRecipesError(recipeResult.status === "rejected");
        setServices(serviceResult.status === "fulfilled" ? serviceResult.value : []);
        setServicesError(serviceResult.status === "rejected");
        setFollowing(followResult.status === "fulfilled" ? followResult.value : null);
      } catch (err) {
        console.error("Could not load cook profile:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCook();
    return () => {
      cancelled = true;
      requestVersion.current += 1;
    };
   }, [
  username,
  currentUserId,
  attempt,
  currentLanguage,
]);

  async function handleFollowToggle() {
    if (!cook || !currentUserId || currentUserId === cook.user_id ||
        following === null || followLock.current) return;
    followLock.current = true;
    const version = requestVersion.current;
    const nextFollowing = !following;
    setFollowBusy(true);
    setFollowError("");
    try {
      if (nextFollowing) await followCook(cook.user_id);
      else await unfollowCook(cook.user_id);
      if (version !== requestVersion.current) return;
      setFollowing(nextFollowing);
      setFollowerCount(count => Math.max(0, count + (nextFollowing ? 1 : -1)));
      // Refresh the server count: another tab may already have changed this follow.
      try {
        const profile = await getPublicCookProfile(username!);
        if (profile && version === requestVersion.current) {
          setFollowerCount(profile.follower_count ?? 0);
        }
      } catch {
        // The follow succeeded; keep the local count until the next page load.
      }
    } catch (err) {
      console.error("Could not update follow:", err);
      if (version === requestVersion.current) setFollowError("followError");
    } finally {
      followLock.current = false;
      if (version === requestVersion.current) setFollowBusy(false);
    }
  }

  function retry() { setAttempt(value => value + 1); }

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
  {t(error ? "publicCookProfile.loadErrorTitle" : "publicCookProfile.notFoundTitle")}
</h1>

<p>
  {t(error ? "publicCookProfile.loadErrorText" : "publicCookProfile.notFoundText")}
</p>

{error && !notFound && <button type="button" className="public-cook-retry" onClick={retry}>{t("publicCookProfile.retry")}</button>}

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
    t("common.cook");

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
                    t(({ home_cook: "creatorApplication.homeCook", food_creator: "creatorApplication.foodCreator", professional_chef: "creatorApplication.professionalChef" } as Record<string, string>)[cook.cook_type] ?? "common.cook")
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

              {currentUserId !== cook.user_id && (
                !currentUserId ? (
                  <Link className="public-cook-follow-button" to="/auth"
                    state={{ from: "/cooks/" + encodeURIComponent(username!) }}>
                    <Heart size={17} aria-hidden="true" />
                    {t("publicCookProfile.signInToFollow")}
                  </Link>
                ) : following === null ? (
                  <button type="button" className="public-cook-retry" onClick={retry}>
                    {t("publicCookProfile.retry")}
                  </button>
                ) : (
                  <button type="button"
                    className={"public-cook-follow-button " + (following ? "following" : "")}
                    onClick={() => void handleFollowToggle()}
                    disabled={followBusy} aria-busy={followBusy} aria-pressed={following}
                    aria-label={t(following ? "publicCookProfile.unfollow" : "publicCookProfile.follow")}>
                    {following ? <Check size={17} aria-hidden="true" /> : <Heart size={17} aria-hidden="true" />}
                    {t(followBusy ? "publicCookProfile.updating" : following ? "publicCookProfile.following" : "publicCookProfile.follow")}
                  </button>
                )
              )}
            </div>
            {(followError || (currentUserId && following === null)) && (
              <p className="public-cook-follow-error" role="alert">
                {t(followError ? "publicCookProfile.followError" : "publicCookProfile.followStateError")}
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

      {servicesError && (
        <section className="public-cook-services public-cook-load-error" role="alert">
          <p>{t("publicCookProfile.servicesError")}</p>
          <button type="button" className="public-cook-retry" onClick={retry}>{t("publicCookProfile.retry")}</button>
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

    {!recipesError && <span>
      {recipes.length === 1
        ? t("publicCookProfile.recipeCount", {
            count: recipes.length,
          })
        : t("publicCookProfile.recipeCountPlural", {
            count: recipes.length,
          })}
    </span>}
  </div>

        {recipesError ? (
          <div className="public-cook-load-error" role="alert">
            <p>{t("publicCookProfile.recipesError")}</p>
            <button type="button" className="public-cook-retry" onClick={retry}>{t("publicCookProfile.retry")}</button>
          </div>
        ) : recipes.length > 0 ? (
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
                              t(`categories.${recipe.category
  ? t(
      `categories.${recipe.category}`,
      {
        defaultValue:
          recipe.category,
      },
    )
  : ""}`, { defaultValue: recipe.category })
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

  <ArrowRight size={15} />
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