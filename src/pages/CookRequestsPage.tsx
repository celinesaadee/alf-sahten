import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import CookDashboardNav from "../components/CookDashboardNav";

import {
  getCookServiceRequests,
  updateCookServiceRequestStatus,
  type ServiceRequest,
  type ServiceRequestStatus,
} from "../services/serviceRequests";

import "./CookRequestsPage.css";

type RequestFilter =
  | "all"
  | ServiceRequestStatus;

function CookRequestsPage() {
  const { t, i18n } = useTranslation();

  const [
    requests,
    setRequests,
  ] = useState<ServiceRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<RequestFilter>("all");

  const [
    busyRequestId,
    setBusyRequestId,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getCookServiceRequests();

        if (cancelled) {
          return;
        }

        setRequests(data);
      } catch (err) {
        console.error(
          "Could not load service requests:",
          err,
        );

        if (!cancelled) {
          setError(
            t(
              "cookRequests.errors.load",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredRequests =
    useMemo(() => {
      if (
        activeFilter === "all"
      ) {
        return requests;
      }

      return requests.filter(
        (request) =>
          request.status ===
          activeFilter,
      );
    }, [
      requests,
      activeFilter,
    ]);

  const stats = useMemo(
    () => ({
      total: requests.length,

      pending: requests.filter(
        (request) =>
          request.status ===
          "pending",
      ).length,

      accepted: requests.filter(
        (request) =>
          request.status ===
          "accepted",
      ).length,

      completed: requests.filter(
        (request) =>
          request.status ===
          "completed",
      ).length,
    }),
    [requests],
  );

  async function changeStatus(
    requestId: string,
    status:
      | "accepted"
      | "declined"
      | "completed",
  ) {
    try {
      setBusyRequestId(
        requestId,
      );

      setError("");

      const updated =
        await updateCookServiceRequestStatus(
          requestId,
          status,
        );

      setRequests(
        (current) =>
          current.map(
            (request) =>
              request.id ===
              updated.id
                ? updated
                : request,
          ),
      );
    } catch (err) {
      console.error(
        "Could not update request:",
        err,
      );

      setError(
        t(
          "cookRequests.errors.update",
        ),
      );
    } finally {
      setBusyRequestId(null);
    }
  }

  function formatDate(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      i18n.resolvedLanguage ??
        i18n.language,
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(
        `${value}T12:00:00`,
      ),
    );
  }

  function formatCreatedAt(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      i18n.resolvedLanguage ??
        i18n.language,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    ).format(
      new Date(value),
    );
  }

  function statusLabel(
    status: ServiceRequestStatus,
  ) {
    return t(
      `cookRequests.statuses.${status}`,
    );
  }

  const filters: {
    value: RequestFilter;
    label: string;
  }[] = [
    {
      value: "all",
      label: t(
        "cookRequests.filters.all",
      ),
    },
    {
      value: "pending",
      label: t(
        "cookRequests.filters.pending",
      ),
    },
    {
      value: "accepted",
      label: t(
        "cookRequests.filters.accepted",
      ),
    },
    {
      value: "completed",
      label: t(
        "cookRequests.filters.completed",
      ),
    },
    {
      value: "declined",
      label: t(
        "cookRequests.filters.declined",
      ),
    },
    {
      value: "cancelled",
      label: t(
        "cookRequests.filters.cancelled",
      ),
    },
  ];

  return (
    <main className="cook-requests-page">
      <div className="cook-requests-shell">
        <CookDashboardNav />

        <header className="cook-requests-header">
          <div>
            <p className="section-kicker">
              {t(
                "cookRequests.eyebrow",
              )}
            </p>

            <h1>
              {t(
                "cookRequests.title",
              )}
            </h1>

            <p>
              {t(
                "cookRequests.subtitle",
              )}
            </p>
          </div>

          {stats.pending > 0 && (
            <div className="cook-requests-pending-count">
              <Clock3 size={17} />

              {t(
                "cookRequests.pendingCount",
                {
                  count:
                    stats.pending,
                },
              )}
            </div>
          )}
        </header>

        <section className="cook-request-stats">
          <article className="cook-request-stat-card">
            <div className="cook-request-stat-icon">
              <ChefHat
                size={20}
              />
            </div>

            <div>
              <span>
                {t(
                  "cookRequests.stats.total",
                )}
              </span>

              <strong>
                {stats.total}
              </strong>
            </div>
          </article>

          <article className="cook-request-stat-card">
            <div className="cook-request-stat-icon">
              <Clock3
                size={20}
              />
            </div>

            <div>
              <span>
                {t(
                  "cookRequests.stats.pending",
                )}
              </span>

              <strong>
                {stats.pending}
              </strong>
            </div>
          </article>

          <article className="cook-request-stat-card">
            <div className="cook-request-stat-icon">
              <Check
                size={20}
              />
            </div>

            <div>
              <span>
                {t(
                  "cookRequests.stats.accepted",
                )}
              </span>

              <strong>
                {stats.accepted}
              </strong>
            </div>
          </article>

          <article className="cook-request-stat-card">
            <div className="cook-request-stat-icon">
              <CheckCircle2
                size={20}
              />
            </div>

            <div>
              <span>
                {t(
                  "cookRequests.stats.completed",
                )}
              </span>

              <strong>
                {stats.completed}
              </strong>
            </div>
          </article>
        </section>

        <div className="cook-requests-filters">
          {filters.map(
            (filter) => (
              <button
                key={
                  filter.value
                }
                type="button"
                className={
                  activeFilter ===
                  filter.value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(
                    filter.value,
                  )
                }
              >
                {filter.label}
              </button>
            ),
          )}
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {loading ? (
          <div className="profile-loading">
            <ChefHat size={28} />
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <section className="cook-requests-empty">
            <ChefHat
              size={38}
              strokeWidth={1.4}
            />

            <h2>
              {activeFilter ===
              "all"
                ? t(
                    "cookRequests.empty.title",
                  )
                : t(
                    "cookRequests.empty.filteredTitle",
                  )}
            </h2>

            <p>
              {activeFilter ===
              "all"
                ? t(
                    "cookRequests.empty.text",
                  )
                : t(
                    "cookRequests.empty.filteredText",
                  )}
            </p>
          </section>
        ) : (
          <div className="cook-requests-list">
            {filteredRequests.map(
              (request) => {
                const busy =
                  busyRequestId ===
                  request.id;

                return (
                  <article
                    key={
                      request.id
                    }
                    className="cook-request-card"
                  >
                    <div className="cook-request-card-top">
                      <div>
                        <p className="section-kicker">
                          {
                            request.service_title
                          }
                        </p>

                        <h2>
                          {
                            request.customer_name
                          }
                        </h2>

                        <span className="cook-request-received">
                          {t(
                            "cookRequests.received",
                            {
                              date: formatCreatedAt(
                                request.created_at,
                              ),
                            },
                          )}
                        </span>
                      </div>

                      <span
                        className={`cook-request-status cook-request-status-${request.status}`}
                      >
                        {statusLabel(
                          request.status,
                        )}
                      </span>
                    </div>

                    <div className="cook-request-details-grid">
                      <div>
                        <CalendarDays
                          size={17}
                        />

                        <span>
                          {t(
                            "cookRequests.requestedDate",
                          )}
                        </span>

                        <strong>
                          {formatDate(
                            request.requested_date,
                          )}
                        </strong>
                      </div>

                      <div>
                        <MapPin
                          size={17}
                        />

                        <span>
                          {t(
                            "cookRequests.location",
                          )}
                        </span>

                        <strong>
                          {
                            request.location
                          }
                        </strong>
                      </div>

                      <div>
                        <Mail
                          size={17}
                        />

                        <span>
                          {t(
                            "cookRequests.email",
                          )}
                        </span>

                        <strong>
                          {
                            request.customer_email
                          }
                        </strong>
                      </div>

                      {request.customer_phone && (
                        <div>
                          <Phone
                            size={17}
                          />

                          <span>
                            {t(
                              "cookRequests.phone",
                            )}
                          </span>

                          <strong>
                            {
                              request.customer_phone
                            }
                          </strong>
                        </div>
                      )}

                      {request.budget !==
                        null &&
                        request.budget_currency && (
                          <div>
                            <span className="cook-request-detail-symbol">
                              $
                            </span>

                            <span>
                              {t(
                                "cookRequests.budget",
                              )}
                            </span>

                            <strong>
                              {
                                request.budget
                              }{" "}
                              {
                                request.budget_currency
                              }
                            </strong>
                          </div>
                        )}
                    </div>

                    {request.message && (
                      <div className="cook-request-message">
                        <span>
                          {t(
                            "cookRequests.message",
                          )}
                        </span>

                        <p>
                          {
                            request.message
                          }
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "pending" && (
                      <div className="cook-request-actions">
                        <button
                          type="button"
                          className="cook-request-decline"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void changeStatus(
                              request.id,
                              "declined",
                            )
                          }
                        >
                          <X
                            size={17}
                          />

                          {t(
                            "cookRequests.actions.decline",
                          )}
                        </button>

                        <button
                          type="button"
                          className="cook-request-accept"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void changeStatus(
                              request.id,
                              "accepted",
                            )
                          }
                        >
                          <Check
                            size={17}
                          />

                          {busy
                            ? t(
                                "cookRequests.actions.updating",
                              )
                            : t(
                                "cookRequests.actions.accept",
                              )}
                        </button>
                      </div>
                    )}

                    {request.status ===
                      "accepted" && (
                      <div className="cook-request-actions">
                        <button
                          type="button"
                          className="cook-request-complete"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void changeStatus(
                              request.id,
                              "completed",
                            )
                          }
                        >
                          <CheckCircle2
                            size={17}
                          />

                          {busy
                            ? t(
                                "cookRequests.actions.updating",
                              )
                            : t(
                                "cookRequests.actions.complete",
                              )}
                        </button>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default CookRequestsPage;