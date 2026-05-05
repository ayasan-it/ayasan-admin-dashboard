import { useState, useMemo, useRef } from "react";
import {
  loadGifts, addGift, updateGift, deleteGift,
  loadGiftCodes, addGiftCodes, deleteGiftCode, getCodesForGift, getUnusedCodeCount,
  loadGiftRedemptions, updateGiftRedemption, getRedemptionsForGift,
  GiftItem, GiftCategory, GiftType, CodeDelivery, GiftCode, GiftRedemption,
} from "@/data/store";
import { useT } from "@/i18n";
import { X, Package, Tag, Layers, Upload, ChevronDown, TriangleAlert, Copy, Trash2, RefreshCw } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

const CATEGORIES: GiftCategory[] = ["voucher", "product", "experience", "session", "other"];
const GIFT_TYPES: { value: GiftType; label: string; color: string }[] = [
  { value: "evoucher",      label: "E-Voucher",     color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "physical",      label: "Physical",      color: "bg-green-50 text-green-700 border-green-200" },
  { value: "discount_code", label: "Discount Code", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "experience",    label: "Experience",    color: "bg-purple-50 text-purple-700 border-purple-200" },
];
const CODE_DELIVERY: { value: CodeDelivery; label: string; desc: string }[] = [
  { value: "reveal_in_app", label: "Reveal in App",  desc: "Code shown on screen after redemption" },
  { value: "email_only",    label: "Email Only",     desc: "Code sent to user's email address" },
  { value: "both",          label: "Both",           desc: "Shown in app AND emailed to user" },
];
const CATEGORY_COLORS: Record<GiftCategory, string> = {
  voucher:    "bg-blue-50 text-blue-700 border-blue-200",
  product:    "bg-green-50 text-green-700 border-green-200",
  experience: "bg-purple-50 text-purple-700 border-purple-200",
  session:    "bg-orange-50 text-orange-700 border-orange-200",
  other:      "bg-gray-50 text-gray-600 border-gray-200",
};
const CATEGORY_ICONS: Record<GiftCategory, string> = {
  voucher: "🎫", product: "📦", experience: "✨", session: "🧹", other: "🎁",
};

type FormData = Omit<GiftItem, "id" | "createdAt" | "redeemedCount">;
const EMPTY_FORM: FormData = {
  name_en: "", name_th: "", description_en: "", description_th: "",
  imageUrl: "", pointsRequired: 500, category: "voucher", stock: null, active: true,
  gift_type: "evoucher", partner_name: "", partner_logo_url: "", code_delivery: "both",
  terms_url: "", valid_until: "",
  rewardDetails_en: "", rewardDetails_th: "",
  termsAndConditions_en: "", termsAndConditions_th: "",
};

function giftTypeBadge(type: GiftType) {
  const t = GIFT_TYPES.find(g => g.value === type);
  return t ? (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${t.color}`}>{t.label}</span>
  ) : null;
}

// ─── Voucher Codes Tab ────────────────────────────────────────────────────────
function VoucherCodesTab({ giftId, giftType }: { giftId: string; giftType: GiftType }) {
  const [codes, setCodes] = useState<GiftCode[]>(() => getCodesForGift(giftId));
  const [pastedCodes, setPastedCodes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "used">("all");
  const [codeSearch, setCodeSearch] = useState("");
  const [page, setPage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  const refresh = () => setCodes(getCodesForGift(giftId));

  const totalCodes = codes.length;
  const usedCodes  = codes.filter(c => c.is_used).length;
  const freeCodes  = totalCodes - usedCodes;
  const usedPct    = totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;
  const lowStock   = freeCodes > 0 && freeCodes < 10;

  const filtered = useMemo(() => codes.filter(c => {
    if (filterStatus === "available" && c.is_used) return false;
    if (filterStatus === "used"      && !c.is_used) return false;
    if (codeSearch && !c.code.toLowerCase().includes(codeSearch.toLowerCase())) return false;
    return true;
  }), [codes, filterStatus, codeSearch]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const header = lines[0]?.toLowerCase().includes("code") ? lines.slice(1) : lines;
      setPastedCodes(header.join("\n"));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleUpload() {
    const lines = pastedCodes.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const existing = new Set(loadGiftCodes().filter(c => c.gift_id === giftId).map(c => c.code));
    let inserted = 0; let skipped = 0;
    const newCodes: GiftCode[] = [];
    for (const code of lines) {
      if (existing.has(code)) { skipped++; continue; }
      newCodes.push({ id: `gc${Date.now()}-${Math.random().toString(36).slice(2,7)}`, gift_id: giftId, code, is_used: false, created_at: new Date().toISOString(), expires_at: expiresAt || undefined });
      inserted++;
    }
    if (newCodes.length) addGiftCodes(newCodes);
    setUploadResult({ inserted, skipped });
    setPastedCodes(""); setExpiresAt("");
    refresh();
  }

  function handleDelete(id: string) {
    deleteGiftCode(id);
    refresh();
  }

  const isEvoucher = giftType === "evoucher" || giftType === "discount_code";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Codes", value: totalCodes, color: "text-foreground" },
          { label: "Used",        value: usedCodes,  color: "text-red-600" },
          { label: "Remaining",   value: freeCodes,  color: "text-green-600" },
          { label: "% Used",      value: `${usedPct}%`, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-muted rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      {totalCodes > 0 && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usedPct}%` }} />
        </div>
      )}
      {lowStock && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm font-medium">
          <TriangleAlert size={16} />
          ⚠ Low stock — only {freeCodes} code{freeCodes !== 1 ? "s" : ""} left
        </div>
      )}

      {!isEvoucher && (
        <div className="px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground">
          Voucher codes are only applicable to E-Voucher and Discount Code gift types.
        </div>
      )}

      {isEvoucher && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Upload Voucher Codes</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Paste codes (one per line)</label>
              <textarea
                value={pastedCodes}
                onChange={e => setPastedCodes(e.target.value)}
                rows={5}
                placeholder={"STBK-2026-XXXX\nSTBK-2026-YYYY\nSTBK-2026-ZZZZ"}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">One code per line. Header row is optional.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Or upload CSV file</label>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center">
                  <Upload size={14} /> Choose CSV File
                </button>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Expiry date (optional)</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleUpload} disabled={!pastedCodes.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              <Upload size={14} />
              Upload {pastedCodes.trim().split(/\r?\n/).filter(Boolean).length || 0} codes
            </button>
            {uploadResult && (
              <span className="text-sm text-green-600 font-medium">
                ✓ {uploadResult.inserted} added, {uploadResult.skipped} skipped
              </span>
            )}
          </div>
        </div>
      )}

      {/* Code table */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input value={codeSearch} onChange={e => { setCodeSearch(e.target.value); setPage(0); }}
            placeholder="Search code…"
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-40" />
          <div className="flex gap-1.5 ml-auto">
            {(["all", "available", "used"] as const).map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(0); }}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${filterStatus === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No codes found.
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {["Code", "Status", "Used By", "Used At", "Expires At", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium">{c.code}</td>
                    <td className="px-3 py-2.5">
                      {c.is_used
                        ? <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-medium">✓ Used</span>
                        : <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full font-medium">— Available</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.used_by_name || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.used_at ? new Date(c.used_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2.5">
                      {!c.is_used && (
                        <button onClick={() => handleDelete(c.id)}
                          className="p-1 text-muted-foreground hover:text-red-600 transition-colors rounded">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} codes</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">← Prev</button>
              <span className="px-3 py-1">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Redemptions Tab ──────────────────────────────────────────────────────────
function RedemptionsTab({ giftId }: { giftId: string }) {
  const [redemptions, setRedemptions] = useState<GiftRedemption[]>(() => getRedemptionsForGift(giftId));
  const [cancelModal, setCancelModal] = useState<GiftRedemption | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled" | "refunded">("all");

  const refresh = () => setRedemptions(getRedemptionsForGift(giftId));

  const filtered = useMemo(() => redemptions.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.redeemed_at < dateFrom) return false;
    if (dateTo   && r.redeemed_at > dateTo + "T23:59:59Z") return false;
    return true;
  }), [redemptions, statusFilter, dateFrom, dateTo]);

  function handleCancel() {
    if (!cancelModal) return;
    updateGiftRedemption(cancelModal.id, { status: "refunded", cancelled_at: new Date().toISOString(), admin_note: cancelNote });
    setCancelModal(null); setCancelNote(""); refresh();
  }

  function exportCSV() {
    const header = "Date,Customer,Email,Points Used,Code,Status";
    const rows = filtered.map(r =>
      `${new Date(r.redeemed_at).toLocaleString()},${r.user_name},${r.user_email},${r.points_used},${r.code},${r.status}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `redemptions-${giftId}.csv` });
    a.click(); URL.revokeObjectURL(url);
  }

  const STATUS_COLORS: Record<string, string> = {
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-gray-50 text-gray-600 border-gray-200",
    refunded:  "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(["all", "completed", "cancelled", "refunded"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${statusFilter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none" />
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors">
            ↓ Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No redemptions found.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Date", "Customer", "Email", "Points", "Code", "Status", ""].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.redeemed_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-xs font-medium">{r.user_name}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.user_email}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-primary">{r.points_used.toLocaleString()} pts</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      {r.code}
                      <button onClick={() => navigator.clipboard.writeText(r.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy size={11} />
                      </button>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.status === "completed" && (
                      <button onClick={() => { setCancelModal(r); setCancelNote(""); }}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                        <RefreshCw size={11} /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel/Refund modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-1">Refund Redemption</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Refund <strong>{cancelModal.points_used} pts</strong> to <strong>{cancelModal.user_name}</strong> for "{cancelModal.gift_name}"?
            </p>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Reason (optional)</label>
            <input value={cancelNote} onChange={e => setCancelNote(e.target.value)}
              placeholder="Customer request, system error…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleCancel}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                Confirm Refund
              </button>
              <button onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gift Detail Panel ────────────────────────────────────────────────────────
type DetailTab = "info" | "codes" | "redemptions";
function GiftDetailPanel({ gift, onClose, onSaved }: { gift: GiftItem; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<DetailTab>("info");
  const [form, setForm] = useState<FormData>({
    name_en: gift.name_en, name_th: gift.name_th,
    description_en: gift.description_en, description_th: gift.description_th,
    imageUrl: gift.imageUrl, pointsRequired: gift.pointsRequired,
    category: gift.category, stock: gift.stock, active: gift.active,
    gift_type: gift.gift_type ?? "evoucher",
    partner_name: gift.partner_name ?? "",
    partner_logo_url: gift.partner_logo_url ?? "",
    code_delivery: gift.code_delivery ?? "both",
    terms_url: gift.terms_url ?? "",
    valid_until: gift.valid_until ?? "",
    rewardDetails_en: gift.rewardDetails_en ?? "",
    rewardDetails_th: gift.rewardDetails_th ?? "",
    termsAndConditions_en: gift.termsAndConditions_en ?? "",
    termsAndConditions_th: gift.termsAndConditions_th ?? "",
  });
  const [stockInput, setStockInput] = useState(gift.stock === null ? "" : String(gift.stock));
  const [saved, setSaved] = useState(false);
  const unusedCount = getUnusedCodeCount(gift.id);

  function handleSave() {
    const stockVal = stockInput.trim() === "" ? null : Math.max(0, parseInt(stockInput) || 0);
    updateGift(gift.id, { ...form, stock: stockVal });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "info",        label: "Gift Info" },
    { id: "codes",       label: `Voucher Codes (${unusedCount} left)` },
    { id: "redemptions", label: "Redemptions" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-lg">{gift.name_en}</h2>
            <p className="text-xs text-muted-foreground">{gift.partner_name || "No partner"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border flex-shrink-0 px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 p-6">
          {tab === "info" && (
            <div className="space-y-5">
              {/* Gift Type + Partner */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Gift Type</label>
                  <select value={form.gift_type} onChange={e => setForm(f => ({ ...f, gift_type: e.target.value as GiftType }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {GIFT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Partner Name</label>
                  <input value={form.partner_name} onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))}
                    placeholder="e.g. Starbucks Thailand"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (EN)</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    placeholder="Coffee Voucher"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (TH)</label>
                  <input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
                    placeholder="บัตรกาแฟ"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description (EN)</label>
                  <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                    rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description (TH)</label>
                  <textarea value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))}
                    rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              </div>

              {/* Partner Logo + Terms */}
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadField
                  label="Partner Logo"
                  value={form.partner_logo_url}
                  onChange={v => setForm(f => ({ ...f, partner_logo_url: v }))}
                  hint="Square logo, min 200×200 px"
                  previewHeight="h-20"
                />
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Terms URL (optional)</label>
                  <input value={form.terms_url} onChange={e => setForm(f => ({ ...f, terms_url: e.target.value }))}
                    placeholder="https://partner.com/terms"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <ImageUploadField label="Gift Image" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))}
                hint="Recommended 400×300 px" previewHeight="h-24" />

              {/* Points + Stock + Valid Until */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">⭐ Points Required</label>
                  <input type="number" min="1" step="50" value={form.pointsRequired}
                    onChange={e => setForm(f => ({ ...f, pointsRequired: Math.max(1, Number(e.target.value)) }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Stock (blank = ∞)</label>
                  <input type="number" min="0" value={stockInput} onChange={e => setStockInput(e.target.value)}
                    placeholder="∞"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Code Delivery */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Code Delivery</label>
                <div className="grid grid-cols-3 gap-2">
                  {CODE_DELIVERY.map(d => (
                    <label key={d.value} className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${form.code_delivery === d.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="delivery" value={d.value} checked={form.code_delivery === d.value}
                          onChange={() => setForm(f => ({ ...f, code_delivery: d.value as CodeDelivery }))} className="accent-primary" />
                        <span className="text-sm font-medium text-foreground">{d.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-5">{d.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"><span className="flex items-center gap-1"><Layers size={12} /> Category</span></label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GiftCategory }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {([true, false] as const).map(v => (
                      <label key={String(v)} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${form.active === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <input type="radio" name="active" checked={form.active === v} onChange={() => setForm(f => ({ ...f, active: v }))} className="accent-primary" />
                        <span className="text-sm">{v ? "✅ Active" : "⛔ Inactive"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reward Details */}
              <div className="border-t border-border pt-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🎁 Reward Details <span className="font-normal normal-case">(shown to users on voucher screen)</span></p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Reward Details (EN)</label>
                    <textarea value={form.rewardDetails_en} onChange={e => setForm(f => ({ ...f, rewardDetails_en: e.target.value }))}
                      rows={3} placeholder="e.g. Present your e-voucher barcode with the cashier during the payment process."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Reward Details (TH)</label>
                    <textarea value={form.rewardDetails_th} onChange={e => setForm(f => ({ ...f, rewardDetails_th: e.target.value }))}
                      rows={3} placeholder="e.g. แสดงบาร์โค้ด e-voucher กับแคชเชียร์"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">📋 Terms & Conditions <span className="font-normal normal-case">(shown on voucher detail screen)</span></p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">T&C (EN)</label>
                    <textarea value={form.termsAndConditions_en} onChange={e => setForm(f => ({ ...f, termsAndConditions_en: e.target.value }))}
                      rows={5} placeholder={"This e-voucher can be used at all branches...\nEach e-voucher can be used for one receipt only."}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">T&C (TH)</label>
                    <textarea value={form.termsAndConditions_th} onChange={e => setForm(f => ({ ...f, termsAndConditions_th: e.target.value }))}
                      rows={5} placeholder={"บัตรกำนัลนี้สามารถใช้ได้ที่ทุกสาขา...\nบัตรกำนัลแต่ละใบใช้ได้สำหรับ 1 ใบเสร็จ"}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "codes" && <VoucherCodesTab giftId={gift.id} giftType={form.gift_type} />}
          {tab === "redemptions" && <RedemptionsTab giftId={gift.id} />}
        </div>

        {/* Footer */}
        {tab === "info" && (
          <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Gift ID: {gift.id} · Created {gift.createdAt}</p>
            <button onClick={handleSave}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gift Card (list view) ────────────────────────────────────────────────────
function GiftCard({ g, onView, onDelete, onToggleActive }: {
  g: GiftItem & { unusedCount: number };
  onView: () => void; onDelete: () => void; onToggleActive: () => void;
}) {
  const { t, lang } = useT();
  const gc = t.giftCatalog;
  const name = lang === "th" ? (g.name_th || g.name_en) : (g.name_en || g.name_th);
  const catLabel = gc.categories[g.category] ?? g.category;
  const gtInfo = GIFT_TYPES.find(x => x.value === (g.gift_type ?? "evoucher"));
  const lowStock = g.unusedCount > 0 && g.unusedCount < 10;

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:border-primary/20 cursor-pointer ${g.active ? "border-border" : "border-dashed border-border opacity-60"}`}
      onClick={onView}>
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {g.imageUrl
          ? <img src={g.imageUrl} alt={name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{CATEGORY_ICONS[g.category]}</div>
        }
        {/* Partner logo */}
        {g.partner_logo_url && (
          <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md overflow-hidden flex items-center justify-center p-1">
            <img src={g.partner_logo_url} alt={g.partner_name} className="w-full h-full object-contain"
              onError={e => (e.currentTarget.style.display = "none")} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
          <span className="text-[10px] font-black text-white bg-primary px-1.5 py-0.5 rounded-full">
            ⭐ {g.pointsRequired.toLocaleString()} pts
          </span>
        </div>
        {lowStock && (
          <div className="absolute top-2 right-2">
            <TriangleAlert size={14} className="text-orange-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {gtInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${gtInfo.color}`}>{gtInfo.label}</span>}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[g.category]}`}>
            {CATEGORY_ICONS[g.category]} {catLabel}
          </span>
        </div>
        <h3 className="font-bold text-foreground text-sm leading-snug mb-0.5 line-clamp-1">{name}</h3>
        {g.partner_name && <p className="text-xs text-muted-foreground mb-1">{g.partner_name}</p>}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package size={11} />
            {g.gift_type === "evoucher" || g.gift_type === "discount_code"
              ? `${g.unusedCount} codes left`
              : g.stock === null ? gc.unlimited : `${g.stock} left`}
          </span>
          <span className="flex items-center gap-1">
            <Tag size={11} />
            {g.redeemedCount} {gc.redeemed}
          </span>
        </div>

        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="flex-1 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 font-semibold transition-colors">
            Manage
          </button>
          <button onClick={onToggleActive} className="py-1.5 px-2 bg-muted text-foreground text-xs rounded-lg hover:bg-accent transition-colors">
            {g.active ? "⛔" : "✅"}
          </button>
          <button onClick={onDelete} className="py-1.5 px-2 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Gift Form ────────────────────────────────────────────────────────────
function NewGiftForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const gc = t.giftCatalog;
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [stockInput, setStockInput] = useState("");

  function handleSave() {
    if (!form.name_en.trim() && !form.name_th.trim()) return;
    const stockVal = stockInput.trim() === "" ? null : Math.max(0, parseInt(stockInput) || 0);
    addGift({
      ...form, stock: stockVal,
      id: `g${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), redeemedCount: 0,
    });
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-foreground text-lg">{gc.addGift}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Gift Type + Partner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Gift Type</label>
              <select value={form.gift_type} onChange={e => setForm(f => ({ ...f, gift_type: e.target.value as GiftType }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                {GIFT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Partner Name</label>
              <input value={form.partner_name} onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))}
                placeholder="e.g. Starbucks Thailand"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{gc.nameEn}</label>
              <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                placeholder="Coffee Voucher"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{gc.nameTh}</label>
              <input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
                placeholder="บัตรกาแฟ"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{gc.descEn}</label>
              <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{gc.descTh}</label>
              <textarea value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))}
                rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              label="Partner Logo"
              value={form.partner_logo_url}
              onChange={v => setForm(f => ({ ...f, partner_logo_url: v }))}
              hint="Square logo, min 200×200 px"
              previewHeight="h-20"
            />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Terms URL (optional)</label>
              <input value={form.terms_url} onChange={e => setForm(f => ({ ...f, terms_url: e.target.value }))}
                placeholder="https://partner.com/terms"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <ImageUploadField label="Gift Image" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))}
            hint="Recommended 400×300 px. Upload a file directly or paste a URL." previewHeight="h-24" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">⭐ {gc.points}</label>
              <input type="number" min="1" step="50" value={form.pointsRequired}
                onChange={e => setForm(f => ({ ...f, pointsRequired: Math.max(1, Number(e.target.value)) }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Stock (blank = ∞)</label>
              <input type="number" min="0" value={stockInput} onChange={e => setStockInput(e.target.value)}
                placeholder="∞"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Code Delivery</label>
            <div className="grid grid-cols-3 gap-2">
              {CODE_DELIVERY.map(d => (
                <label key={d.value} className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${form.code_delivery === d.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="new_delivery" value={d.value} checked={form.code_delivery === d.value}
                      onChange={() => setForm(f => ({ ...f, code_delivery: d.value as CodeDelivery }))} className="accent-primary" />
                    <span className="text-sm font-medium text-foreground">{d.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-5">{d.desc}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Reward Details */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🎁 Reward Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Reward Details (EN)</label>
                <textarea value={form.rewardDetails_en} onChange={e => setForm(f => ({ ...f, rewardDetails_en: e.target.value }))}
                  rows={3} placeholder="e.g. Present your e-voucher barcode with the cashier during the payment process."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Reward Details (TH)</label>
                <textarea value={form.rewardDetails_th} onChange={e => setForm(f => ({ ...f, rewardDetails_th: e.target.value }))}
                  rows={3} placeholder="e.g. แสดงบาร์โค้ด e-voucher กับแคชเชียร์"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
          </div>
          {/* Terms & Conditions */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">📋 Terms & Conditions</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">T&C (EN)</label>
                <textarea value={form.termsAndConditions_en} onChange={e => setForm(f => ({ ...f, termsAndConditions_en: e.target.value }))}
                  rows={4} placeholder={"This e-voucher can be used at all branches...\nEach voucher is for one receipt only."}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">T&C (TH)</label>
                <textarea value={form.termsAndConditions_th} onChange={e => setForm(f => ({ ...f, termsAndConditions_th: e.target.value }))}
                  rows={4} placeholder={"บัตรกำนัลนี้ใช้ได้ที่ทุกสาขา...\nแต่ละใบใช้ได้ 1 ใบเสร็จ"}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <label key={String(v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${form.active === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <input type="radio" name="new_active" checked={form.active === v} onChange={() => setForm(f => ({ ...f, active: v }))} className="accent-primary" />
                  <span className="text-sm">{v ? "✅ Active" : "⛔ Inactive"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex-shrink-0 flex gap-3">
          <button onClick={handleSave}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            {gc.save}
          </button>
          <button onClick={onClose}
            className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GiftCatalog() {
  const { t, lang } = useT();
  const gc = t.giftCatalog;

  const [gifts, setGifts] = useState<GiftItem[]>(loadGifts);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState<GiftItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<GiftCategory | "all">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<GiftType | "all">("all");

  const refresh = () => setGifts(loadGifts());

  const giftsWithCounts = useMemo(() =>
    gifts.map(g => ({ ...g, unusedCount: getUnusedCodeCount(g.id) })),
    [gifts]
  );

  const filtered = useMemo(() => giftsWithCounts.filter(g => {
    const matchCat    = filterCat    === "all" || g.category  === filterCat;
    const matchActive = filterActive === "all" || (filterActive === "active" ? g.active : !g.active);
    const matchType   = filterType   === "all" || g.gift_type === filterType;
    return matchCat && matchActive && matchType;
  }), [giftsWithCounts, filterCat, filterActive, filterType]);

  const totalRedeemed = gifts.reduce((s, g) => s + g.redeemedCount, 0);
  const activeCount   = gifts.filter(g => g.active).length;
  const lowStockCount = giftsWithCounts.filter(g => g.unusedCount > 0 && g.unusedCount < 10).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{gc.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{gc.subtitle}</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          {gc.addGift}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: gc.totalGifts,    value: gifts.length,   icon: "🎁" },
          { label: gc.activeGifts,   value: activeCount,    icon: "✅" },
          { label: gc.totalRedeemed, value: totalRedeemed.toLocaleString(), icon: "🔖" },
          { label: "Low Stock",      value: lowStockCount,  icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterType("all")}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterType === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            All Types
          </button>
          {GIFT_TYPES.map(gt => (
            <button key={gt.value} onClick={() => setFilterType(gt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterType === gt.value ? `${gt.color} font-semibold` : "border-border text-muted-foreground"}`}>
              {gt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {(["all", "active", "inactive"] as const).map(s => (
            <button key={s} onClick={() => setFilterActive(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${filterActive === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>
              {s === "all" ? t.common.all : s === "active" ? gc.active : gc.inactive}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 bg-card border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">🎁</div>
          <p className="text-sm">{gc.noGifts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(g => (
            <GiftCard key={g.id} g={g}
              onView={() => setDetail(g)}
              onDelete={() => setConfirmDelete(g.id)}
              onToggleActive={() => { updateGift(g.id, { active: !g.active }); refresh(); }}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-2">{t.common.confirmDelete}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t.common.deleteWarning}</p>
            <div className="flex gap-3">
              <button onClick={() => { deleteGift(confirmDelete); setConfirmDelete(null); refresh(); }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                {t.common.delete}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNew && <NewGiftForm onClose={() => setShowNew(false)} onSaved={refresh} />}
      {detail && <GiftDetailPanel gift={detail} onClose={() => setDetail(null)} onSaved={refresh} />}
    </div>
  );
}
