import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import "./CookingMode.css";
import IngredientHighlights, { type IngredientAmount } from "./IngredientHighlights";

type Props = { title: string; steps: string[]; ingredients: IngredientAmount[] };
function CookingDialog({ title, steps, ingredients, onExit, returnFocus }: Props & { onExit: () => void; returnFocus: RefObject<HTMLButtonElement | null> }) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [keepAwake, setKeepAwake] = useState(false);
  const [wakeStatus, setWakeStatus] = useState<"active" | "released" | "failed">("released");
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator && window.isSecureContext;
  useEffect(() => {
    const node = dialog.current!;
    const opener = returnFocus.current;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => { node.close(); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, [returnFocus]);
  useEffect(() => {
    if (!keepAwake || !supported) return;
    let disposed = false;
    let pending = false;
    let lock: WakeLockSentinel | null = null;
    async function acquire() {
      if (disposed || pending || lock || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (disposed || document.visibilityState !== "visible") {
          await sentinel.release(); return;
        }
        lock = sentinel;
        setWakeStatus("active");
        sentinel.addEventListener("release", () => {
          if (lock === sentinel) {
            lock = null;
            if (!disposed) setWakeStatus("released");
          }
        });
      } catch { if (!disposed) setWakeStatus("failed"); }
      finally { pending = false; }
    }
    const visibility = () => { if (document.visibilityState === "visible") void acquire(); };
    document.addEventListener("visibilitychange", visibility);
    void acquire();
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      if (lock) void lock.release().catch(() => {});
    };
  }, [keepAwake, supported]);
  const last = step === steps.length - 1;
  return <dialog ref={dialog} className="cooking-dialog" aria-labelledby="cooking-title" onCancel={event => { event.preventDefault(); onExit(); }}>
    <header>
      <div><p>{t("cookingMode.heading")}</p><h2 id="cooking-title" dir="auto">{title}</h2></div>
      <button type="button" onClick={onExit}>{t("cookingMode.exit")}</button>
    </header>
    <div className="cooking-progress" aria-live="polite">
      {t("cookingMode.step", { current: step + 1, total: steps.length })}
      <progress max={steps.length} value={step + 1} aria-label={t("cookingMode.progress")} />
    </div>
    <p className="cooking-step-text" dir="auto" aria-live="polite"><IngredientHighlights text={steps[step]} ingredients={ingredients} /></p>
    <nav aria-label={t("cookingMode.navigation")}>
      <button type="button" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>{t("cookingMode.previous")}</button>
      <button type="button" onClick={() => last ? onExit() : setStep(value => Math.min(steps.length - 1, value + 1))}>
        {t(last ? "cookingMode.finish" : "cookingMode.next")}
      </button>
    </nav>
    <footer>
      <label><input type="checkbox" disabled={!supported} checked={keepAwake} onChange={event => setKeepAwake(event.target.checked)} />{t("cookingMode.keepAwake")}</label>
      <p role="status">{t(!supported ? "cookingMode.unsupported" : !keepAwake ? "cookingMode.off" : `cookingMode.${wakeStatus}`)}</p>
    </footer>
  </dialog>;
}

export default function CookingMode(props: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const startButton = useRef<HTMLButtonElement>(null);
  if (props.steps.length === 0) return null;
  return <>
    <button ref={startButton} type="button" className="cooking-mode-start" onClick={() => setOpen(true)}>{t("cookingMode.start")}</button>
    {open && <CookingDialog {...props} returnFocus={startButton} onExit={() => setOpen(false)} />}
  </>;
}
