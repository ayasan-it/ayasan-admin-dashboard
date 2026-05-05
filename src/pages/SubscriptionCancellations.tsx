import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Check, X, Clock, ChevronDown, Phone, AlertTriangle, CalendarDays, Repeat } from "lucide-react";

interface SubscriptionCancellationRequest {
  id: string;
  booking_id: string;
  service_name: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  cancel_reason: string;
  sessions_remaining: number;
  monthly_amount: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at?: string;
  admin_note?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<string, string> = {
  pending:  "⏳",
  approved: "✅",
  rejected: "❌",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function CancellationRow({ req, onUpdate }: {
  req: SubscriptionCancellationRequest;
  onUpdate: (id: string, updates: Partial<SubscriptionCancellationRequest>) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote]         = useState(req.admin_note ?? "");
  const [saving, setSaving]     = useState(false);

  const isPending = req.status === "pending";

  async function approve() {
    setSaving(true);
    await onUpdate(req.id, { status: "approved", admin_note: note });
    setSaving(false);
    setExpanded(false);
  }

  async function reject() {
    setSaving(true);
    await onUpdate(req.id, { status: "rejected", admin_note: note });
    setSaving(false);
    setExpanded(false);
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all
      ${isPending ? "border-amber-300 shadow-sm shadow-amber-100" : "border-border"}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">
            {req.customer_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Customer info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{req.customer_name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[req.status]}`}>
              {STATUS_ICONS[req.status]} {req.status.toUpperCase()}
            </span>
            {isPending && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone size={10} />
              {req.customer_phone || "—"}
            </span>
            <span className="flex items-center gap-1 text-xs text-primary font-semibold">
              <Repeat size={10} />
              {req.service_name}
            </span>
          </div>
        </div>

        {/* Reason pill + amount */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 font-medium max-w-[200px] truncate">
              {req.cancel_reason}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            ฿{(req.monthly_amount ?? 0).toLocaleString()}/mo · {req.sessions_remaining ?? 0} sessions left
          </span>
        </div>

        {/* Time + expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              {timeAgo(req.requested_at)}
            </div>
            {req.reviewed_at && (
              <div className="text-[10px] text-muted-foreground">
                Reviewed {timeAgo(req.reviewed_at)}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Customer */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Customer</p>
              <p className="font-semibold text-foreground">{req.customer_name}</p>
              <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                <Phone size={10} />{req.customer_phone}
              </p>
            </div>
            {/* Subscription */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Subscription</p>
              <p className="font-semibold text-foreground">{req.service_name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                ฿{(req.monthly_amount ?? 0).toLocaleString()}/month
              </p>
              <p className="text-xs mt-0.5">
                <span className="font-medium">{req.sessions_remaining ?? 0}</span>
                <span className="text-muted-foreground"> sessions remaining (will be completed)</span>
              </p>
            </div>
          </div>

          {/* Cancel reason highlight */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Cancellation Reason</p>
              <p className="text-sm font-medium text-amber-900">{req.cancel_reason}</p>
            </div>
          </div>

          {/* Booking ID */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays size={12} />
            <span>Booking ID: <code className="font-mono bg-muted px-1 rounded">{req.booking_id}</code></span>
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Admin Note
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              readOnly={!isPending}
              rows={2}
              placeholder="Internal note about this cancellation…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none read-only:bg-muted read-only:text-muted-foreground"
            />
          </div>

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={approve}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                <Check size={14} />
                Approve Cancellation
              </button>
              <button
                onClick={reject}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                <X size={14} />
                Reject (Keep Active)
              </button>
            </div>
          )}

          {!isPending && req.reviewed_at && (
            <div className={`text-xs rounded-lg px-3 py-2 font-medium
              ${req.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {req.status === "approved"
                ? "✅ Cancellation approved — subscription will not renew"
                : "❌ Cancellation rejected — subscription remains active"}
              {req.admin_note && <p className="mt-1 font-normal opacity-80">{req.admin_note}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionCancellations() {
  const [requests, setRequests]     = useState<SubscriptionCancellationRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch]         = useState("");

  async function load() {
    try {
      const res = await fetch("/api/subscription-cancellations");
      if (!res.ok) throw new Error("Failed");
      setRequests(await res.json());
      setError(null);
    } catch {
      setError("Failed to load cancellation requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleUpdate(id: string, updates: Partial<SubscriptionCancellationRequest>) {
    try {
      const res = await fetch(`/api/subscription-cancellations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) await load();
    } catch {
      setError("Update failed.");
    }
  }

  const filtered = useMemo(() =>
    requests.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return !q
        || r.customer_name.toLowerCase().includes(q)
        || r.service_name.toLowerCase().includes(q)
        || r.cancel_reason.toLowerCase().includes(q);
    }),
    [requests, statusFilter, search]
  );

  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            🚫 Subscription Cancellations
            {pendingCount > 0 && (
              <span className="text-sm px-2.5 py-0.5 bg-red-500 text-white rounded-full font-bold animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {requests.length} total requests · Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Review", value: pendingCount,  color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Approved",       value: approvedCount, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { label: "Rejected",       value: rejectedCount, color: "text-red-600",   bg: "bg-red-50 border-red-200"   },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Notice about sessions */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <span className="text-lg">ℹ️</span>
        <p className="text-sm text-blue-800">
          <strong>Policy reminder:</strong> When a cancellation is approved, all remaining paid sessions will still be completed.
          The subscription will simply not renew for the next billing cycle.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${
                statusFilter === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, service, reason…"
          className="flex-1 min-w-48 border border-border rounded-lg px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {statusFilter === "pending"
            ? "🎉 No pending cancellation requests — all caught up!"
            : "No cancellation requests found."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <CancellationRow key={req.id} req={req} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
