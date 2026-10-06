import { useEffect, useRef, useState } from "react";
import { ImagePlus, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { uploadRecipeImage } from "../services/recipes";
import { saveCookPhoto } from "../services/cooks";
import { normalizeProfileUrl } from "../lib/cookProfile";
import { photoCrop } from "../lib/photoCrop";
import "./CookProfileExtras.css";

type ImageField = "profile" | "cover";
type Draft = { field: ImageField; image: HTMLImageElement; url: string };
export default function ProfileImagesEditor({ profileUrl, coverUrl, onChange, onBusyChange, uploadsEnabled, disabled }: {
  profileUrl: string; coverUrl: string; onChange: (field: ImageField, url: string) => void;
  onBusyChange: (busy: boolean) => void; uploadsEnabled: boolean; disabled: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, zoom: 1 });
  const [error, setError] = useState("");
  const lock = useRef(false);
  const objectUrl = useRef<string | null>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);
  async function prepare(field: ImageField, url: string) {
    if (lock.current || draft) return;
    lock.current = true; setBusy(true); setError(""); onBusyChange(true);
    try {
      const image = new Image(); image.crossOrigin = "anonymous"; image.src = url;
      await image.decode();
      setPosition({ x: 0, y: 0, zoom: 1 }); setDraft({ field, image, url });
    } catch { setError(t("cookProfileExtras.imageError")); onBusyChange(false); }
    finally { lock.current = false; setBusy(false); }
  }
  function select(field: ImageField, input: HTMLInputElement) {
    const file = input.files?.[0]; input.value = "";
    if (!file || lock.current || draft) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(t("cookProfileExtras.imageInvalid")); return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    void prepare(field, objectUrl.current);
  }
  function close() {
    setDraft(null); onBusyChange(false);
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; }
  }
  async function apply() {
    if (!draft || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const crop = photoCrop(draft.image.naturalWidth, draft.image.naturalHeight, draft.field === "profile" ? 1 : 3, position);
      const canvas = document.createElement("canvas");
      canvas.width = draft.field === "profile" ? 600 : 1400; canvas.height = Math.round(canvas.width / crop.aspect);
      const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable");
      context.drawImage(draft.image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image unavailable")), "image/webp", 0.9));
      const url = await uploadRecipeImage(new File([blob], `${draft.field}-photo.webp`, { type: "image/webp" }));
      await saveCookPhoto(draft.field, url);
      onChange(draft.field, url);
      close();
    } catch { setError(t("cookProfileExtras.imageError")); }
    finally { lock.current = false; setBusy(false); }
  }
  const crop = draft ? photoCrop(draft.image.naturalWidth, draft.image.naturalHeight, draft.field === "profile" ? 1 : 3, position) : null;
  return <fieldset className="profile-images-editor" disabled={disabled || busy}>
    <legend>{t("cookProfileExtras.profileAppearance")}</legend>
    <p>{t("cookProfileExtras.photoHelp")}</p>
    <div className="profile-images-grid">
      {(["profile", "cover"] as const).map(field => {
        const safeUrl = normalizeProfileUrl(field === "profile" ? profileUrl : coverUrl, "photo");
        return <div className={`profile-image-card profile-image-card-${field}`} key={field}>
          <h3>{t(`cookProfileExtras.${field}Photo`)}</h3>
          <div className="profile-image-preview">{safeUrl ? <img src={safeUrl} alt={t(`cookProfileExtras.${field}Photo`)} /> : <UserRound size={30} aria-hidden="true" />}</div>
          {uploadsEnabled && <label className="profile-image-upload"><ImagePlus size={17} aria-hidden="true" /><span>{t(busy ? "cookProfileExtras.uploading" : "cookProfileExtras.uploadPhoto")}</span><input disabled={!!draft} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t(`cookProfileExtras.${field}Photo`)} onChange={event => select(field, event.currentTarget)} /></label>}
          {uploadsEnabled && safeUrl && <button disabled={!!draft} type="button" className="profile-image-action" onClick={() => void prepare(field, safeUrl)}>{t("cookProfileExtras.adjustPhoto")}</button>}
        </div>;
      })}
    </div>
    {draft && crop && <div className="profile-photo-cropper">
      <h3>{t(`cookProfileExtras.${draft.field}Photo`)}</h3>
      <p>{t("cookProfileExtras.cropHelp")}</p>
      <div className={`profile-photo-crop profile-photo-crop-${draft.field}`} style={{ aspectRatio: crop.aspect }}
        onPointerDown={event => { if (busy || disabled) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, startX: position.x, startY: position.y }; }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onPointerMove={event => {
          const start = drag.current; if (!start) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const overflowX = (draft.image.naturalWidth / crop.width - 1) * bounds.width;
          const overflowY = (draft.image.naturalHeight / crop.height - 1) * bounds.height;
          setPosition(current => ({ ...current,
            x: overflowX > 0 ? Math.max(-1, Math.min(1, start.startX - 2 * (event.clientX - start.x) / overflowX)) : 0,
            y: overflowY > 0 ? Math.max(-1, Math.min(1, start.startY - 2 * (event.clientY - start.y) / overflowY)) : 0 }));
        }}>
        <img src={draft.url} alt={t(`cookProfileExtras.${draft.field}Photo`)} draggable={false} style={{ width: `${draft.image.naturalWidth / crop.width * 100}%`, height: `${draft.image.naturalHeight / crop.height * 100}%`, left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%` }} />
      </div>
      {(["zoom", "x", "y"] as const).map(key => <label className="profile-photo-slider" key={key}><span>{t(`cookProfileExtras.${key}`)}</span><input type="range" dir="ltr" min={key === "zoom" ? 1 : -1} max={key === "zoom" ? 4 : 1} step="0.01" value={position[key]} onChange={event => setPosition(current => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}
      <button className="profile-image-action" type="button" onClick={() => void apply()}>{t(busy ? "cookProfileExtras.uploading" : "cookProfileExtras.applyPhoto")}</button>
      <button className="profile-image-action" type="button" onClick={close}>{t("cookProfileExtras.cancelPhoto")}</button>
    </div>}
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
