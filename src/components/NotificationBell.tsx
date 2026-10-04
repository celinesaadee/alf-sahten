import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./NotificationBell.css";

type Notice = {
  id: string;
  type: string;
  entity_id: string | null;
  data: { recipe_title?: string; service_title?: string; applicant_name?: string; admin_note?: string };
  read_at: string | null;
  created_at: string;
};

const copy = {
  en: { title: "Notifications", empty: "You’re all caught up.", loading: "Loading notifications…", error: "Could not load notifications. Please try again.", readError: "Could not mark the notification as read. Please try again.", retry: "Try again", close: "Close notifications", submitted: "Recipe submitted for review", approved: "Recipe approved", declined: "Recipe declined", changes: "Changes requested", fallback: "Recipe update", unread: "unread", latest: "Latest 50 notifications" },
  fr: { title: "Notifications", empty: "Vous êtes à jour.", loading: "Chargement des notifications…", error: "Impossible de charger les notifications. Réessayez.", readError: "Impossible de marquer la notification comme lue. Réessayez.", retry: "Réessayer", close: "Fermer les notifications", submitted: "Recette soumise pour validation", approved: "Recette approuvée", declined: "Recette refusée", changes: "Modifications demandées", fallback: "Mise à jour de recette", unread: "non lues", latest: "Les 50 dernières notifications" },
  ar: { title: "الإشعارات", empty: "لا توجد إشعارات جديدة.", loading: "جارٍ تحميل الإشعارات…", error: "تعذّر تحميل الإشعارات. حاول مجدداً.", readError: "تعذّر تحديد الإشعار كمقروء. حاول مجدداً.", retry: "حاول مجدداً", close: "إغلاق الإشعارات", submitted: "وصفة بانتظار المراجعة", approved: "تمت الموافقة على الوصفة", declined: "تم رفض الوصفة", changes: "طُلب تعديل الوصفة", fallback: "تحديث الوصفة", unread: "غير مقروءة", latest: "آخر 50 إشعاراً" },
};

function destination(item: Notice) {
  if (item.type === "cook_application_submitted") return "/admin/cook-applications";
  if (item.type === "cook_application_approved" || item.type === "cook_application_declined") return "/become-creator";
  if (item.type === "service_request_submitted" || item.type === "service_request_cancelled") return "/cook/requests";
  if (item.type === "service_request_accepted" || item.type === "service_request_declined" || item.type === "service_request_completed") return "/my-requests";
  if (item.type === "recipe_submitted") return "/admin/recipes";
  if (!item.entity_id || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(item.entity_id)) return null;
  if (item.type === "recipe_approved") return `/recipe/${item.entity_id}`;
  if (item.type === "recipe_declined" || item.type === "recipe_changes_requested") return `/cook/recipes/${item.entity_id}/edit`;
  return null;
}

function AccountBell({ userId }: { userId: string }) {
  const { i18n } = useTranslation();
  const language = i18n.language.split("-")[0];
  const words = copy[language as keyof typeof copy] ?? copy.en;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<"load" | "read" | null>(null);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const alive = useRef(false);
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const version = ++sequence.current;
    try {
      const [list, count] = await Promise.all([
        supabase.from("notifications").select("id,type,entity_id,data,read_at,created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(50),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", userId).is("read_at", null),
      ]);
      if (!alive.current || version !== sequence.current) return;
      if (list.error || count.error) { setError("load"); return; }
      setItems((list.data ?? []) as Notice[]);
      setUnread(count.count ?? 0);
      setLoaded(true);
      setError(null);
    } catch {
      if (alive.current && version === sequence.current) setError("load");
    }
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    ++sequence.current;
    const initialLoad = window.setTimeout(() => void load(), 0);
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive.current = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function visit(item: Notice) {
    if (busy) return;
    setBusy(true);
    ++sequence.current;
    try {
      if (!item.read_at) {
        const result = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id).eq("recipient_id", userId).select("id").single();
        if (result.error) throw result.error;
      }
      if (!alive.current) return;
      const path = destination(item);
      setOpen(false);
      trigger.current?.focus();
      void load();
      if (path) navigate(path);
    } catch {
      if (alive.current) setError("read");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  function label(item: Notice) {
    const applicationLabels = {
      en: ["New Cook application", "Cook application approved", "Cook application declined"],
      fr: ["Nouvelle candidature de cuisinier", "Candidature de cuisinier approuvée", "Candidature de cuisinier refusée"],
      ar: ["طلب انضمام طاهٍ جديد", "تمت الموافقة على طلب الانضمام كطاهٍ", "تم رفض طلب الانضمام كطاهٍ"],
    };
    const appLabels = applicationLabels[language as keyof typeof applicationLabels] ?? applicationLabels.en;
    if (item.type === "cook_application_submitted") return appLabels[0];
    if (item.type === "cook_application_approved") return appLabels[1];
    if (item.type === "cook_application_declined") return appLabels[2];
    const serviceLabels = {
      en: ["New service request", "Service request accepted", "Service request declined", "Service request cancelled", "Service request completed"],
      fr: ["Nouvelle demande de service", "Demande de service acceptée", "Demande de service refusée", "Demande de service annulée", "Demande de service terminée"],
      ar: ["طلب خدمة جديد", "تم قبول طلب الخدمة", "تم رفض طلب الخدمة", "تم إلغاء طلب الخدمة", "تم إكمال طلب الخدمة"],
    };
    const labels = serviceLabels[language as keyof typeof serviceLabels] ?? serviceLabels.en;
    if (item.type === "service_request_submitted") return labels[0];
    if (item.type === "service_request_accepted") return labels[1];
    if (item.type === "service_request_declined") return labels[2];
    if (item.type === "service_request_cancelled") return labels[3];
    if (item.type === "service_request_completed") return labels[4];
    if (item.type === "recipe_submitted") return words.submitted;
    if (item.type === "recipe_approved") return words.approved;
    if (item.type === "recipe_declined") return words.declined;
    if (item.type === "recipe_changes_requested") return words.changes;
    return words.fallback;
  }

  return <div className="notification-bell-wrap" ref={wrap}>
    <button ref={trigger} type="button" className="header-icon-button notification-bell-trigger" aria-label={`${words.title}${unread ? ` (${unread} ${words.unread})` : ""}`} aria-expanded={open} aria-controls="notification-panel" onClick={() => { setOpen(!open); if (!open) void load(); }}>
      <Bell size={21} strokeWidth={1.8} />
      {unread > 0 && <span className="notification-badge" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <section id="notification-panel" className="notification-panel" aria-label={words.title} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="notification-panel-heading"><strong>{words.title}</strong><button type="button" className="notification-close" aria-label={words.close} onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button></div>
      {error && <div className="notification-status" role="alert">{error === "read" ? words.readError : words.error}<button type="button" onClick={() => void load()}>{words.retry}</button></div>}
      {!loaded && !error && <p className="notification-status" role="status">{words.loading}</p>}
      {loaded && items.length === 0 && <p className="notification-status">{words.empty}</p>}
      <div className="notification-list">{items.map(item => <button type="button" key={item.id} className={`notification-item${item.read_at ? "" : " notification-unread"}`} disabled={busy} onClick={() => void visit(item)}>
        <span className="notification-item-label">{label(item)}{!item.read_at && <span className="notification-dot" aria-label={words.unread} />}</span>
        <strong>{typeof item.data?.applicant_name === "string" ? item.data.applicant_name : typeof item.data?.service_title === "string" ? item.data.service_title : typeof item.data?.recipe_title === "string" ? item.data.recipe_title : words.fallback}</strong>
        {typeof item.data?.admin_note === "string" && item.data.admin_note && <span className="notification-note">{item.data.admin_note}</span>}
        <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(language, { dateStyle: "medium", timeStyle: "short" })}</time>
      </button>)}</div>
      {items.length === 50 && <p className="notification-status">{words.latest}</p>}
    </section>}
  </div>;
}

export default function NotificationBell() {
  const { user } = useAuth();
  return user ? <AccountBell key={user.id} userId={user.id} /> : null;
}
