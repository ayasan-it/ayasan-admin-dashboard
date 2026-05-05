import { useState, useMemo } from "react";
import { loadBookings, AREAS } from "@/data/store";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { useT } from "@/i18n";

type Period = "daily" | "weekly" | "monthly";

function generateDailyData(days: number) {
  const data = [];
  const now = new Date("2026-04-25");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const base = isWeekend ? 8 : 12;
    const seed = d.getDate() * 7 + i * 3;
    const users     = Math.floor(base + ((seed * 13) % 7));
    const bookings  = Math.floor(users * 0.65 + ((seed * 5) % 4));
    const revenue   = bookings * (650 + ((seed * 17) % 400));
    const returning = Math.floor(users * (0.35 + ((seed * 3) % 25) / 100));
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: d,
      users, bookings, revenue, returning,
      retention: Math.round((returning / users) * 100),
    });
  }
  return data;
}

function groupWeekly(data: ReturnType<typeof generateDailyData>) {
  const weeks: { date: string; users: number; bookings: number; revenue: number }[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    if (chunk.length === 0) continue;
    const start = chunk[0].date;
    const end   = chunk[chunk.length - 1].date;
    weeks.push({
      date: `${start} – ${end}`,
      users:    chunk.reduce((s, d) => s + d.users, 0),
      bookings: chunk.reduce((s, d) => s + d.bookings, 0),
      revenue:  chunk.reduce((s, d) => s + d.revenue, 0),
    });
  }
  return weeks;
}

function groupMonthly(data: ReturnType<typeof generateDailyData>) {
  const map: Record<string, { users: number; bookings: number; revenue: number }> = {};
  data.forEach(d => {
    const key = d.fullDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!map[key]) map[key] = { users: 0, bookings: 0, revenue: 0 };
    map[key].users    += d.users;
    map[key].bookings += d.bookings;
    map[key].revenue  += d.revenue;
  });
  return Object.entries(map).map(([date, v]) => ({ date, ...v }));
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
type DetailType = "revenue" | "bookings" | "users";

function DetailModal({
  type,
  chartData,
  allDailyData,
  onClose,
}: {
  type: DetailType;
  chartData: ReturnType<typeof generateDailyData>;
  allDailyData: ReturnType<typeof generateDailyData>;
  onClose: () => void;
}) {
  const [userTab, setUserTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const weeklyData  = useMemo(() => groupWeekly(allDailyData),  [allDailyData]);
  const monthlyData = useMemo(() => groupMonthly(allDailyData), [allDailyData]);

  const config = {
    revenue:  { label: "Revenue (฿)",  color1: "#f97316", color2: "#ef4444", icon: "💴" },
    bookings: { label: "Bookings",     color1: "#3b82f6", color2: "#0ea5e9", icon: "📋" },
    users:    { label: "Users",        color1: "#10b981", color2: "#06b6d4", icon: "👥" },
  }[type];

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return null;
    return ((curr - prev) / prev * 100).toFixed(1);
  }

  // Revenue / Bookings — show current period daily table
  function renderRevenueBookings() {
    const rows = [...chartData].reverse();
    const getValue = (d: (typeof chartData)[0]) =>
      type === "revenue" ? d.revenue : d.bookings;
    const total = rows.reduce((s, d) => s + getValue(d), 0);

    return (
      <div>
        {/* Summary */}
        <div className="px-6 py-4 border-b border-gray-100 flex gap-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {type === "revenue" ? `฿${total.toLocaleString()}` : total.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg / day</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {type === "revenue"
                ? `฿${Math.round(total / rows.length).toLocaleString()}`
                : Math.round(total / rows.length).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Peak day</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {(() => {
                const best = rows.reduce((a, b) => getValue(a) > getValue(b) ? a : b);
                return type === "revenue" ? `฿${getValue(best).toLocaleString()}` : getValue(best).toLocaleString();
              })()}
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-auto" style={{ maxHeight: 360 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {type === "revenue" ? "Revenue" : "Bookings"}
                </th>
                <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">vs prev day</th>
                <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {type === "revenue" ? "Bookings" : "Revenue (฿)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((d, i) => {
                const curr = getValue(d);
                const prev = rows[i + 1] ? getValue(rows[i + 1]) : null;
                const chg  = prev !== null ? pctChange(curr, prev) : null;
                const isUp = chg !== null && parseFloat(chg) >= 0;
                return (
                  <tr key={d.date} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">{d.date}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">
                      {type === "revenue" ? `฿${curr.toLocaleString()}` : curr.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {chg !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isUp ? "+" : ""}{chg}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {type === "revenue" ? d.bookings.toLocaleString() : `฿${d.revenue.toLocaleString()}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Users — Daily / Weekly / Monthly tabs
  function renderUsers() {
    const tabs: { id: "daily" | "weekly" | "monthly"; label: string }[] = [
      { id: "daily",   label: "Daily"   },
      { id: "weekly",  label: "Weekly"  },
      { id: "monthly", label: "Monthly" },
    ];

    const dailyRows   = [...allDailyData].reverse();
    const weeklyRows  = [...weeklyData].reverse();
    const monthlyRows = [...monthlyData].reverse();

    const totalUsers = dailyRows.reduce((s, d) => s + d.users, 0);
    const newUsers   = Math.round(totalUsers * 0.62);
    const retUsers   = totalUsers - newUsers;

    return (
      <div>
        {/* Summary */}
        <div className="px-6 py-4 border-b border-gray-100 flex gap-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total (90d)</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{totalUsers.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">New Users</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{newUsers.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Returning</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{(totalUsers - newUsers).toLocaleString()}</div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-0.5 bg-gray-100 m-4 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setUserTab(t.id)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${userTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Table */}
        <div className="overflow-auto px-4 pb-4" style={{ maxHeight: 310 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 rounded-xl">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Bookings</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue (฿)</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">vs prev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(userTab === "daily" ? dailyRows : userTab === "weekly" ? weeklyRows : monthlyRows).map((d, i, arr) => {
                const prev = arr[i + 1];
                const chg  = prev ? pctChange(d.users, prev.users) : null;
                const isUp = chg !== null && parseFloat(chg) >= 0;
                return (
                  <tr key={d.date} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{d.date}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{d.users.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.bookings.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">฿{d.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {chg !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isUp ? "+" : ""}{chg}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `linear-gradient(135deg, ${config.color1}20, ${config.color2}30)` }}>
              {config.icon}
            </div>
            <div>
              <div className="font-bold text-gray-900">{config.label} — Detail</div>
              <div className="text-xs text-gray-400">Tap any row for breakdown</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-auto flex-1">
          {type === "users" ? renderUsers() : renderRevenueBookings()}
        </div>
        {/* Bottom accent */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${config.color1}, ${config.color2})` }} />
      </div>
    </div>
  );
}

// ── Gradient Bar Chart ────────────────────────────────────────────────────────
function GradientBarChart({
  data, valueKey, label, icon, gradientId, color1, color2, formatValue, onClick,
}: {
  data: { date: string; [key: string]: string | number }[];
  valueKey: string; label: string; icon: string;
  gradientId: string; color1: string; color2: string;
  formatValue?: (v: number) => string;
  onClick: () => void;
}) {
  const { t } = useT();
  const values = data.map(d => d[valueKey] as number);
  const maxVal = Math.max(...values, 1);
  const total  = values.reduce((a, b) => a + b, 0);
  const fmt    = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full text-left group hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
      {/* Header */}
      <div className="px-5 pt-5 pb-1 flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{fmt(total)}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color1}22, ${color2}44)` }}>
            {icon}
          </div>
        </div>
      </div>
      {/* Click hint */}
      <div className="px-5 pb-1">
        <span className="text-xs text-gray-300 group-hover:text-gray-400 transition-colors">{t.analytics.clickForDetail} →</span>
      </div>
      {/* SVG gradient bars */}
      <div className="px-3 pb-3 pt-1">
        <svg viewBox={`0 0 ${data.length * 22} 80`} className="w-full" style={{ height: 100 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color1} stopOpacity="1" />
              <stop offset="100%" stopColor={color2} stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id={`${gradientId}-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color1} stopOpacity="0.06" />
              <stop offset="100%" stopColor={color1} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polyline
            points={data.map((d, i) => { const val = d[valueKey] as number; return `${i * 22 + 11},${72 - (val / maxVal) * 65}`; }).join(" ")}
            fill="none" stroke={color1} strokeWidth="1.5" strokeOpacity="0.3"
          />
          {data.map((d, i) => {
            const val  = d[valueKey] as number;
            const barH = (val / maxVal) * 65;
            const x = i * 22 + 3;
            const y = 72 - barH;
            return (
              <g key={i}>
                <rect x={x} y={7}  width={16} height={65} rx="3" fill={`url(#${gradientId}-bg)`} />
                <rect x={x} y={y}  width={16} height={barH} rx="3" fill={`url(#${gradientId})`} />
                <rect x={x} y={y}  width={16} height={3} rx="1.5" fill={color1} opacity="0.9" />
              </g>
            );
          })}
        </svg>
        <div className="flex mt-1">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-gray-400 truncate" style={{ fontSize: 9 }}>
              {d.date.split(" ")[1] ?? d.date}
            </div>
          ))}
        </div>
      </div>
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color1}, ${color2})` }} />
    </button>
  );
}

// ── Retention Chart ───────────────────────────────────────────────────────────
function RetentionChart({ data }: { data: { date: string; retention: number }[] }) {
  const avg = Math.round(data.reduce((s, d) => s + d.retention, 0) / data.length);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Retention Rate</div>
          <div className="text-2xl font-bold text-gray-900 mt-0.5">{avg}% avg</div>
        </div>
        <span className="text-sm text-gray-400">Returning / Total Users</span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-end gap-2" style={{ height: 110 }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500">{d.retention}%</div>
              <div className="w-full rounded-t-xl relative" style={{ height: 72, background: "#f1f5f9" }}>
                <div className="absolute bottom-0 left-0 right-0 rounded-t-xl"
                  style={{ height: `${d.retention}%`, background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%)", boxShadow: "0 -2px 8px rgba(59,130,246,0.25)" }} />
              </div>
              <div className="text-gray-400 truncate w-full text-center" style={{ fontSize: 9 }}>
                {d.date.split(" ")[1] ?? d.date}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #60a5fa, #1d4ed8, #7c3aed)" }} />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color1, color2, trend }: {
  label: string; value: string; icon: string; color1: string; color2: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }} />
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full" style={{ background: `linear-gradient(180deg, ${color1}, ${color2})` }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color1}20, ${color2}30)` }}>
        {icon}
      </div>
      <div className="relative flex-1 pl-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
        {trend && <div className="text-xs text-gray-400 mt-0.5">{trend}</div>}
      </div>
    </div>
  );
}

// ── Service Usage ─────────────────────────────────────────────────────────────
function ServiceUsageTable({ bookings, areaFilter }: {
  bookings: ReturnType<typeof loadBookings>; areaFilter: string;
}) {
  const serviceUsage = useMemo(() => {
    const bks = areaFilter === "all" ? bookings : bookings.filter(b => b.area === areaFilter);
    const map: Record<string, { count: number; revenue: number; icon: string }> = {};
    bks.forEach(b => {
      if (!map[b.service]) map[b.service] = { count: 0, revenue: 0, icon: b.serviceIcon };
      map[b.service].count++;
      if (b.status === "completed") map[b.service].revenue += b.total;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [bookings, areaFilter]);

  const totalBookings = bookings.length || 1;
  const gradients = [["#3b82f6","#1d4ed8"],["#06b6d4","#0e7490"],["#8b5cf6","#6d28d9"],["#f97316","#c2410c"],["#10b981","#065f46"],["#ec4899","#9d174d"],["#6366f1","#4338ca"],["#14b8a6","#0f766e"]];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Service Usage</div>
      </div>
      <div className="divide-y divide-gray-50">
        {serviceUsage.map(([service, data], i) => {
          const pct = Math.round((data.count / totalBookings) * 100);
          const [c1, c2] = gradients[i % gradients.length];
          return (
            <div key={service} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <span className="text-xl flex-shrink-0">{data.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800">{service}</span>
                  <span className="text-xs text-gray-400">{data.count} · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})`, boxShadow: `0 1px 4px ${c1}44` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0 w-24">
                <div className="text-sm font-bold text-gray-900">฿{data.revenue.toLocaleString()}</div>
                <div className="text-xs text-gray-400">revenue</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { t } = useT();
  const bookings = loadBookings();
  const [period, setPeriod]         = useState<Period>("daily");
  const [dateFrom, setDateFrom]     = useState("2026-04-01");
  const [dateTo, setDateTo]         = useState("2026-04-25");
  const [areaFilter, setAreaFilter] = useState("all");
  const [modal, setModal]           = useState<DetailType | null>(null);

  const allDailyData = useMemo(() => generateDailyData(90), []);

  const days    = period === "daily" ? 14 : period === "weekly" ? 56 : 90;
  const rawData = useMemo(() => generateDailyData(days), [days]);

  const chartData = useMemo(() => {
    if (period === "daily") return rawData.slice(-14);
    if (period === "weekly") {
      const weeks: typeof rawData = [];
      for (let i = 0; i < rawData.length; i += 7) {
        const c = rawData.slice(i, i + 7);
        weeks.push({ date: `W${Math.floor(i/7)+1}`, fullDate: c[0].fullDate, users: c.reduce((s,d)=>s+d.users,0), bookings: c.reduce((s,d)=>s+d.bookings,0), revenue: c.reduce((s,d)=>s+d.revenue,0), returning: c.reduce((s,d)=>s+d.returning,0), retention: Math.round(c.reduce((s,d)=>s+d.retention,0)/c.length) });
      }
      return weeks;
    }
    const months: typeof rawData = [];
    for (let i = 0; i < rawData.length; i += 30) {
      const c = rawData.slice(i, i + 30);
      months.push({ date: ["Feb","Mar","Apr"][Math.floor(i/30)] ?? `M${Math.floor(i/30)+1}`, fullDate: c[0].fullDate, users: c.reduce((s,d)=>s+d.users,0), bookings: c.reduce((s,d)=>s+d.bookings,0), revenue: c.reduce((s,d)=>s+d.revenue,0), returning: c.reduce((s,d)=>s+d.returning,0), retention: Math.round(c.reduce((s,d)=>s+d.retention,0)/c.length) });
    }
    return months;
  }, [rawData, period]);

  const totals = useMemo(() => ({
    users:        chartData.reduce((s,d) => s+d.users, 0),
    bookings:     chartData.reduce((s,d) => s+d.bookings, 0),
    revenue:      chartData.reduce((s,d) => s+d.revenue, 0),
    avgRetention: Math.round(chartData.reduce((s,d) => s+d.retention, 0) / chartData.length),
  }), [chartData]);

  const PERIODS: { id: Period; label: string }[] = [
    { id: "daily", label: t.analytics.daily },
    { id: "weekly", label: t.analytics.weekly },
    { id: "monthly", label: t.analytics.monthly },
  ];

  return (
    <div className="p-6 space-y-5 bg-background min-h-screen">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.analytics.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.analytics.subtitle}</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-0.5 bg-muted rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === p.id ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-border rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700" />
            <span className="text-muted-foreground">–</span>
            <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-border rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700" />
          </div>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
            className="border border-border rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700">
            <option value="all">{t.common.allAreas}</option>
            {AREAS.map(a => <option key={a.id} value={a.id}>{a.label.split(" / ")[0]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.analytics.users}        value={totals.users.toLocaleString()}        icon="👥" color1="#3b82f6" color2="#1d4ed8" trend={`${period} period`} />
        <StatCard label={t.analytics.bookingCount} value={totals.bookings.toLocaleString()}     icon="📋" color1="#06b6d4" color2="#0e7490" trend="Total bookings" />
        <StatCard label={t.analytics.revenue}      value={`฿${totals.revenue.toLocaleString()}`} icon="💰" color1="#f97316" color2="#c2410c" trend="Completed jobs" />
        <StatCard label="Avg Retention"            value={`${totals.avgRetention}%`}            icon="🔄" color1="#8b5cf6" color2="#6d28d9" trend="Returning users" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GradientBarChart data={chartData} valueKey="revenue"  label={t.analytics.revenue}      icon="💴" gradientId="rev"  color1="#f97316" color2="#ef4444" formatValue={v => `฿${v.toLocaleString()}`} onClick={() => setModal("revenue")}  />
        <GradientBarChart data={chartData} valueKey="bookings" label={t.analytics.bookingCount} icon="📋" gradientId="book" color1="#3b82f6" color2="#0ea5e9"                                               onClick={() => setModal("bookings")} />
        <GradientBarChart data={chartData} valueKey="users"    label={t.analytics.users}        icon="👥" gradientId="usr"  color1="#10b981" color2="#06b6d4"                                               onClick={() => setModal("users")}    />
      </div>

      {/* Retention */}
      <RetentionChart data={chartData} />

      {/* Service usage */}
      <ServiceUsageTable bookings={bookings} areaFilter={areaFilter} />

      {/* Detail modal */}
      {modal && (
        <DetailModal
          type={modal}
          chartData={chartData}
          allDailyData={allDailyData}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
