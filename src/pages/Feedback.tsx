import { useState, useMemo } from "react";
import { loadFeedback, updateFeedback, deleteFeedback, AppFeedback, FeedbackCategory, FeedbackStatus } from "@/data/store";
import { X, Check, Trash2, MessageSquare } from "lucide-react";
import { useT } from "@/i18n";

const CAT_COLORS: Record<FeedbackCategory, string> = {
  bug:       "bg-red-100 text-red-700 border-red-200",
  feature:   "bg-blue-100 text-blue-700 border-blue-200",
  general:   "bg-gray-100 text-gray-700 border-gray-200",
  complaint: "bg-orange-100 text-orange-700 border-orange-200",
};
const CAT_ICONS: Record<FeedbackCategory, string> = {
  bug: "🐛", feature: "💡", general: "💬", complaint: "⚠️",
};
const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new:      "bg-yellow-100 text-yellow-700 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 13, opacity: i <= rating ? 1 : 0.2 }}>⭐</span>
      ))}
    </div>
  );
}

function DetailModal({ fb, onClose, onUpdate }: { fb: AppFeedback; onClose: () => void; onUpdate: () => void }) {
  const { t } = useT();
  const f = t.feedback;
  const [adminNote, setAdminNote] = useState(fb.adminNote ?? "");
  const [status, setStatus]       = useState<FeedbackStatus>(fb.status);

  function save() {
    updateFeedback(fb.id, { status, adminNote: adminNote.trim() || undefined });
    onUpdate();
    onClose();
  }

  const catLabels: Record<FeedbackCategory, string> = {
    bug: f.bugReport, feature: f.featureRequest, general: f.general, complaint: f.complaint,
  };
  const statusLabels: Record<FeedbackStatus, string> = {
    new: f.new, reviewed: f.reviewed, resolved: f.resolved,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CAT_COLORS[fb.category]}`}>{CAT_ICONS[fb.category]} {catLabels[fb.category]}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[fb.status]}`}>{statusLabels[fb.status]}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={14} className="text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <div className="font-bold text-gray-900 text-lg">{fb.subject}</div>
            <div className="flex items-center gap-3 mt-1">
              <RatingStars rating={fb.rating} />
              <span className="text-sm text-gray-500">{fb.userName} · {fb.os === "ios" ? "🍎 iOS" : "🤖 Android"} · v{fb.appVersion}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fb.message}</div>

          <div className="flex gap-4 text-xs text-gray-400">
            {fb.userPhone && <span>📞 {fb.userPhone}</span>}
            <span>📅 {fb.createdAt}</span>
            <span>🆔 {fb.id}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.updateStatus}</label>
            <div className="flex gap-2">
              {(["new","reviewed","resolved"] as FeedbackStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${status === s ? STATUS_COLORS[s] + " ring-1 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.adminNote}</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              placeholder={f.adminNote + "..."} />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">{t.common.cancel}</button>
          <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 flex items-center gap-1.5"><Check size={14} /> {t.common.saveChanges}</button>
        </div>
      </div>
    </div>
  );
}

export default function Feedback() {
  const { t } = useT();
  const f = t.feedback;
  const [items, setItems]           = useState(() => loadFeedback());
  const [catFilter, setCatFilter]   = useState<FeedbackCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [osFilter, setOsFilter]     = useState<"all" | "ios" | "android">("all");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<AppFeedback | null>(null);

  function refresh() { setItems(loadFeedback()); }

  const sorted = useMemo(() => [...items].sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [items]);

  const filtered = useMemo(() => sorted.filter(fi => {
    if (catFilter !== "all" && fi.category !== catFilter) return false;
    if (statusFilter !== "all" && fi.status !== statusFilter) return false;
    if (osFilter !== "all" && fi.os !== osFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!fi.userName.toLowerCase().includes(q) && !fi.subject.toLowerCase().includes(q) && !fi.message.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [sorted, catFilter, statusFilter, osFilter, search]);

  const stats = useMemo(() => ({
    total:     items.length,
    newCount:  items.filter(fi => fi.status === "new").length,
    bugs:      items.filter(fi => fi.category === "bug").length,
    avgRating: items.length ? (items.reduce((s,fi) => s + fi.rating, 0) / items.length).toFixed(1) : "—",
  }), [items]);

  function handleDelete(id: string) {
    if (!confirm(t.common.cannotUndo)) return;
    deleteFeedback(id);
    refresh();
  }

  const catLabels: Record<FeedbackCategory, string> = {
    bug: f.bugReport, feature: f.featureRequest, general: f.general, complaint: f.complaint,
  };
  const statusLabels: Record<FeedbackStatus, string> = {
    new: f.new, reviewed: f.reviewed, resolved: f.resolved,
  };

  return (
    <div className="p-6 space-y-5 bg-background min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{f.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{f.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">{f.totalFeedback}</div>
          <div className="text-xs text-gray-400 mt-1">{f.allTime}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-yellow-700">{stats.newCount}</div>
          <div className="text-sm text-yellow-600">{f.newItems}</div>
          <div className="text-xs text-yellow-500 mt-1">{f.needsReview}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-red-700">{stats.bugs}</div>
          <div className="text-sm text-red-600">{f.bugReports}</div>
          <div className="text-xs text-red-400 mt-1">{f.devTeam}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{stats.avgRating}</div>
          <div className="text-sm text-gray-500">{f.avgRating}</div>
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(i=><span key={i} style={{fontSize:11,opacity:i<=Math.round(Number(stats.avgRating))?1:0.2}}>⭐</span>)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.common.search} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${catFilter === "all" ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>{t.common.all}</button>
          {(["bug","feature","general","complaint"] as FeedbackCategory[]).map(k => (
            <button key={k} onClick={() => setCatFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${catFilter === k ? CAT_COLORS[k] : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>{CAT_ICONS[k]} {catLabels[k]}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["all","new","reviewed","resolved"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? (s === "all" ? "bg-primary text-white border-primary" : STATUS_COLORS[s]) : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {s === "all" ? f.allStatus : statusLabels[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["all","ios","android"] as const).map(o => (
            <button key={o} onClick={() => setOsFilter(o)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${osFilter === o ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {o === "all" ? f.allOs : o === "ios" ? "🍎 iOS" : "🤖 Android"}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400">{filtered.length} {f.feedbackCount} {items.length}</div>
      </div>

      <div className="space-y-3">
        {filtered.map(fi => (
          <div key={fi.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-gray-200 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">{CAT_ICONS[fi.category]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-gray-900">{fi.subject}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{fi.userName} · {fi.os === "ios" ? "🍎" : "🤖"} v{fi.appVersion} · {fi.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RatingStars rating={fi.rating} />
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CAT_COLORS[fi.category]}`}>{CAT_ICONS[fi.category]} {catLabels[fi.category]}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[fi.status]}`}>{statusLabels[fi.status]}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">{fi.message}</p>
                {fi.adminNote && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
                    <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{fi.adminNote}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => setSelected(fi)} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">{f.detailRespond}</button>
                <button onClick={() => handleDelete(fi.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 flex items-center gap-1 justify-center"><Trash2 size={11} /> {t.common.delete}</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16 bg-white border border-dashed border-gray-200 rounded-xl">{f.noFeedback}</div>
        )}
      </div>

      {selected && (
        <DetailModal fb={selected} onClose={() => setSelected(null)} onUpdate={() => { refresh(); setSelected(null); }} />
      )}
    </div>
  );
}
