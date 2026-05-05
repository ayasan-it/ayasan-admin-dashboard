import { Link, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { useT } from "@/i18n";

function NavItem({ path, label, icon, badge, children }: {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  children?: { path: string; label: string; badge?: number }[];
}) {
  const [active] = useRoute(path === "/" ? "/" : `${path}*`);
  const [open, setOpen] = useState(false);

  if (children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
            ${active ? "bg-primary text-white" : "text-sidebar-foreground hover:bg-white/10"}`}
        >
          <span className="text-base">{icon}</span>
          <span className="flex-1">{label}</span>
          {badge != null && badge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          <span className="text-xs opacity-60">{open ? "▾" : "▸"}</span>
        </button>
        {(active || open) && (
          <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
            {children.map(c => (
              <Link key={c.path} href={c.path}
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-sidebar-foreground/70 hover:text-white hover:bg-white/10 transition-colors">
                <span>{c.label}</span>
                {c.badge != null && c.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                    {c.badge > 99 ? "99+" : c.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${active ? "bg-primary text-white" : "text-sidebar-foreground hover:bg-white/10"}`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight animate-pulse">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useT();
  const [pendingGifts, setPendingGifts]   = useState(0);
  const [pendingCancels, setPendingCancels] = useState(0);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const [giftsRes, cancelRes] = await Promise.all([
          fetch("/api/gift-redemptions/pending-count"),
          fetch("/api/subscription-cancellations/pending-count"),
        ]);
        if (giftsRes.ok)  setPendingGifts((await giftsRes.json()).count ?? 0);
        if (cancelRes.ok) setPendingCancels((await cancelRes.json()).count ?? 0);
      } catch {
        // ignore — badges just won't show
      }
    }
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalAlerts = pendingGifts + pendingCancels;

  const NAV = [
    { path: "/",             label: t.nav.dashboard,   icon: "📊" },
    {
      path: "/bookings",
      label: t.nav.bookings,
      icon: "📋",
      badge: pendingCancels,
      children: [
        { path: "/bookings/daily",                label: t.nav.dailyBookings },
        { path: "/bookings/subscription",         label: t.nav.subscriptions },
        { path: "/subscription-cancellations",    label: "Cancellation Requests", badge: pendingCancels },
      ],
    },
    { path: "/workers",      label: t.nav.workers,     icon: "👷" },
    { path: "/analytics",    label: t.nav.analytics,   icon: "📈" },
    { path: "/reviews",      label: t.nav.reviews,     icon: "⭐" },
    { path: "/feedback",     label: t.nav.appFeedback, icon: "💬" },
    { path: "/area-pricing", label: t.nav.areaPricing, icon: "🗺️" },
    { path: "/marketing",    label: t.nav.marketing,   icon: "📣" },
    { path: "/promotions",   label: t.nav.promotions,  icon: "🏷️" },
    {
      path: "/points",
      label: t.nav.points,
      icon: "🎁",
      badge: pendingGifts,
      children: [
        { path: "/points",         label: t.nav.pointsConfig },
        { path: "/gifts",          label: t.nav.giftCatalog },
        { path: "/gift-requests",  label: "Redemption Requests", badge: pendingGifts },
      ],
    },
    { path: "/settings",     label: t.nav.settings,    icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <div>
              <div className="text-white font-bold text-base leading-tight">Ayasan</div>
              <div className="text-white/50 text-xs">Admin Dashboard</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => <NavItem key={n.path} {...n} />)}
        </nav>
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/30">Ayasan · Admin v2.0</span>
          <button
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold"
            title={t.switchTo}
          >
            <span>{lang === "en" ? "🇺🇸" : "🇹🇭"}</span>
            <span>{t.lang}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
