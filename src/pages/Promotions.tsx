import { useState, useEffect } from "react";
import { ImageUploadField } from "@/components/ImageUploadField";

interface Promotion {
  id: string;
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  imageUrl: string;
  discountPct?: number;
  discountFlat?: number;
  discountCode?: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt: string;
}

const API = "/api/promotions";

const EMPTY: Omit<Promotion, "id" | "createdAt"> = {
  title_en: "",
  title_th: "",
  description_en: "",
  description_th: "",
  imageUrl: "",
  discountPct: undefined,
  discountFlat: undefined,
  discountCode: "",
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: "",
  active: true,
};

function PromoCard({
  promo,
  onEdit,
  onDelete,
  onToggle,
}: {
  promo: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
      {promo.imageUrl ? (
        <div className="relative h-36 bg-muted">
          <img src={promo.imageUrl} alt={promo.title_en} className="w-full h-full object-cover" />
          {promo.discountPct && (
            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {promo.discountPct}% OFF
            </span>
          )}
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          {promo.discountPct ? (
            <div className="text-center text-white">
              <div className="text-3xl font-black">{promo.discountPct}%</div>
              <div className="text-sm font-semibold opacity-80">OFF</div>
            </div>
          ) : (
            <span className="text-4xl">🏷️</span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{promo.title_en}</p>
            {promo.title_th && (
              <p className="text-xs text-muted-foreground truncate">{promo.title_th}</p>
            )}
          </div>
          <button
            onClick={onToggle}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              promo.active
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${promo.active ? "bg-green-500" : "bg-gray-400"}`} />
            {promo.active ? "Active" : "Inactive"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{promo.description_en}</p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {promo.discountCode && (
            <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-mono">
              {promo.discountCode}
            </span>
          )}
          {promo.validUntil && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              Until {promo.validUntil}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border mt-1">
          <button
            onClick={onEdit}
            className="flex-1 text-xs font-semibold text-primary hover:bg-primary/5 py-1.5 rounded-lg transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 text-xs font-semibold text-destructive hover:bg-destructive/5 py-1.5 rounded-lg transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<Promotion, "id" | "createdAt">;
  onSave: (data: Omit<Promotion, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {initial.title_en ? "Edit Promotion" : "New Promotion"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title (EN) *</label>
              <input
                value={form.title_en}
                onChange={(e) => set("title_en", e.target.value)}
                placeholder="e.g. New Year Special"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title (TH)</label>
              <input
                value={form.title_th}
                onChange={(e) => set("title_th", e.target.value)}
                placeholder="e.g. โปรโมชั่นปีใหม่"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description (EN)</label>
            <textarea
              value={form.description_en}
              onChange={(e) => set("description_en", e.target.value)}
              rows={2}
              placeholder="Describe this promotion..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description (TH)</label>
            <textarea
              value={form.description_th}
              onChange={(e) => set("description_th", e.target.value)}
              rows={2}
              placeholder="รายละเอียดโปรโมชั่น..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <ImageUploadField
            label="Promotion Image"
            value={form.imageUrl}
            onChange={(v) => set("imageUrl", v)}
            hint="Recommended 800×400 px. Upload a file or paste a URL."
            previewHeight="h-28"
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Discount %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.discountPct ?? ""}
                onChange={(e) => set("discountPct", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 20"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Flat Discount ฿</label>
              <input
                type="number"
                min={0}
                value={form.discountFlat ?? ""}
                onChange={(e) => set("discountFlat", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 100"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Promo Code</label>
              <input
                value={form.discountCode ?? ""}
                onChange={(e) => set("discountCode", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valid From</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valid Until</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <button
              onClick={() => set("active", !form.active)}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.active ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm font-medium text-foreground">
              {form.active ? "Active — visible in app" : "Inactive — hidden from app"}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (!form.title_en.trim()) return; onSave(form); }}
            disabled={!form.title_en.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Save Promotion
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchAll = async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setItems(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async (data: Omit<Promotion, "id" | "createdAt">) => {
    try {
      await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      await fetchAll();
    } catch {}
    setAdding(false);
  };

  const handleEdit = async (data: Omit<Promotion, "id" | "createdAt">) => {
    if (!editing) return;
    try {
      await fetch(`${API}/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      await fetchAll();
    } catch {}
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      await fetchAll();
    } catch {}
    setDeleteConfirm(null);
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await fetch(`${API}/${promo.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !promo.active }) });
      await fetchAll();
    } catch {}
  };

  const visible = items.filter((p) =>
    filter === "all" ? true : filter === "active" ? p.active : !p.active
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Updates & Promotions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage banners shown in the "Updates & Promotions" section of the mobile app
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="text-base">＋</span> Add Promotion
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: items.length, color: "text-foreground" },
          { label: "Active", value: items.filter((p) => p.active).length, color: "text-green-600" },
          { label: "Inactive", value: items.filter((p) => !p.active).length, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border px-4 py-3 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6 w-fit">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3 animate-pulse">🏷️</div>
          <p className="text-sm">Loading promotions...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="font-semibold text-lg">No promotions yet</p>
          <p className="text-sm mt-1">Click "Add Promotion" to create your first banner</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onEdit={() => setEditing(promo)}
              onDelete={() => setDeleteConfirm(promo.id)}
              onToggle={() => handleToggle(promo)}
            />
          ))}
        </div>
      )}

      {adding && (
        <PromoFormModal
          initial={{ ...EMPTY }}
          onSave={handleAdd}
          onClose={() => setAdding(false)}
        />
      )}

      {editing && (
        <PromoFormModal
          initial={{
            title_en: editing.title_en,
            title_th: editing.title_th,
            description_en: editing.description_en,
            description_th: editing.description_th,
            imageUrl: editing.imageUrl,
            discountPct: editing.discountPct,
            discountFlat: editing.discountFlat,
            discountCode: editing.discountCode,
            validFrom: editing.validFrom,
            validUntil: editing.validUntil,
            active: editing.active,
          }}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-foreground mb-1">Delete Promotion?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              "{items.find((p) => p.id === deleteConfirm)?.title_en}" will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
