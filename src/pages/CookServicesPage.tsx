import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import CookDashboardNav from "../components/CookDashboardNav";

import {
  archiveCookService,
  createCookService,
  getMyCookServices,
  serviceTypes,
  updateCookService,
  type CookService,
  type CookServiceInput,
  type ServiceStatus,
  type ServiceType,
} from "../services/cookServices";

import { supabase } from "../lib/supabase";

const emptyForm: CookServiceInput = {
  service_type: "homemade_food",
  title: "",
  description: "",
  starting_price: null,
  currency: null,
  photo_url: null,
  status: "draft",
  availability_note: "",
};

function getServicePhotoPath(
  publicUrl: string | null,
) {
  if (!publicUrl) {
    return null;
  }

  const marker =
    "/storage/v1/object/public/service-photos/";

  const markerIndex =
    publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const path = publicUrl
    .slice(markerIndex + marker.length)
    .split("?")[0];

  return decodeURIComponent(path);
}

async function compressServicePhoto(
  file: File,
): Promise<File> {
  const objectUrl =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img = new Image();

          img.onload = () =>
            resolve(img);

          img.onerror = () =>
            reject(
              new Error(
                "Could not read this image.",
              ),
            );

          img.src = objectUrl;
        },
      );

    const maxDimension = 1600;

    const scale = Math.min(
      1,
      maxDimension /
        Math.max(
          image.naturalWidth,
          image.naturalHeight,
        ),
    );

    const width = Math.max(
      1,
      Math.round(
        image.naturalWidth * scale,
      ),
    );

    const height = Math.max(
      1,
      Math.round(
        image.naturalHeight * scale,
      ),
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Could not process this image.",
      );
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    );

    let quality = 0.82;

    async function makeBlob() {
      return new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(
                  new Error(
                    "Could not compress this image.",
                  ),
                );
              }
            },
            "image/webp",
            quality,
          );
        },
      );
    }

    let blob = await makeBlob();

    while (
      blob.size > 1_800_000 &&
      quality > 0.5
    ) {
      quality -= 0.1;
      blob = await makeBlob();
    }

    return new File(
      [blob],
      "service-photo.webp",
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function CookServicesPage() {
  const { t, i18n } = useTranslation();

  const [services, setServices] = useState<CookService[]>([]);
  const [form, setForm] =
    useState<CookServiceInput>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

const pendingPhotoPathRef =
  useRef<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyCookServices();
      setServices(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("cookServices.messages.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  function updateField<K extends keyof CookServiceInput>(
    key: K,
    value: CookServiceInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function deletePendingPhoto() {

  const pendingPath =
    pendingPhotoPathRef.current;

  if (!pendingPath) {
    return;
  }

  const { error: removeError } =
    await supabase.storage
      .from("service-photos")
      .remove([pendingPath]);

  if (removeError) {
    console.error(
      "Could not delete temporary service photo:",
      removeError,
    );

    return;
  }

  if (
    pendingPhotoPathRef.current ===
    pendingPath
  ) {
    pendingPhotoPathRef.current = null;
  }
}

async function handleRemovePhoto() {
  await deletePendingPhoto();

  updateField("photo_url", null);
}

async function resetForm() {
  await deletePendingPhoto();

  setForm(emptyForm);
  setEditingId(null);
  setError("");
  setSuccess("");
}

  function startEditing(service: CookService) {
    setEditingId(service.id);

    setForm({
      service_type: service.service_type,
      title: service.title,
      description: service.description,
      starting_price: service.starting_price,
      currency: service.currency,
      photo_url: service.photo_url,
      status: service.status,
      availability_note: service.availability_note,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

async function handlePhotoUpload(
  event: React.ChangeEvent<HTMLInputElement>,
) {
  const file = event.target.files?.[0];

  if (!file) return;

  try {
    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      throw new Error(
        t("cookServices.messages.signInUpload"),
      );
    }

    /*
     * Keep the current temporary photo until the
     * replacement has uploaded successfully.
     */
    const previousPendingPath =
      pendingPhotoPathRef.current;

    const compressedFile =
      await compressServicePhoto(file);

    const fileName =
      `${crypto.randomUUID()}.webp`;

    const filePath =
      `${user.id}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("service-photos")
        .upload(
          filePath,
          compressedFile,
          {
            cacheControl: "3600",
            contentType:
              compressedFile.type,
            upsert: false,
          },
        );

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("service-photos")
      .getPublicUrl(filePath);

    /*
     * The replacement is now safely uploaded.
     * Remove the previous temporary upload.
     */
    if (previousPendingPath) {
      const { error: removeError } =
        await supabase.storage
          .from("service-photos")
          .remove([previousPendingPath]);

      if (removeError) {
        console.error(
          "Could not delete previous temporary service photo:",
          removeError,
        );
      }
    }

    pendingPhotoPathRef.current =
      filePath;

    updateField(
      "photo_url",
      data.publicUrl,
    );

    setSuccess(
      t("cookServices.messages.photoUploaded"),
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : t(
            "cookServices.messages.uploadError",
          ),
    );
  } finally {
    setUploadingPhoto(false);
    event.target.value = "";
  }
}

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const wasEditing = Boolean(editingId);

const previousPhotoUrl = editingId
  ? services.find(
      (service) =>
        service.id === editingId,
    )?.photo_url ?? null
  : null;

const savedService = editingId
  ? await updateCookService(editingId, form)
  : await createCookService(form);

  pendingPhotoPathRef.current = null;

  if (
  editingId &&
  previousPhotoUrl &&
  previousPhotoUrl !==
    savedService.photo_url
) {
  const oldPhotoPath =
    getServicePhotoPath(
      previousPhotoUrl,
    );

  if (oldPhotoPath) {
    const { error: removeError } =
      await supabase.storage
        .from("service-photos")
        .remove([oldPhotoPath]);

    if (removeError) {
      console.error(
        "Could not delete old service photo:",
        removeError,
      );
    }
  }
}

      setServices((current) => {
        if (editingId) {
          return current.map((service) =>
            service.id === savedService.id
              ? savedService
              : service,
          );
        }

        return [savedService, ...current];
      });

      setSuccess(
        wasEditing
          ? t("cookServices.messages.serviceUpdated")
          : t("cookServices.messages.serviceCreated"),
      );

      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("cookServices.messages.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      setError("");
      setSuccess("");

      const updated = await archiveCookService(id);

      setServices((current) =>
        current.map((service) =>
          service.id === updated.id ? updated : service,
        ),
      );

   if (editingId === id) {
  await resetForm();
}

      setSuccess(
        t("cookServices.messages.serviceArchived"),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("cookServices.messages.archiveError"),
      );
    }
  }

  async function handleRestore(service: CookService) {
    try {
      setError("");
      setSuccess("");

      const updated = await updateCookService(
        service.id,
        {
          service_type: service.service_type,
          title: service.title,
          description: service.description,
          starting_price: service.starting_price,
          currency: service.currency,
          photo_url: service.photo_url,
          status: "draft",
          availability_note:
            service.availability_note,
        },
      );

      setServices((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setSuccess(
        t("cookServices.messages.serviceRestored"),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("cookServices.messages.restoreError"),
      );
    }
  }

  function getServiceTypeLabel(type: ServiceType) {
    return t(`cookServices.serviceTypes.${type}`);
  }

  function getStatusLabel(status: ServiceStatus) {
    return t(`cookServices.statuses.${status}`);
  }

  if (loading) {
    return (
      <main className="cook-services-page">
        <div className="cook-services-shell">
          <p>
            {t("cookServices.messages.loading")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="cook-services-page">
      <div className="cook-services-shell">
        <CookDashboardNav />

        <section className="cook-services-header">
          <div>
            <p className="cook-services-eyebrow">
              {t("cookServices.eyebrow")}
            </p>

            <h1>{t("cookServices.title")}</h1>

            <p className="cook-services-intro">
              {t("cookServices.intro")}
            </p>
          </div>
        </section>

        {error && (
          <div className="cook-services-message cook-services-error">
            {error}
          </div>
        )}

        {success && (
          <div className="cook-services-message cook-services-success">
            {success}
          </div>
        )}

        <section className="cook-services-editor">
          <div className="cook-services-editor-heading">
            <div>
              <p className="cook-services-section-label">
                {editingId
                  ? t("cookServices.editService")
                  : t("cookServices.newService")}
              </p>

              <h2>
                {editingId
                  ? t("cookServices.updateOffer")
                  : t("cookServices.addOffer")}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="cook-services-secondary-button"
                onClick={resetForm}
              >
                {t("cookServices.cancelEditing")}
              </button>
            )}
          </div>

          <form
            className="cook-services-form"
            onSubmit={handleSubmit}
          >
            <label className="cook-services-field">
              <span>
                {t("cookServices.serviceType")}
              </span>

              <select
                value={form.service_type}
                onChange={(event) =>
                  updateField(
                    "service_type",
                    event.target.value as ServiceType,
                  )
                }
              >
                {Object.keys(serviceTypes).map(
                  (value) => (
                    <option key={value} value={value}>
                      {getServiceTypeLabel(
                        value as ServiceType,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="cook-services-field">
              <span>
                {t("cookServices.titleLabel")}
              </span>

              <input
                type="text"
                value={form.title}
                maxLength={100}
                placeholder={t(
                  "cookServices.titlePlaceholder",
                )}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="cook-services-field cook-services-field-full">
              <span>
                {t("cookServices.description")}
              </span>

              <textarea
                value={form.description}
                maxLength={1000}
                rows={5}
                placeholder={t(
                  "cookServices.descriptionPlaceholder",
                )}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
              />

              <small>
                {form.description.length}/1000
              </small>
            </label>

            <label className="cook-services-field">
              <span>
                {t("cookServices.startingPrice")}
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.starting_price ?? ""}
                placeholder={t(
                  "cookServices.optional",
                )}
                onChange={(event) => {
                  const value = event.target.value;

                  updateField(
                    "starting_price",
                    value === ""
                      ? null
                      : Number(value),
                  );

                  if (
                    value !== "" &&
                    form.currency === null
                  ) {
                    updateField(
                      "currency",
                      "USD",
                    );
                  }

                  if (value === "") {
                    updateField(
                      "currency",
                      null,
                    );
                  }
                }}
              />
            </label>

            <label className="cook-services-field">
              <span>
                {t("cookServices.currency")}
              </span>

              <select
                value={form.currency ?? ""}
                disabled={
                  form.starting_price === null
                }
                onChange={(event) =>
                  updateField(
                    "currency",
                    event.target.value || null,
                  )
                }
              >
                <option value="">
                  {t(
                    "cookServices.chooseCurrency",
                  )}
                </option>

                <option value="USD">USD</option>
                <option value="LBP">LBP</option>
              </select>
            </label>

            <label className="cook-services-field cook-services-field-full">
              <span>
                {t("cookServices.availability")}
              </span>

              <input
                type="text"
                maxLength={250}
                value={form.availability_note}
                placeholder={t(
                  "cookServices.availabilityPlaceholder",
                )}
                onChange={(event) =>
                  updateField(
                    "availability_note",
                    event.target.value,
                  )
                }
              />

              <small>
                {form.availability_note.length}/250
              </small>
            </label>

            <label className="cook-services-field">
              <span>
                {t("cookServices.status")}
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as ServiceStatus,
                  )
                }
              >
                <option value="draft">
                  {t(
                    "cookServices.statuses.draft",
                  )}
                </option>

                <option value="available">
                  {t(
                    "cookServices.statuses.available",
                  )}
                </option>

                <option value="paused">
                  {t(
                    "cookServices.statuses.paused",
                  )}
                </option>

                {editingId && (
                  <option value="archived">
                    {t(
                      "cookServices.statuses.archived",
                    )}
                  </option>
                )}
              </select>
            </label>

            <div className="cook-services-field">
              <span>
                {t("cookServices.photo")}
              </span>

              <label className="cook-services-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />

                <span>
                  {uploadingPhoto
                    ? t(
                        "cookServices.uploading",
                      )
                    : form.photo_url
                      ? t(
                          "cookServices.changePhoto",
                        )
                      : t(
                          "cookServices.uploadPhoto",
                        )}
                </span>
              </label>
            </div>

            {form.photo_url && (
              <div className="cook-services-photo-preview">
                <img
                  src={form.photo_url}
                  alt={form.title}
                />

                <button
  type="button"
  onClick={() =>
    void handleRemovePhoto()
  }
>
  {t(
    "cookServices.removePhoto",
  )}
</button>
              </div>
            )}

            <div className="cook-services-form-actions">
              <button
                type="submit"
                className="cook-services-primary-button"
                disabled={
                  saving || uploadingPhoto
                }
              >
                {saving
                  ? t("cookServices.saving")
                  : editingId
                    ? t(
                        "cookServices.saveChanges",
                      )
                    : t(
                        "cookServices.addService",
                      )}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cook-services-secondary-button"
                  onClick={resetForm}
                >
                  {t("cookServices.cancel")}
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="cook-services-list-section">
          <div className="cook-services-list-heading">
            <div>
              <p className="cook-services-section-label">
                {t("cookServices.yourServices")}
              </p>

              <h2>
                {services.length === 0
                  ? t("cookServices.noServices")
                  : services.length === 1
                    ? t("cookServices.oneService")
                    : t(
                        "cookServices.serviceCount",
                        {
                          count:
                            services.length,
                        },
                      )}
              </h2>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="cook-services-empty">
              <h3>
                {t("cookServices.emptyTitle")}
              </h3>

              <p>
                {t("cookServices.emptyText")}
              </p>
            </div>
          ) : (
            <div className="cook-services-grid">
              {services.map((service) => (
                <article
                  key={service.id}
                  className={`cook-service-card ${
                    service.status === "archived"
                      ? "cook-service-card-archived"
                      : ""
                  }`}
                >
                  {service.photo_url && (
                    <div className="cook-service-card-image">
                      <img
                        src={service.photo_url}
                        alt={service.title}
                      />
                    </div>
                  )}

                  <div className="cook-service-card-body">
                    <div className="cook-service-card-top">
                      <span className="cook-service-type">
                        {getServiceTypeLabel(
                          service.service_type,
                        )}
                      </span>

                      <span
                        className={`cook-service-status cook-service-status-${service.status}`}
                      >
                        {getStatusLabel(
                          service.status,
                        )}
                      </span>
                    </div>

                    <h3>{service.title}</h3>

                    {service.description && (
                      <p>
                        {service.description}
                      </p>
                    )}

                    {service.starting_price !==
                      null &&
                      service.currency && (
                        <strong className="cook-service-price">
                          {t(
                            "cookServices.from",
                          )}{" "}
                          {service.starting_price.toLocaleString(
                            i18n.language,
                          )}{" "}
                          {service.currency}
                        </strong>
                      )}

                    {service.availability_note && (
                      <p className="cook-service-availability">
                        {
                          service.availability_note
                        }
                      </p>
                    )}

                    <div className="cook-service-card-actions">
                      {service.status !==
                      "archived" ? (
                        <>
                          <button
                            type="button"
                            className="cook-services-secondary-button"
                            onClick={() =>
                              startEditing(
                                service,
                              )
                            }
                          >
                            {t(
                              "cookServices.edit",
                            )}
                          </button>

                          <button
                            type="button"
                            className="cook-services-text-button"
                            onClick={() =>
                              void handleArchive(
                                service.id,
                              )
                            }
                          >
                            {t(
                              "cookServices.archive",
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="cook-services-secondary-button"
                          onClick={() =>
                            void handleRestore(
                              service,
                            )
                          }
                        >
                          {t(
                            "cookServices.restore",
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default CookServicesPage;