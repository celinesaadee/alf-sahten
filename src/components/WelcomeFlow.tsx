import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Check, ChefHat, Compass, Leaf, Salad, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { finishWelcome, hasFinishedWelcome, welcomeDestination, type CookingGoal } from "../lib/onboarding";
import "./WelcomeFlow.css";

export default function WelcomeFlow({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [finished, setFinished] = useState(() => {
    try { return hasFinishedWelcome(localStorage); } catch { return false; }
  });
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<CookingGoal | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const replay = location.pathname === "/welcome";
  const visible = !loading && (replay || (!user && !finished && location.pathname === "/"));
  useEffect(() => {
    if (visible) {
      title.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [step, visible]);

  function complete(destination = "/discover") {
    try { finishWelcome(localStorage, goal); } catch { /* Continue even if browser storage is blocked. */ }
    setFinished(true);
    navigate(destination);
  }
  if (loading && (replay || (!finished && location.pathname === "/"))) {
    return <main className="welcome-flow" aria-busy="true"><img src="/alf-sahten-logo.png" width="124" height="60" alt="Alf Sahten" /></main>;
  }
  if (!visible) return children;

  const goals = [
    { id: "pantry", Icon: Leaf }, { id: "quick", Icon: ChefHat },
    { id: "explore", Icon: Compass }, { id: "save", Icon: Bookmark },
  ] as const;
  const destinations = [
    { id: "kitchen", route: "/kitchen", Icon: ChefHat },
    { id: "discover", route: "/discover", Icon: Compass },
    { id: "saved", route: "/saved", Icon: Bookmark },
  ].sort((a, b) => Number(b.route === welcomeDestination(goal)) - Number(a.route === welcomeDestination(goal)));

  return <main className="welcome-flow">
    <header className="welcome-header">
      <img src="/alf-sahten-logo.png" alt="Alf Sahten" width="124" height="60" />
      <div>
        <select aria-label={t("onboarding.language")} value={i18n.resolvedLanguage?.split("-")[0] ?? "en"} onChange={event => void i18n.changeLanguage(event.target.value)}>
          <option value="en">EN</option><option value="fr">FR</option><option value="ar">AR</option>
        </select>
        <button type="button" className="welcome-text-button" onClick={() => complete()}>{t("onboarding.skip")}</button>
      </div>
    </header>
    <div className="welcome-layout">
      <aside className="welcome-art" aria-hidden="true">
        <span className="welcome-ingredient welcome-tomato" />
        <span className="welcome-ingredient welcome-lemon" />
        <span className="welcome-ingredient welcome-leaf" />
        <div className="welcome-plate"><Salad size={112} strokeWidth={1.1} /></div>
        <span className="welcome-chip welcome-chip-one"><Leaf size={19} />{t("onboarding.pantryChip")}</span>
        <span className="welcome-chip welcome-chip-two"><Sparkles size={19} />{t("onboarding.inspirationChip")}</span>
        <span className="welcome-chip welcome-chip-three"><Bookmark size={19} />{t("onboarding.favouritesChip")}</span>
      </aside>
      <section className="welcome-content">
        <div className="welcome-progress-row">
          {step > 0 && <button type="button" className="welcome-back" aria-label={t("onboarding.back")} onClick={() => setStep(step - 1)}><ArrowLeft size={20} /></button>}
          <span>{t("onboarding.progress", { current: step + 1, total: 3 })}</span>
          <div className="welcome-progress" role="progressbar" aria-label={t("onboarding.progress", { current: step + 1, total: 3 })} aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}><span style={{ width: `${(step + 1) / 3 * 100}%` }} /></div>
        </div>
        <p className="welcome-kicker">{t(`onboarding.${step === 0 ? "welcome" : step === 1 ? "goals" : "ready"}Kicker`)}</p>
        <h1 ref={title} tabIndex={-1}>{t(`onboarding.${step === 0 ? "welcome" : step === 1 ? "goals" : "ready"}Title`)}</h1>
        <p className="welcome-description">{t(`onboarding.${step === 0 ? "welcome" : step === 1 ? "goals" : "ready"}Text`)}</p>
        {step === 1 && <div className="welcome-options">
          {goals.map(({ id, Icon }) => <button key={id} type="button" className={goal === id ? "selected" : ""} aria-pressed={goal === id} onClick={() => setGoal(goal === id ? null : id)}>
            <Icon size={24} aria-hidden="true" /><span><strong>{t(`onboarding.${id}`)}</strong><small>{t(`onboarding.${id}Text`)}</small></span>{goal === id && <Check size={19} aria-hidden="true" />}
          </button>)}
        </div>}
        {step === 2 && <div className="welcome-options">
          {destinations.map(({ id, route, Icon }) => <button key={id} type="button" onClick={() => complete(route)}>
            <Icon size={24} aria-hidden="true" /><span>{goal && route === welcomeDestination(goal) && <small className="welcome-recommended">{t("onboarding.recommended")}</small>}<strong>{t(`onboarding.${id}`)}</strong><small>{t(`onboarding.${id}Text`)}</small></span><ArrowRight size={20} aria-hidden="true" />
          </button>)}
        </div>}
        <footer className="welcome-actions">
          {step < 2 && <button type="button" className="welcome-primary" onClick={() => setStep(step + 1)}>{t(step === 0 ? "onboarding.start" : "onboarding.next")}<ArrowRight size={19} aria-hidden="true" /></button>}
          <button type="button" className="welcome-text-button" onClick={() => complete("/auth")}>{t("onboarding.login")}</button>
          {step === 2 && <small>{t("onboarding.localNote")}</small>}
        </footer>
      </section>
    </div>
  </main>;
}
