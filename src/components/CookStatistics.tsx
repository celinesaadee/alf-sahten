import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCookStatistics, type CookStatistics as Statistics } from "../services/cookStatistics";
import "./CookProfileExtras.css";

export default function CookStatistics({ cookId, followerCount, refreshToken = "" }: {
  cookId: string; followerCount?: number; refreshToken?: string;
}) {
  const { t, i18n } = useTranslation();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getCookStatistics(cookId);
        if (active) { setStatistics(data); setFailed(false); }
      } catch { if (active) setFailed(true); }
    }
    void load();
    return () => { active = false; };
  }, [cookId, refreshToken, attempt]);
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? "en");
  return <div className="cook-statistics-panel">
    <dl className="cook-statistics" aria-label={t("cookProfileExtras.statistics")}>
      {(["recipe_count", "follower_count", "following_count"] as const).map(key => {
        const value = statistics?.[key] ?? (key === "follower_count" ? followerCount : undefined);
        return <div key={key}><dd>{value === undefined ? "—" : formatter.format(value)}</dd><dt>{t(`cookProfileExtras.${key}`)}</dt></div>;
      })}
    </dl>
    {failed && <p role="status" className="cook-statistics-error">{t("cookProfileExtras.statsError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("cookProfileExtras.retry")}</button></p>}
  </div>;
}
