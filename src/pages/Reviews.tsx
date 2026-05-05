import { useState, useMemo } from "react";
import { loadBookings, loadWorkers } from "@/data/store";
import { useT } from "@/i18n";

const RATING_COLORS = ["","bg-red-100 text-red-700 border-red-200","bg-yellow-100 text-yellow-700 border-yellow-200","bg-green-100 text-green-700 border-green-200"];
const RATING_ICONS  = ["","😞","😊","😄"];

function StarRow({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(count) ? "opacity-100" : "opacity-20"} style={{ fontSize: 14 }}>⭐</span>
      ))}
    </div>
  );
}

function CustomerReviews() {
  const { t } = useT();
  const bookings = loadBookings();
  const reviewed  = useMemo(() => bookings.filter(b => b.review).sort((a,b) => (b.review!.createdAt).localeCompare(a.review!.createdAt)), []);
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const RATING_LABELS = t.reviews.ratingLabels;

  const filtered = useMemo(() => reviewed.filter(b => {
    const matchRating = ratingFilter === "all" || b.review!.rating === ratingFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) || b.service.toLowerCase().includes(q);
    return matchRating && matchSearch;
  }), [reviewed, ratingFilter, search]);

  const stats = useMemo(() => ({
    total: reviewed.length,
    avg:   reviewed.length ? (reviewed.reduce((s,b)=>s+b.review!.rating,0)/reviewed.length).toFixed(2) : "0",
    r1:    reviewed.filter(b=>b.review!.rating===1).length,
    r2:    reviewed.filter(b=>b.review!.rating===2).length,
    r3:    reviewed.filter(b=>b.review!.rating===3).length,
  }), [reviewed]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{stats.avg}</div>
          <div className="text-sm text-gray-500 mt-0.5">{t.reviews.avgRating} (max 3)</div>
          <StarRow count={Number(stats.avg)} />
        </div>
        {([1,2,3] as const).map(r=>(
          <div key={r} className={`border rounded-xl p-5 shadow-sm ${RATING_COLORS[r]}`}>
            <div className="text-2xl font-bold">{({1:stats.r1,2:stats.r2,3:stats.r3})[r]}</div>
            <div className="text-sm">{RATING_LABELS[r]}</div>
            <div className="text-2xl mt-1">{RATING_ICONS[r]}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
          <input className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t.common.search} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all",1,2,3] as const).map(r=>(
            <button key={r} onClick={()=>setRatingFilter(r)} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${ratingFilter===r?"bg-primary text-white border-primary":"bg-white border-gray-200 text-gray-700 hover:border-primary/50"}`}>
              {r==="all"?t.common.all:RATING_ICONS[r as number]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(b=>(
          <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{b.serviceIcon}</span>
                <div>
                  <div className="font-semibold text-gray-900">{b.customerName}</div>
                  <div className="text-sm text-gray-500">{b.service} · {b.date} · {b.hours}h</div>
                  {b.assignedWorkerName && <div className="text-xs text-gray-400 mt-0.5">{t.bookings.worker}: <span className="font-medium text-gray-600">{b.assignedWorkerName}</span></div>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border font-medium ${RATING_COLORS[b.review!.rating]}`}>
                  {RATING_ICONS[b.review!.rating]} {RATING_LABELS[b.review!.rating]}
                </span>
                <div className="text-xs text-gray-400 mt-1">{b.review!.createdAt}</div>
              </div>
            </div>
            {b.review!.comment && (
              <div className="mt-3 pl-11">
                <p className="text-sm text-gray-700 italic bg-gray-50 rounded-lg px-3 py-2">"{b.review!.comment}"</p>
              </div>
            )}
            <div className="mt-3 pl-11 flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400">฿{b.total.toLocaleString()}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400 capitalize">{b.area}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{b.id}</span>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div className="text-center text-gray-400 py-12 bg-white border border-gray-100 rounded-xl">{t.reviews.noReviews}</div>}
      </div>
    </div>
  );
}

function WorkerReviews() {
  const { t } = useT();
  const bookings = loadBookings();
  const workers  = loadWorkers();
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const RATING_LABELS = t.reviews.ratingLabels;

  const workerStats = useMemo(() => {
    return workers.map(w => {
      const wBookings  = bookings.filter(b => b.assignedWorkerId === w.id && b.review);
      const totalReviews = wBookings.length;
      const avgRating  = totalReviews ? wBookings.reduce((s,b) => s + b.review!.rating, 0) / totalReviews : 0;
      const r1 = wBookings.filter(b => b.review!.rating === 1).length;
      const r2 = wBookings.filter(b => b.review!.rating === 2).length;
      const r3 = wBookings.filter(b => b.review!.rating === 3).length;
      const latestReview = wBookings.sort((a,b) => b.review!.createdAt.localeCompare(a.review!.createdAt))[0];
      return { worker: w, totalReviews, avgRating, r1, r2, r3, reviews: wBookings, latestReview };
    }).sort((a,b) => b.totalReviews - a.totalReviews);
  }, [bookings, workers]);

  const selected = selectedWorker ? workerStats.find(w => w.worker.id === selectedWorker) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{workers.length}</div>
          <div className="text-sm text-gray-500">{t.nav.workers}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{workerStats.filter(w=>w.totalReviews>0).length}</div>
          <div className="text-sm text-gray-500">{t.workers.title} w/ {t.reviews.reviews}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{workerStats.reduce((s,w)=>s+w.totalReviews,0)}</div>
          <div className="text-sm text-gray-500">{t.reviews.reviews}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">
            {workerStats.filter(w=>w.totalReviews>0).length
              ? (workerStats.reduce((s,w)=>s+(w.avgRating*w.totalReviews),0) / Math.max(workerStats.reduce((s,w)=>s+w.totalReviews,0),1)).toFixed(2)
              : "—"}
          </div>
          <div className="text-sm text-gray-500">{t.reviews.avgRating}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {workerStats.map(({ worker, totalReviews, avgRating, r1, r2, r3 }) => (
            <button key={worker.id} onClick={() => setSelectedWorker(worker.id === selectedWorker ? null : worker.id)}
              className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm transition-all ${selectedWorker === worker.id ? "border-primary ring-1 ring-primary/20" : "border-gray-100 hover:border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {worker.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{worker.full_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{worker.area} · {worker.services.join(", ")}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900">{totalReviews > 0 ? avgRating.toFixed(1) : "—"}</div>
                  <div className="text-xs text-gray-400">{totalReviews} {t.reviews.reviews}</div>
                </div>
              </div>
              {totalReviews > 0 && (
                <div className="mt-3 flex gap-2">
                  {[{label:"😞",count:r1,color:"bg-red-100 text-red-600"},{label:"😊",count:r2,color:"bg-yellow-100 text-yellow-600"},{label:"😄",count:r3,color:"bg-green-100 text-green-600"}].map(({label,count,color})=>(
                    <span key={label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label} {count}</span>
                  ))}
                </div>
              )}
              {totalReviews === 0 && <div className="mt-2 text-xs text-gray-400">{t.reviews.noReviews}</div>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {selected.worker.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">{selected.worker.full_name}</div>
                  <div className="text-sm text-gray-500">{selected.worker.area} · ⭐ {selected.worker.rating} · {selected.worker.completedJobs} {t.workers.jobs}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{selected.avgRating.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{selected.totalReviews} {t.reviews.reviews}</div>
                  <StarRow count={selected.avgRating} />
                </div>
              </div>
              <div className="divide-y divide-gray-50 overflow-auto" style={{ maxHeight: 420 }}>
                {selected.reviews.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">{t.reviews.noReviews}</div>
                ) : selected.reviews.map(b => (
                  <div key={b.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{b.customerName}</div>
                        <div className="text-sm text-gray-500">{b.service} · {b.date} · {b.hours}h · ฿{b.total.toLocaleString()}</div>
                      </div>
                      <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${RATING_COLORS[b.review!.rating]}`}>
                        {RATING_ICONS[b.review!.rating]} {RATING_LABELS[b.review!.rating]}
                      </span>
                    </div>
                    {b.review!.comment && (
                      <p className="mt-2 text-sm text-gray-700 italic bg-gray-50 rounded-lg px-3 py-2">"{b.review!.comment}"</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1.5">{b.review!.createdAt} · {b.id}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl h-48 flex items-center justify-center text-gray-400 text-sm">
              ← {t.reviews.selectWorker}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { t } = useT();
  const [tab, setTab] = useState<"customer" | "worker">("customer");
  const bookings = loadBookings();
  const reviewed = bookings.filter(b => b.review);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.reviews.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{reviewed.length} {t.reviews.reviews}</p>
        </div>
        <div className="flex gap-0.5 bg-muted rounded-xl p-1">
          <button onClick={() => setTab("customer")} className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "customer" ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            👤 {t.reviews.customerReviews}
          </button>
          <button onClick={() => setTab("worker")} className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "worker" ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            👷 {t.reviews.workerReviews}
          </button>
        </div>
      </div>
      {tab === "customer" ? <CustomerReviews /> : <WorkerReviews />}
    </div>
  );
}
