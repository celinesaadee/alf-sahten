import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChefHat,
  Clock3,
  MapPin,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  cancelMyServiceRequest,
  getMyServiceRequests,
  type ServiceRequest,
  type ServiceRequestStatus,
} from "../services/serviceRequests";

import "./MyServiceRequestsPage.css";

type RequestFilter =
  | "all"
  | ServiceRequestStatus;

function MyServiceRequestsPage() {
  const { t, i18n } =
    useTranslation();

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
          await getMyServiceRequests();

        if (cancelled) {
          return;
        }

        setRequests(data);
      } catch (err) {
        console.error(
          "Could not load my service requests:",
          err,
        );

        if (!cancelled) {
          setError(
            t(
              "myServiceRequests.errors.load",
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
      `myServiceRequests.statuses.${status}`,
    );
  }

  async function handleCancel(
    request: ServiceRequest,
  ) {
    const confirmed =
      window.confirm(
        t(
          "myServiceRequests.cancelConfirm",
          {
            service:
              request.service_title,
          },
        ),
      );

    if (!confirmed) {
      return;
    }

    try {
      setBusyRequestId(
        request.id,
      );

      setError("");

      const updated =
        await cancelMyServiceRequest(
          request.id,
        );

      setRequests(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );
    } catch (err) {
      console.error(
        "Could not cancel service request:",
        err,
      );

      setError(
        t(
          "myServiceRequests.errors.cancel",
        ),
      );
    } finally {
      setBusyRequestId(null);
    }
  }

  const filters: {
    value: RequestFilter;
    label: string;
  }[] = [
    {
      value: "all",
      label: t(
        "myServiceRequests.filters.all",
      ),
    },
    {
      value: "pending",
      label: t(
        "myServiceRequests.filters.pending",
      ),
    },
    {
      value: "accepted",
      label: t(
        "myServiceRequests.filters.accepted",
      ),
    },
    {
      value: "completed",
      label: t(
        "myServiceRequests.filters.completed",
      ),
    },
    {
      value: "declined",
      label: t(
        "myServiceRequests.filters.declined",
      ),
    },
    {
      value: "cancelled",
      label: t(
        "myServiceRequests.filters.cancelled",
      ),
    },
  ];

  return (
    <main className="my-service-requests-page">
      <div className="my-service-requests-shell">
        <header className="my-service-requests-header">
          <div>
            <p className="section-kicker">
              {t(
                "myServiceRequests.eyebrow",
              )}
            </p>

            <h1>
              {t(
                "myServiceRequests.title",
              )}
            </h1>

            <p>
              {t(
                "myServiceRequests.subtitle",
              )}
            </p>
          </div>
        </header>

        <div className="my-service-requests-filters">
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
          <section className="my-service-requests-empty">
            <ChefHat
              size={38}
              strokeWidth={1.4}
            />

            <h2>
              {activeFilter ===
              "all"
                ? t(
                    "myServiceRequests.empty.title",
                  )
                : t(
                    "myServiceRequests.empty.filteredTitle",
                  )}
            </h2>

            <p>
              {activeFilter ===
              "all"
                ? t(
                    "myServiceRequests.empty.text",
                  )
                : t(
                    "myServiceRequests.empty.filteredText",
                  )}
            </p>

            {activeFilter ===
              "all" && (
              <Link
                to="/discover"
                className="primary-button"
              >
                {t(
                  "myServiceRequests.empty.discover",
                )}
              </Link>
            )}
          </section>
        ) : (
          <div className="my-service-requests-list">
            {filteredRequests.map(
              (request) => {
                const canCancel =
                  request.status ===
                    "pending" ||
                  request.status ===
                    "accepted";

                const busy =
                  busyRequestId ===
                  request.id;

                return (
                  <article
                    key={
                      request.id
                    }
                    className="my-service-request-card"
                  >
                    <div className="my-service-request-top">
                      <div>
                        <p className="section-kicker">
                          {t(
                            "myServiceRequests.service",
                          )}
                        </p>

                        <h2>
                          {
                            request.service_title
                          }
                        </h2>

                        <span className="my-service-request-created">
                          {t(
                            "myServiceRequests.sentOn",
                            {
                              date: formatCreatedAt(
                                request.created_at,
                              ),
                            },
                          )}
                        </span>
                      </div>

                      <span
                        className={`my-service-request-status my-service-request-status-${request.status}`}
                      >
                        {statusLabel(
                          request.status,
                        )}
                      </span>
                    </div>

                    <div className="my-service-request-details">
                      <div>
                        <CalendarDays
                          size={17}
                        />

                        <span>
                          {t(
                            "myServiceRequests.requestedDate",
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
                            "myServiceRequests.location",
                          )}
                        </span>

                        <strong>
                          {
                            request.location
                          }
                        </strong>
                      </div>

                      {request.budget !==
                        null &&
                        request.budget_currency && (
                          <div>
                            <span className="my-service-request-symbol">
                              $
                            </span>

                            <span>
                              {t(
                                "myServiceRequests.budget",
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
                      <div className="my-service-request-message">
                        <span>
                          {t(
                            "myServiceRequests.message",
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
                      <div className="my-service-request-note">
                        <Clock3
                          size={17}
                        />

                        <p>
                          {t(
                            "myServiceRequests.notes.pending",
                          )}
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "accepted" && (
                      <div className="my-service-request-note accepted">
                        <p>
                          {t(
                            "myServiceRequests.notes.accepted",
                          )}
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "declined" && (
                      <div className="my-service-request-note declined">
                        <p>
                          {t(
                            "myServiceRequests.notes.declined",
                          )}
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "completed" && (
                      <div className="my-service-request-note completed">
                        <p>
                          {t(
                            "myServiceRequests.notes.completed",
                          )}
                        </p>
                      </div>
                    )}

                    {request.status ===
                      "cancelled" && (
                      <div className="my-service-request-note cancelled">
                        <p>
                          {t(
                            "myServiceRequests.notes.cancelled",
                          )}
                        </p>
                      </div>
                    )}

                    {canCancel && (
                      <div className="my-service-request-actions">
                        <button
                          type="button"
                          className="my-service-request-cancel"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void handleCancel(
                              request,
                            )
                          }
                        >
                          <X
                            size={17}
                          />

                          {busy
                            ? t(
                                "myServiceRequests.cancelling",
                              )
                            : t(
                                "myServiceRequests.cancel",
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

export default MyServiceRequestsPage;