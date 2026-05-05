import { useMemo } from "react";
import { loadBookings, loadWorkers } from "@/data/store";
import { Link } from "wouter";
import { useT } from "@/i18n";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function StatCard({ label, value, icon, sub, color }: { label: string; value: string | number; icon: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color ?? "bg-accent"}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useT();
  const bookings = loadBookings();
  const workers  = loadWorkers();

  const stats = useMemo(() => {
    const total     = bookings.length;
    const pending   = bookings.filter(b => b.status === "pending").length;
    const completed = bookings.filter(b => b.status === "completed").length;
    const revenue   = bookings.filter(b => b.status === "completed").reduce((s, b) => s + b.total, 0);
    const daily     = bookings.filter(b => b.bookingType === "daily").length;
    const subs      = bookings.filter(b => b.bookingType === "subscription").length;
    const available = workers.filter(w => w.status === "available").length;
    const withReviews = bookings.filter(b => b.review).length;
    const avgReview  = withReviews ? (bookings.filter(b => b.review).reduce((s, b) => s + (b.review!.rating), 0) / withReviews).toFixed(1) : "—";
    return { total, pending, completed, revenue, daily, subs, available, avgReview };
  }, [bookings, workers]);

  const recent = useMemo(() => [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [bookings]);

  const byService = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => { map[b.service] = (map[b.service] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [bookings]);

  const statusLabel: Record<string, string> = {
    pending: t.status.pending,
    confirmed: t.status.confirmed,
    completed: t.status.completed,
    cancelled: t.status.cancelled,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.dashboard.totalBookings}    value={stats.total}     icon="📋" />
        <StatCard label={t.dashboard.pending}          value={stats.pending}   icon="⏳" sub={t.dashboard.needsAction} color="bg-yellow-100" />
        <StatCard label={t.dashboard.completed}        value={stats.completed} icon="✅" color="bg-green-100" />
        <StatCard label={t.dashboard.revenue}          value={`฿${stats.revenue.toLocaleString()}`} icon="💰" color="bg-orange-100" />
        <StatCard label={t.dashboard.dailyBookings}    value={stats.daily}     icon="📅" />
        <StatCard label={t.dashboard.subscriptions}    value={stats.subs}      icon="🔄" color="bg-purple-100" />
        <StatCard label={t.dashboard.workersAvailable} value={stats.available} icon="👷" color="bg-blue-100" />
        <StatCard label={t.dashboard.avgReview}        value={`${stats.avgReview}/3`} icon="⭐" color="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{t.dashboard.recentBookings}</h2>
            <Link href="/bookings/daily" className="text-xs text-primary hover:underline">{t.dashboard.viewAll}</Link>
          </div>
          <div className="divide-y divide-border">
            {recent.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30">
                <span className="text-xl">{b.serviceIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{b.service} — {b.customerName}</div>
                  <div className="text-xs text-muted-foreground">{b.date} · {b.startTime} · {b.hours}h · <span className="capitalize">{b.bookingType}</span></div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-foreground">฿{b.total.toLocaleString()}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{statusLabel[b.status] ?? b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">{t.dashboard.topServices}</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {byService.map(([service, count]) => {
                const pct = Math.round((count / bookings.length) * 100);
                return (
                  <div key={service}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{service}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full"><div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">{t.dashboard.workers}</h2>
            </div>
            <div className="p-4 space-y-2">
              {workers.map(w => (
                <div key={w.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.status === "available" ? "bg-green-500" : w.status === "busy" ? "bg-yellow-500" : "bg-gray-400"}`} />
                  <span className="text-sm text-foreground flex-1 truncate">{w.full_name}</span>
                  <span className="text-xs text-muted-foreground">{(t.status as any)[w.status] ?? w.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
