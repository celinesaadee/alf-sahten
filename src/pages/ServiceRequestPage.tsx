import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
} from "lucide-react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Trans,
  useTranslation,
} from "react-i18next";

import { supabase } from "../lib/supabase";

import {
  getPublicCookService,
  type CookService,
} from "../services/cookServices";

import {
  createServiceRequest,
  type ServiceRequest,
} from "../services/serviceRequests";

import "./ServiceRequestPage.css";

type RequestForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDate: string;
  location: string;
  budget: string;
  budgetCurrency: string;
  message: string;
};

const emptyForm: RequestForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  requestedDate: "",
  location: "",
  budget: "",
  budgetCurrency: "USD",
  message: "",
};

function ServiceRequestPage() {
  const { t, i18n } = useTranslation();
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();

const requestedBackPath =
  searchParams.get("from");

const backToCook =
  requestedBackPath?.startsWith("/cooks/")
    ? requestedBackPath
    : "/discover";

  const [service, setService] =
    useState<CookService | null>(null);

  const [form, setForm] =
    useState<RequestForm>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [sentRequest, setSentRequest] =
    useState<ServiceRequest | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        if (!serviceId) {
          throw new Error(
            t("serviceRequest.errors.notFound"),
          );
        }

        const selectedService =
          await getPublicCookService(
            serviceId,
          );

        if (!selectedService) {
          throw new Error(
            t(
              "serviceRequest.errors.unavailable",
            ),
          );
        }

        setService(selectedService);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        let fullName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "";

        const { data: profile } =
          await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.full_name) {
          fullName = profile.full_name;
        }

        setForm((current) => ({
          ...current,
          customerName: fullName,
          customerEmail:
            user.email ?? "",
        }));
      } catch (err) {
  console.error(err);

  if (
    err instanceof Error &&
    (
      err.message ===
        t("serviceRequest.errors.notFound") ||
      err.message ===
        t("serviceRequest.errors.unavailable")
    )
  ) {
    setError(err.message);
  } else {
    setError(
      t(
        "serviceRequest.errors.load",
      ),
    );
  }
} finally {
  setLoading(false);
}
}

void loadPage();
}, [serviceId, t]);

  function updateField(
    field: keyof RequestForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

function getRequestErrorMessage(
  err: unknown,
) {
  if (!(err instanceof Error)) {
    return t(
      "serviceRequest.errors.send",
    );
  }

  const message =
    err.message.toLowerCase();

  if (
    message.includes(
      "requested date cannot be in the past",
    )
  ) {
    return t(
      "serviceRequest.errors.pastDate",
    );
  }

  if (
    message.includes(
      "this service is not available for requests",
    ) ||
    message.includes(
      "this service is not currently available",
    )
  ) {
    return t(
      "serviceRequest.errors.unavailable",
    );
  }

  if (
    message.includes(
      "you must be signed in to continue",
    ) ||
    message.includes(
      "authentication required",
    )
  ) {
    return t(
      "serviceRequest.errors.authentication",
    );
  }

  return t(
    "serviceRequest.errors.send",
  );
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!service) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      const request =
        await createServiceRequest({
          serviceId: service.id,
          customerName:
            form.customerName,
          customerEmail:
            form.customerEmail,
          customerPhone:
            form.customerPhone.trim() ||
            null,
          requestedDate:
            form.requestedDate,
          location: form.location,
          budget:
            form.budget.trim() === ""
              ? null
              : Number(form.budget),
          budgetCurrency:
            form.budget.trim() === ""
              ? null
              : form.budgetCurrency,
          message: form.message,
        });

      setSentRequest(request);
    } catch (err) {
      console.error(err);

      setError(
  getRequestErrorMessage(err),
);
    } finally {
      setSending(false);
    }
  }

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, "0"),
    String(now.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");

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

  if (loading) {
    return (
      <main className="service-request-page">
        <div className="profile-loading">
          <ChefHat size={28} />
        </div>
      </main>
    );
  }

  if (error && !service) {
    return (
      <main className="service-request-page">
        <div className="service-request-shell">
         
<Link
  to="/discover"
  className="service-request-back"
>
  <ArrowLeft size={18} />

  {t(
    "serviceRequest.back",
  )}
</Link>

          <div className="service-request-error-card">
            <h1>
              {t(
                "serviceRequest.serviceUnavailable",
              )}
            </h1>

            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return null;
  }

  if (sentRequest) {
    return (
      <main className="service-request-page">
        <div className="service-request-shell">
          <section className="service-request-success">
            <div className="service-request-success-icon">
              <CalendarDays
                size={28}
              />
            </div>

            <p className="eyebrow">
              {t(
                "serviceRequest.successKicker",
              )}
            </p>

            <h1>
              {t(
                "serviceRequest.successTitle",
              )}
            </h1>

            <p>
              <Trans
                i18nKey="serviceRequest.successMessage"
                values={{
                  service:
                    sentRequest.service_title,
                }}
                components={{
                  strong: <strong />,
                }}
              />
            </p>

            <div className="service-request-summary">
              <div>
                <span>
                  {t(
                    "serviceRequest.requestedDate",
                  )}
                </span>

                <strong>
                  {formatDate(
                    sentRequest.requested_date,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {t(
                    "serviceRequest.status",
                  )}
                </span>

                <strong>
                  {t(
                    "serviceRequest.pending",
                  )}
                </strong>
              </div>
            </div>

            <p className="service-request-success-note">
              {t(
                "serviceRequest.successPrivacy",
              )}
            </p>

            <Link
  to="/my-requests"
  className="primary-button"
>
  {t("serviceRequest.viewMyRequests")}
</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="service-request-page">
      <div className="service-request-shell">
        <Link
  to={backToCook}
  className="service-request-back"
>
  <ArrowLeft size={18} />

  {t(
    "serviceRequest.back",
  )}
</Link>

        <section className="service-request-layout">
          <aside className="service-request-service-card">
            {service.photo_url && (
              <img
                src={
                  service.photo_url
                }
                alt={service.title}
              />
            )}

            <div className="service-request-service-content">
              <p className="eyebrow">
                {t(
                  `cookServices.serviceTypes.${service.service_type}`,
                )}
              </p>

              <h2>
                {service.title}
              </h2>

              {service.description && (
                <p>
                  {
                    service.description
                  }
                </p>
              )}

              {service.starting_price !==
                null &&
                service.currency && (
                  <div className="service-request-price">
                    <span>
                      {t(
                        "serviceRequest.startingFrom",
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
                <div className="service-request-availability">
                  <span>
                    {t(
                      "serviceRequest.availability",
                    )}
                  </span>

                  <p>
                    {
                      service.availability_note
                    }
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section className="service-request-form-card">
            <div className="service-request-heading">
              <p className="eyebrow">
                {t(
                  "serviceRequest.kicker",
                )}
              </p>

              <h1>
                {t(
                  "serviceRequest.title",
                )}
              </h1>

              <p>
                {t(
                  "serviceRequest.subtitle",
                )}
              </p>
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <form
              className="service-request-form"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                <span>
                  {t(
                    "serviceRequest.name",
                  )}
                </span>

                <input
                  type="text"
                  value={
                    form.customerName
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "customerName",
                      event.target
                        .value,
                    )
                  }
                  maxLength={120}
                  required
                />
              </label>

              <label>
                <span>
                  {t(
                    "serviceRequest.email",
                  )}
                </span>

                <input
                  type="email"
                  value={
                    form.customerEmail
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "customerEmail",
                      event.target
                        .value,
                    )
                  }
                  maxLength={254}
                  required
                />
              </label>

              <label>
                <span>
                  {t(
                    "serviceRequest.phone",
                  )}{" "}
                  <small>
                    {t(
                      "serviceRequest.optional",
                    )}
                  </small>
                </span>

                <input
                  type="tel"
                  value={
                    form.customerPhone
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "customerPhone",
                      event.target
                        .value,
                    )
                  }
                  maxLength={40}
                  placeholder="+961..."
                />
              </label>

              <label>
                <span>
                  {t(
                    "serviceRequest.requestedDate",
                  )}
                </span>

                <input
                  type="date"
                  value={
                    form.requestedDate
                  }
                  min={today}
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "requestedDate",
                      event.target
                        .value,
                    )
                  }
                  required
                />
              </label>

              <label className="service-request-full">
                <span>
                  {t(
                    "serviceRequest.location",
                  )}
                </span>

                <input
                  type="text"
                  value={
                    form.location
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "location",
                      event.target
                        .value,
                    )
                  }
                  maxLength={250}
                  placeholder={t(
                    "serviceRequest.locationPlaceholder",
                  )}
                  required
                />
              </label>

              <label>
                <span>
                  {t(
                    "serviceRequest.budget",
                  )}{" "}
                  <small>
                    {t(
                      "serviceRequest.optional",
                    )}
                  </small>
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.budget
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "budget",
                      event.target
                        .value,
                    )
                  }
                  placeholder={t(
                    "serviceRequest.budgetPlaceholder",
                  )}
                />
              </label>

              <label>
                <span>
                  {t(
                    "serviceRequest.currency",
                  )}
                </span>

                <select
                  value={
                    form.budgetCurrency
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "budgetCurrency",
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    form.budget.trim() ===
                    ""
                  }
                >
                  <option value="USD">
                    USD
                  </option>

                  <option value="LBP">
                    LBP
                  </option>

                  <option value="EUR">
                    EUR
                  </option>
                </select>
              </label>

              <label className="service-request-full">
                <span>
                  {t(
                    "serviceRequest.message",
                  )}{" "}
                  <small>
                    {t(
                      "serviceRequest.optional",
                    )}
                  </small>
                </span>

                <textarea
                  value={
                    form.message
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "message",
                      event.target
                        .value,
                    )
                  }
                  maxLength={1500}
                  rows={6}
                  placeholder={t(
                    "serviceRequest.messagePlaceholder",
                  )}
                />

                <small className="service-request-character-count">
                  {
                    form.message
                      .length
                  }
                  /1500
                </small>
              </label>

              <div className="service-request-privacy service-request-full">
                <strong>
                  {t(
                    "serviceRequest.privacyTitle",
                  )}
                </strong>

                <p>
                  {t(
                    "serviceRequest.privacyText",
                  )}
                </p>
              </div>

              <div className="service-request-actions service-request-full">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    sending
                  }
                >
                  {sending
                    ? t(
                        "serviceRequest.sending",
                      )
                    : t(
                        "serviceRequest.sendRequest",
                      )}
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

export default ServiceRequestPage;