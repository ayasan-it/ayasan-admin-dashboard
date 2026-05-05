import { useState, useRef, useEffect } from "react";
import { SERVICE_OPTIONS, AREAS, WorkerStatus } from "@/data/store";
import { useT } from "@/i18n";

const STATUS_COLORS: Record<WorkerStatus, string> = {
  available: "bg-green-100 text-green-700 border-green-200",
  busy:      "bg-yellow-100 text-yellow-700 border-yellow-200",
  off:       "bg-gray-100 text-gray-500 border-gray-200",
};

interface WorkerAccount {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  line_id: string;
  services: string[];
  status: WorkerStatus;
  rating: number;
  completedJobs: number;
  joinedDate: string;
  area: string;
  photoUrl?: string;
  createdAt?: string;
}

type WorkerForm = Omit<WorkerAccount, "id" | "createdAt"> & { password: string };

const EMPTY: WorkerForm = {
  full_name: "", email: "", password: "", phone: "", line_id: "",
  services: [], status: "available",
  rating: 5.0, completedJobs: 0,
  joinedDate: new Date().toISOString().slice(0, 10),
  area: "bangkok", photoUrl: "",
};

const API = "/api";

function WorkerAvatar({ worker, size = 40 }: { worker: Partial<WorkerAccount> & { full_name: string; id: string }; size?: number }) {
  const initials = worker.full_name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#F47A20", "#2196F3", "#9C27B0", "#4CAF50", "#FF5722"];
  const colorIdx = worker.id.charCodeAt(worker.id.length - 1) % colors.length;
  if (worker.photoUrl) {
    return (
      <img src={worker.photoUrl} alt={worker.full_name}
        className="rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 border-2 border-white shadow-sm"
      style={{ width: size, height: size, backgroundColor: colors[colorIdx], fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function Workers() {
  const { t } = useT();
  const [workers, setWorkers] = useState<WorkerAccount[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editing, setEditing] = useState<WorkerAccount | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<WorkerForm>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);

  async function fetchWorkers() {
    try {
      const res = await fetch(`${API}/workers`);
      if (!res.ok) throw new Error("Failed to load");
      const data: WorkerAccount[] = await res.json();
      setWorkers(data);
    } catch {
      setError("Could not load workers from server.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { fetchWorkers(); }, []);

  function openNew() { setIsNew(true); setEditing(null); setForm(EMPTY); setError(null); setShowPassword(false); }
  function openEdit(w: WorkerAccount) {
    setEditing(w); setIsNew(false); setShowPassword(false); setError(null);
    setForm({
      full_name: w.full_name, email: w.email ?? "", password: "", phone: w.phone,
      line_id: w.line_id, services: w.services, status: w.status,
      rating: w.rating, completedJobs: w.completedJobs, joinedDate: w.joinedDate,
      area: w.area, photoUrl: w.photoUrl ?? "",
    });
  }

  async function handleSave() {
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    if (isNew && !form.email.trim()) { setError("Email is required for new accounts."); return; }
    if (isNew && !form.password.trim()) { setError("Password is required for new accounts."); return; }
    setError(null);
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch(`${API}/workers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error ?? "Failed to create worker.");
          return;
        }
      } else if (editing) {
        const body: Partial<WorkerForm> = { ...form };
        if (!body.password) delete body.password;
        const res = await fetch(`${API}/workers/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { setError("Failed to update worker."); return; }
      }
      setEditing(null); setIsNew(false);
      await fetchWorkers();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${API}/workers/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    if (editing?.id === id) setEditing(null);
    await fetchWorkers();
  }

  function toggleService(slug: string) {
    setForm(f => ({ ...f, services: f.services.includes(slug) ? f.services.filter(s => s !== slug) : [...f.services, slug] }));
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, photoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const filtered = workers.filter(w => {
    const matchArea = areaFilter === "all" || w.area === areaFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || w.full_name.toLowerCase().includes(q) || w.phone.includes(q) || w.line_id.includes(q) || w.email.toLowerCase().includes(q);
    return matchArea && matchSearch;
  });

  const showPanel = editing !== null || isNew;

  const workerStatusLabel: Record<string, string> = {
    available: t.status.available, busy: t.status.busy, off: t.status.off,
  };

  const formFields = [
    { label: t.workers.fullName, key: "full_name", type: "text",   placeholder: "Napasorn K." },
    { label: t.workers.phone,    key: "phone",     type: "tel",    placeholder: "+66 85 111 2233" },
    { label: t.workers.lineId,   key: "line_id",   type: "text",   placeholder: "napasornk" },
    { label: t.workers.rating,   key: "rating",    type: "number", placeholder: "4.5" },
    { label: t.workers.jobsDone, key: "completedJobs", type: "number", placeholder: "0" },
    { label: t.workers.joinedDate, key: "joinedDate", type: "date", placeholder: "" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.workers.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{workers.length} {t.workers.registered}</p>
          </div>
          <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
            {t.workers.addWorker}
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t.workers.searchPlaceholder}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">{t.common.allAreas}</option>
            {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          {(["available", "busy", "off"] as const).map(s => (
            <div key={s} className={`px-3 py-2 rounded-lg border text-xs font-medium ${STATUS_COLORS[s]}`}>
              {workers.filter(w => w.status === s).length} {workerStatusLabel[s]}
            </div>
          ))}
        </div>

        {loadingList ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading workers…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(w => (
              <div key={w.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <WorkerAvatar worker={w} size={44} />
                    <div>
                      <div className="font-semibold text-foreground">{w.full_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{w.id}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[w.status]}`}>{workerStatusLabel[w.status]}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><span>📞</span>{w.phone}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span>💬</span>@{w.line_id || "—"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span>📍</span>{AREAS.find(a => a.id === w.area)?.label || w.area}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span>📅</span>{t.workers.joined} {w.joinedDate}</div>
                  {w.email && (
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{w.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {w.services.map(s => { const o = SERVICE_OPTIONS.find(o => o.slug === s); return <span key={s} className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full">{o?.icon} {o?.label || s}</span>; })}
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground">⭐ {w.rating} · {w.completedJobs} {t.workers.jobs}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(w)} className="px-2 py-1 text-xs bg-muted hover:bg-accent rounded-md">{t.common.edit}</button>
                    <button onClick={() => setConfirmDelete(w.id)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md">{t.common.delete}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPanel && (
        <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">{isNew ? t.workers.addWorkerPanel : t.workers.editWorker}</h2>
            <button onClick={() => { setEditing(null); setIsNew(false); setError(null); }} className="text-muted-foreground text-lg">✕</button>
          </div>
          <div className="p-4 space-y-4">
            {/* Photo upload */}
            <div className="pb-2 space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">Profile Photo</label>
              <div className="flex items-center gap-3">
                <WorkerAvatar
                  worker={{ ...editing ?? { id: "new", full_name: form.full_name || "?", rating: 0, completedJobs: 0, joinedDate: "", phone: "", line_id: "", email: "", services: [], status: "available", area: "bangkok" }, photoUrl: form.photoUrl || "" }}
                  size={52}
                />
                <div className="flex-1 space-y-1.5">
                  <input ref={photoFileRef} type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                  <button type="button" onClick={() => photoFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <span>📁</span>
                    <span>{form.photoUrl ? "Change Photo" : "Upload from Computer"}</span>
                  </button>
                  {form.photoUrl && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, photoUrl: "" }))}
                      className="w-full text-[10px] text-red-500 hover:text-red-600 text-center">
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">PNG, JPG, WebP — stored on server.</p>
            </div>

            {/* Basic info fields */}
            {formFields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  step={f.key === "rating" ? "0.1" : undefined}
                  min={f.key === "rating" ? "0" : f.key === "completedJobs" ? "0" : undefined}
                  max={f.key === "rating" ? "5" : undefined}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t.workers.area}</label>
              <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">{t.workers.status}</label>
              <div className="flex gap-2">
                {(["available", "busy", "off"] as const).map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors ${form.status === s ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border hover:border-primary/50"}`}>
                    {workerStatusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">{t.workers.services}</label>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_OPTIONS.map(opt => (
                  <button key={opt.slug} onClick={() => toggleService(opt.slug)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${form.services.includes(opt.slug) ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border hover:border-primary/50"}`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Login credentials section */}
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🔑</span>
                <div>
                  <p className="text-xs font-bold text-primary">App Login Credentials</p>
                  <p className="text-[10px] text-muted-foreground">Worker uses these to log into the mobile app</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  placeholder="worker@ayasan.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {isNew ? "Password" : "New Password (leave blank to keep)"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isNew ? "Set a password" : "Leave blank to keep current"}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setEditing(null); setIsNew(false); setError(null); }} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={handleSave} disabled={!form.full_name.trim() || saving}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">
                {saving ? "Saving…" : isNew ? t.common.add : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2">{t.workers.deleteWorker}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t.common.cannotUndo}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">{t.common.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
