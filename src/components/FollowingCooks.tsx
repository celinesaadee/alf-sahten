import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getOwnFollowing } from "../services/cookStatistics";
import "./CookProfileExtras.css";

type FollowingPage = Awaited<ReturnType<typeof getOwnFollowing>>;

export default function FollowingCooks({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [cooks, setCooks] = useState<FollowingPage["cooks"]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  const lock = useRef(false);
  useEffect(() => {
    const current = ++version.current;
    async function load() {
      try {
        const page = await getOwnFollowing(userId, 0);
        if (version.current !== current) return;
        setCooks(page.cooks); setCount(page.count); setOffset(page.nextOffset); setHasMore(page.hasMore); setFailed(false);
      } catch { if (version.current === current) setFailed(true); }
      finally { if (version.current === current) setLoading(false); }
    }
    void load();
    return () => { version.current = current + 1; };
  }, [userId, attempt]);

  async function loadMore() {
    if (lock.current) return;
    lock.current = true;
    const current = version.current;
    setLoading(true);
    try {
      const page = await getOwnFollowing(userId, offset);
      if (version.current !== current) return;
      setCooks(existing => [...existing, ...page.cooks.filter(cook => !existing.some(item => item.user_id === cook.user_id))]);
      setCount(page.count); setOffset(page.nextOffset); setHasMore(page.hasMore); setFailed(false);
    } catch { if (version.current === current) setFailed(true); }
    finally { lock.current = false; if (version.current === current) setLoading(false); }
  }
  return <section className="following-cooks">
    <div className="following-cooks-heading"><h2>{t("cookProfileExtras.followingTitle")}{count !== null && <span> {count}</span>}</h2><span>{t("cookProfileExtras.private")}</span></div>
    <p>{t("cookProfileExtras.followingPrivateHelp")}</p>
    {loading && <p role="status">{t("cookProfileExtras.loading")}</p>}
    {failed && <p role="alert">{t("cookProfileExtras.followingError")} <button type="button" disabled={loading} onClick={() => offset > 0 ? void loadMore() : setAttempt(value => value + 1)}>{t("cookProfileExtras.retry")}</button></p>}
    {!loading && !failed && count === 0 && <p>{t("cookProfileExtras.noFollowing")} <Link to="/discover">{t("cookProfileExtras.discover")}</Link></p>}
    <ul className="following-cook-list">
      {cooks.map(cook => <li key={cook.user_id}>
        <div className="following-cook-avatar">{cook.profile_image_url ? <img src={cook.profile_image_url} alt="" loading="lazy" /> : <ChefHat size={23} aria-hidden="true" />}</div>
        <div><strong>{cook.display_name ?? cook.username ?? t("common.cook")}</strong>{cook.username && <Link to={`/cooks/${encodeURIComponent(cook.username)}`}><bdi>@{cook.username}</bdi></Link>}</div>
      </li>)}
    </ul>
    {hasMore && !failed && <button type="button" className="following-load-more" disabled={loading} onClick={() => void loadMore()}>{t("cookProfileExtras.loadMore")}</button>}
  </section>;
}
