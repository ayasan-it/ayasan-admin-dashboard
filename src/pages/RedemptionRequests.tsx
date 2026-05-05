import { useState, useEffect, useMemo } from "react";
import { useT } from "@/i18n";
import { RefreshCw, Check, X, Copy, Mail, Phone, Gift, Clock, ChevronDown } from "lucide-react";

interface GiftRedemptionRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  gift_id: string;
  gift_name: string;
  gift_type: string;
  points_used: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requested_at: string;
  reviewed_at?: string;
  admin_note?: string;
  code?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  approved:  "bg-green-50 text-green-700 border-green-200",
  rejected:  "bg-red-50 text-red-600 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "⏳",
  approved: "✅",
  rejected: "❌",
  completed: "🎁",
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

function RequestRow({ req, onUpdate, onDelete }: {
  req: GiftRedemptionRequest;
  onUpdate: (id: string, updates: Partial<GiftRedemptionRequest>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [note, setNote]           = useState(req.admin_note ?? "");
  const [code, setCode]           = useState(req.code ?? "");
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);

  async function approve() {
    setSaving(true);
    await onUpdate(req.id, { status: "approved", admin_note: note, code: code || undefined });
    setSaving(false);
    setExpanded(false);
  }

  async function reject() {
    setSaving(true);
    await onUpdate(req.id, { status: "rejected", admin_note: note });
    setSaving(false);
    setExpanded(false);
  }

  function copyEmail() {
    navigator.clipboard.writeText(req.user_email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isPending = req.status === "pending";

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${isPending ? "border-amber-300 shadow-sm shadow-amber-100" : "border-border"}`}>
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* User avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">
            {req.user_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{req.user_name}</span>
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
            <button
              onClick={copyEmail}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
            >
              <Mail size={11} />
              <span>{req.user_email}</span>
              <Copy size={9} className={`ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? "text-green-500 opacity-100" : ""}`} />
              {copied && <span className="text-green-500 text-[10px]">Copied!</span>}
            </button>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone size={11} />
              {req.user_phone || "—"}
            </span>
          </div>
        </div>

        {/* Gift info */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="flex items-center gap-1.5 justify-end">
            <Gift size={12} className="text-primary" />
            <span className="text-sm font-medium text-foreground max-w-[160px] truncate">{req.gift_name}</span>
          </div>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <span className="text-xs font-bold text-primary">⭐ {req.points_used.toLocaleString()} pts</span>
          </div>
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

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-4">
          {/* Gift type + ID */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">User</p>
              <p className="font-medium">{req.user_name}</p>
              <p className="text-muted-foreground">{req.user_email}</p>
              <p className="text-muted-foreground">{req.user_phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Gift</p>
              <p className="font-medium">{req.gift_name}</p>
              <p className="text-muted-foreground capitalize">{req.gift_type}</p>
              <p className="text-primary font-bold">⭐ {req.points_used.toLocaleString()} pts</p>
            </div>
          </div>

          {/* Code field (for approved or when assigning code) */}
          {(isPending || req.code) && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Voucher Code (optional)
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. STBK-2026-XXXX"
                readOnly={!isPending}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 read-only:bg-muted read-only:text-muted-foreground"
              />
            </div>
          )}

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
              placeholder="Internal note about this request…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none read-only:bg-muted read-only:text-muted-foreground"
            />
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={approve}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                <Check size={14} />
                Approve & Send Code
              </button>
              <button
                onClick={reject}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                <X size={14} />
                Reject
              </button>
              <button
                onClick={() => onDelete(req.id)}
                className="ml-auto flex items-center gap-1 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs hover:bg-accent transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RedemptionRequests() {
  const [requests, setRequests] = useState<GiftRedemptionRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/gift-redemptions");
      if (!res.ok) throw new Error("Failed");
      setRequests(await res.json());
      setError(null);
    } catch {
      setError("Failed to load redemption requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  async function handleUpdate(id: string, updates: Partial<GiftRedemptionRequest>) {
    try {
      const res = await fetch(`/api/gift-redemptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) await load();
    } catch {
      setError("Update failed.");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/gift-redemptions/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = useMemo(() =>
    requests.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return !q || r.user_name.toLowerCase().includes(q) || r.user_email.toLowerCase().includes(q) || r.gift_name.toLowerCase().includes(q);
    }),
    [requests, statusFilter, search]
  );

  const pendingCount   = requests.filter(r => r.status === "pending").length;
  const approvedCount  = requests.filter(r => r.status === "approved").length;
  const rejectedCount  = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            🎁 Gift Redemption Requests
            {pendingCount > 0 && (
              <span className="text-sm px-2.5 py-0.5 bg-red-500 text-white rounded-full font-bold animate-pulse">
                {pendingCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {requests.length} total requests · Refreshes every 30s
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending",  value: pendingCount,  color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Approved", value: approvedCount, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { label: "Rejected", value: rejectedCount, color: "text-red-600",   bg: "bg-red-50 border-red-200" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
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
              {s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, gift…"
          className="flex-1 min-w-48 border border-border rounded-lg px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {statusFilter === "pending" ? "🎉 No pending requests — all caught up!" : "No requests found."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestRow
              key={req.id}
              req={req}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
