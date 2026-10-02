import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  ChefHat,
  ExternalLink,
  MapPin,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  getCookApplications,
  moderateCookApplication,
  type AdminCookApplication,
  type CookApplicationStatus,
} from "../services/cookApplications";

import "./AdminCookApplicationsPage.css";

type ReviewStatus =
  | "pending"
  | "approved"
  | "declined";

function AdminCookApplicationsPage() {
 const { t } = useTranslation();
  const [status, setStatus] =
    useState<ReviewStatus>("pending");

  const [
    applications,
    setApplications,
  ] = useState<AdminCookApplication[]>(
    [],
  );

  const [
    selectedApplication,
    setSelectedApplication,
  ] =
    useState<AdminCookApplication | null>(
      null,
    );

  const [adminNote, setAdminNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [moderating, setModerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadApplications(
    nextStatus:
      CookApplicationStatus = status,
  ) {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getCookApplications(
          nextStatus,
        );

      setApplications(data);

      setSelectedApplication(
        (current) => {
          if (!data.length) {
            return null;
          }

          if (
            current &&
            data.some(
              (application) =>
                application.user_id ===
                current.user_id,
            )
          ) {
            return (
              data.find(
                (application) =>
                  application.user_id ===
                  current.user_id,
              ) ?? data[0]
            );
          }

          return data[0];
        },
      );
    } catch (err) {
      console.error(
        "Could not load Cook applications:",
        err,
      );

      setError(
        t(
          "adminCookApplications.loadError",
          {
            defaultValue:
              "Could not load Cook applications.",
          },
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function selectApplication(
    application: AdminCookApplication,
  ) {
    setSelectedApplication(
      application,
    );

    setAdminNote(
      application.admin_note ?? "",
    );

    setError(null);
  }

  async function handleModeration(
    nextStatus:
      | "approved"
      | "declined",
  ) {
    if (!selectedApplication) {
      return;
    }

    try {
      setModerating(true);
      setError(null);

      await moderateCookApplication(
        selectedApplication.user_id,
        nextStatus,
        adminNote,
      );

      const remaining =
        applications.filter(
          (application) =>
            application.user_id !==
            selectedApplication.user_id,
        );

      setApplications(remaining);

      setSelectedApplication(
        remaining[0] ?? null,
      );

      setAdminNote("");
    } catch (err) {
      console.error(
        "Could not moderate Cook application:",
        err,
      );

      setError(
        t(
          "adminCookApplications.updateError",
          {
            defaultValue:
              "Could not update this application.",
          },
        ),
      );
    } finally {
      setModerating(false);
    }
  }

  function cookTypeLabel(
    cookType: string | null | undefined,
  ) {
    if (!cookType) {
      return t(
        "common.cook",
        {
          defaultValue: "Cook",
        },
      );
    }

    const keys: Record<
      string,
      string
    > = {
      home_cook:
        "creatorApplication.homeCook",
      food_creator:
        "creatorApplication.foodCreator",
      professional_chef:
        "creatorApplication.professionalChef",
    };

    return t(
      keys[cookType] ??
        "common.cook",
      {
        defaultValue: cookType,
      },
    );
  }

  function statusLabel(
    value: ReviewStatus,
  ) {
    if (value === "approved") {
      return t(
        "adminCookApplications.approved",
        {
          defaultValue: "Approved",
        },
      );
    }

    if (value === "declined") {
      return t(
        "adminCookApplications.declined",
        {
          defaultValue: "Declined",
        },
      );
    }

    return t(
      "adminCookApplications.pending",
      {
        defaultValue: "Pending",
      },
    );
  }

  if (loading) {
    return (
      <main className="admin-cooks-page">
        <div className="admin-cooks-loading">
          <ChefHat size={30} />

          <span>
            {t(
              "adminCookApplications.loading",
              {
                defaultValue:
                  "Loading Cook applications...",
              },
            )}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-cooks-page">
      <div className="admin-cooks-container">
        <header className="admin-cooks-header">
          <div>
            <p className="eyebrow">
              {t(
                "adminCookApplications.dashboard",
                {
                  defaultValue:
                    "Admin dashboard",
                },
              )}
            </p>

            <h1>
              {t(
                "adminCookApplications.title",
                {
                  defaultValue:
                    "Cook applications",
                },
              )}
            </h1>

            <p>
              {t(
                "adminCookApplications.intro",
                {
                  defaultValue:
                    "Review people who want to publish recipes and offer Cook services on Alf Sahten.",
                },
              )}
            </p>
          </div>

          <div className="admin-cooks-header-actions">
  <Link
    to="/admin"
    className="admin-cooks-secondary-button"
  >
    {t("profile.adminDashboard", {
      defaultValue: "Admin dashboard",
    })}
  </Link>

  <Link
    to="/admin/recipes"
    className="admin-cooks-secondary-button"
  >
    {t(
      "adminCookApplications.recipeReviews",
      {
        defaultValue:
          "Recipe reviews",
      },
    )}
  </Link>

            <button
              type="button"
              className="admin-cooks-refresh"
              onClick={() =>
                void loadApplications(
                  status,
                )
              }
            >
              <RefreshCw size={17} />

              {t(
                "adminCookApplications.refresh",
                {
                  defaultValue:
                    "Refresh",
                },
              )}
            </button>
          </div>
        </header>

        <div className="admin-cooks-tabs">
          {(
            [
              "pending",
              "approved",
              "declined",
            ] as ReviewStatus[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                status === tab
                  ? "admin-cooks-tab active"
                  : "admin-cooks-tab"
              }
              onClick={() => {
                setStatus(tab);
                setAdminNote("");
                setSelectedApplication(
                  null,
                );
              }}
            >
              {statusLabel(tab)}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="admin-cooks-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <section className="admin-cooks-empty">
            <Check size={34} />

            <h2>
              {t(
                "adminCookApplications.emptyTitle",
                {
                  defaultValue:
                    "Nothing to review here",
                },
              )}
            </h2>

            <p>
              {status === "pending"
                ? t(
                    "adminCookApplications.emptyPending",
                    {
                      defaultValue:
                        "There are no pending Cook applications.",
                    },
                  )
                : t(
                    "adminCookApplications.emptyStatus",
                    {
                      defaultValue:
                        "There are no applications in this section yet.",
                    },
                  )}
            </p>
          </section>
        ) : (
          <div className="admin-cooks-layout">
            <aside className="admin-cooks-list">
              <div className="admin-cooks-list-heading">
                <span>
                  {statusLabel(status)}
                </span>

                <strong>
                  {
                    applications.length
                  }
                </strong>
              </div>

              {applications.map(
                (application) => {
                  const cook =
                    application.cook;

                  return (
                    <button
                      key={
                        application.user_id
                      }
                      type="button"
                      className={
                        selectedApplication
                          ?.user_id ===
                        application.user_id
                          ? "admin-cook-list-item active"
                          : "admin-cook-list-item"
                      }
                      onClick={() =>
                        selectApplication(
                          application,
                        )
                      }
                    >
                      <div className="admin-cook-list-avatar">
                        {cook?.profile_image_url ? (
                          <img
                            src={
                              cook.profile_image_url
                            }
                            alt=""
                          />
                        ) : (
                          <ChefHat
                            size={20}
                          />
                        )}
                      </div>

                      <div>
                        <strong>
                          {cook
                            ?.display_name ??
                            application.display_name}
                        </strong>

                        <span>
                          {cook?.username
                            ? `@${cook.username}`
                            : cookTypeLabel(
                                cook?.cook_type,
                              )}
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </aside>

            {selectedApplication && (
              <section className="admin-cook-review">
                <div className="admin-cook-review-header">
                  <div className="admin-cook-review-avatar">
                    {selectedApplication
                      .cook
                      ?.profile_image_url ? (
                      <img
                        src={
                          selectedApplication
                            .cook
                            .profile_image_url
                        }
                        alt=""
                      />
                    ) : (
                      <UserRound
                        size={34}
                      />
                    )}
                  </div>

                  <div>
                    <span
                      className={`admin-cook-status ${status}`}
                    >
                      {statusLabel(
                        status,
                      )}
                    </span>

                    <h2>
                      {selectedApplication
                        .cook
                        ?.display_name ??
                        selectedApplication
                          .display_name}
                    </h2>

                    {selectedApplication
                      .cook?.username && (
                      <p className="admin-cook-username">
                        @
                        {
                          selectedApplication
                            .cook.username
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="admin-cook-summary">
                  <div>
                    <span>
                      {t(
                        "adminCookApplications.cookType",
                        {
                          defaultValue:
                            "Cook type",
                        },
                      )}
                    </span>

                    <strong>
                      {selectedApplication.cook?.cook_type
  ? cookTypeLabel(
      selectedApplication.cook.cook_type,
    )
  : t("adminCookApplications.notProvided")}
                    </strong>
                  </div>

                <div>
  <span>
    {t(
      "adminCookApplications.location",
      {
        defaultValue: "Location",
      },
    )}
  </span>

  <strong className="admin-cook-inline">
    <MapPin size={15} />

    {selectedApplication.cook?.location ||
      t("adminCookApplications.notProvided")}
  </strong>
</div>

<div>
  <span>
  {t("adminCookApplications.whatsappPhone")}
</span>

  <strong dir="ltr">
    {selectedApplication.cook
      ?.whatsapp_contact ||
      t("adminCookApplications.notProvided")}
  </strong>
</div>

                </div>

                {selectedApplication
                  .cook?.bio && (
                  <div className="admin-cook-section">
                    <h3>
                      {t(
                        "adminCookApplications.bio",
                        {
                          defaultValue:
                            "Cook bio",
                        },
                      )}
                    </h3>

                    <p>
                      {
                        selectedApplication
                          .cook.bio
                      }
                    </p>
                  </div>
                )}

                {selectedApplication
                  .reason && (
                  <div className="admin-cook-section">
                    <h3>
                      {t(
                        "adminCookApplications.reason",
                        {
                          defaultValue:
                            "Why they want to join",
                        },
                      )}
                    </h3>

                    <p>
                      {
                        selectedApplication
                          .reason
                      }
                    </p>
                  </div>
                )}

                {selectedApplication
                  .cook?.specialties &&
                  selectedApplication
                    .cook.specialties
                    .length > 0 && (
                    <div className="admin-cook-section">
                      <h3>
                        {t(
                          "adminCookApplications.specialties",
                          {
                            defaultValue:
                              "Specialties",
                          },
                        )}
                      </h3>

                      <div className="admin-cook-specialties">
                        {selectedApplication
                          .cook.specialties.map(
                            (
                              specialty,
                            ) => (
                              <span
                                key={
                                  specialty
                                }
                              >
                                {
                                  specialty
                                }
                              </span>
                            ),
                          )}
                      </div>
                    </div>
                  )}

                <div className="admin-cook-links">
                  {selectedApplication
                    .cook
                    ?.instagram_url && (
                    <a
                      href={
                        selectedApplication
                          .cook
                          .instagram_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("adminCookApplications.instagram")}
                      <ExternalLink
                        size={14}
                      />
                    </a>
                  )}

                  {selectedApplication
                    .cook
                    ?.website_url && (
                    <a
                      href={
                        selectedApplication
                          .cook
                          .website_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(
                        "adminCookApplications.website",
                        {
                          defaultValue:
                            "Website",
                        },
                      )}

                      <ExternalLink
                        size={14}
                      />
                    </a>
                  )}

                </div>

                {status === "pending" && (
                  <>
                    <div className="admin-cook-note">
                      <label htmlFor="admin-cook-note">
                        {t(
                          "adminCookApplications.adminNote",
                          {
                            defaultValue:
                              "Admin note",
                          },
                        )}
                      </label>

                      <textarea
                        id="admin-cook-note"
                        rows={4}
                        value={
                          adminNote
                        }
                        onChange={(
                          event,
                        ) =>
                          setAdminNote(
                            event.target
                              .value,
                          )
                        }
                        placeholder={t(
                          "adminCookApplications.notePlaceholder",
                          {
                            defaultValue:
                              "Optional note for the applicant...",
                          },
                        )}
                      />
                    </div>

                    <div className="admin-cook-actions">
                      <button
                        type="button"
                        className="admin-cook-decline"
                        disabled={
                          moderating
                        }
                        onClick={() =>
                          void handleModeration(
                            "declined",
                          )
                        }
                      >
                        <X size={17} />

                        {t(
                          "adminCookApplications.decline",
                          {
                            defaultValue:
                              "Decline",
                          },
                        )}
                      </button>

                      <button
                        type="button"
                        className="admin-cook-approve"
                        disabled={
                          moderating
                        }
                        onClick={() =>
                          void handleModeration(
                            "approved",
                          )
                        }
                      >
                        <Check
                          size={17}
                        />

                        {moderating
                          ? t(
                              "adminCookApplications.saving",
                              {
                                defaultValue:
                                  "Saving...",
                              },
                            )
                          : t(
                              "adminCookApplications.approve",
                              {
                                defaultValue:
                                  "Approve Cook",
                              },
                            )}
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminCookApplicationsPage;