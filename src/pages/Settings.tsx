import { useState } from "react";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useParams } from "wouter";
import { useT } from "@/i18n";
import {
  loadServicePricing, saveServicePricing, ServicePriceConfig, ServiceArea, AREAS,
  loadAcPricing, saveAcPricing, AcTypePrice,
  loadDeepCleanPricing, saveDeepCleanPricing, DeepCleanPackage,
  loadAddonPricing, addAddon, updateAddon, deleteAddon, AddonPriceConfig,
  loadSubscriptionTiers, saveSubscriptionTiers, SubscriptionTier,
  loadSliders, saveSliders, addSlide, deleteSlide, updateSlide, HomeSlide,
  loadPromotions, savePromotions, addPromotion, deletePromotion, updatePromotion, Promotion,
  loadDriverPricing, saveDriverPricing, DriverPriceConfig,
} from "@/data/store";

type Tab = "pricing" | "ac" | "deepclean" | "addons" | "subscription" | "driver" | "sliders" | "promotions";

function SaveBar({ onSave, saved }: { onSave: ()=>void; saved: boolean }) {
  const { t } = useT();
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button onClick={onSave} className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all ${saved?"bg-green-500 text-white scale-105":"bg-primary text-white hover:bg-primary/90"}`}>
        {saved ? t.common.saved : t.common.saveChanges}
      </button>
    </div>
  );
}

// ── Tab: Service Pricing ───────────────────────────────────────────────────────
function ServicePricingTab() {
  const { t } = useT();
  const [services, setServices] = useState<ServicePriceConfig[]>(loadServicePricing);
  const [area, setArea] = useState<ServiceArea>("bangkok");
  const [saved, setSaved] = useState(false);

  function updateTier(slug: string, tierIdx: number, field: "ratePerHour", value: number) {
    setServices(prev => prev.map(s => s.slug === slug ? {
      ...s, tiers: s.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t),
    } : s));
    setSaved(false);
  }
  function updateMultiplier(slug: string, a: ServiceArea, value: number) {
    setServices(prev => prev.map(s => s.slug === slug ? { ...s, areaMultiplier: { ...s.areaMultiplier, [a]: value } } : s));
    setSaved(false);
  }
  function handleSave() { saveServicePricing(services); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-foreground text-lg">Hourly Rate Settings</h2>
          <p className="text-sm text-muted-foreground">Set rates per area. Bangkok = base rate.</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {AREAS.map(a => <button key={a.id} onClick={()=>setArea(a.id)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${area===a.id?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>{a.label.split(" / ")[0]}</button>)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Service</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">2h Rate (฿/h)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">3h+ Rate (฿/h)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Area Multiplier</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">2h Total (฿)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">3h Total (฿)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map(s => {
              const mult = s.areaMultiplier[area] ?? 1;
              const r2 = s.tiers[0]?.ratePerHour ?? 0;
              const r3 = (s.tiers[1] ?? s.tiers[0])?.ratePerHour ?? r2;
              return (
                <tr key={s.slug} className="hover:bg-muted/20">
                  <td className="px-5 py-4"><span className="flex items-center gap-2 font-medium text-foreground"><span>{s.icon}</span>{s.label}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1"><span className="text-muted-foreground text-xs">฿</span>
                      <input type="number" min="0" step="10" value={r2} onChange={e=>updateTier(s.slug,0,"ratePerHour",Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {s.tiers.length > 1
                      ? <div className="flex items-center gap-1"><span className="text-muted-foreground text-xs">฿</span>
                          <input type="number" min="0" step="10" value={r3} onChange={e=>updateTier(s.slug,1,"ratePerHour",Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      : <span className="text-muted-foreground italic text-xs">Same rate</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <input type="number" min="0.5" max="3" step="0.05" value={mult} onChange={e=>updateMultiplier(s.slug,area,Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="text-xs text-muted-foreground ml-1">×</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-primary">฿{Math.round(r2*mult*2).toLocaleString()}</td>
                  <td className="px-5 py-4 font-semibold text-foreground">฿{Math.round(r3*mult*3).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: AC Pricing ───────────────────────────────────────────────────────────
function AcPricingTab() {
  const [prices, setPrices] = useState<AcTypePrice[]>(loadAcPricing);
  const [saved, setSaved] = useState(false);

  function updatePrice(id: string, value: number) { setPrices(p=>p.map(ac=>ac.id===id?{...ac,price:value}:ac)); setSaved(false); }
  function handleSave() { saveAcPricing(prices); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div className="space-y-4">
      <div><h2 className="font-semibold text-foreground text-lg">AC Cleaning Prices</h2><p className="text-sm text-muted-foreground">Fixed price per AC unit type</p></div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>{["AC Type","BTU Range","Price per Unit (฿)"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {prices.map(ac=>(
              <tr key={ac.id} className="hover:bg-muted/20">
                <td className="px-5 py-4 font-medium text-foreground">❄️ {ac.typeEn.split("(")[0].trim()}</td>
                <td className="px-5 py-4 text-muted-foreground">{ac.btuEn}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1"><span className="text-muted-foreground text-xs">฿</span>
                    <input type="number" min="0" step="50" value={ac.price} onChange={e=>updatePrice(ac.id,Number(e.target.value))} className="w-24 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Deep Cleaning ────────────────────────────────────────────────────────
function DeepCleanTab() {
  const [packages, setPackages] = useState<DeepCleanPackage[]>(loadDeepCleanPricing);
  const [saved, setSaved] = useState(false);

  function updatePrice(id: string, value: number) {
    setPackages(p => p.map(pkg => pkg.id === id ? { ...pkg, price: value } : pkg));
    setSaved(false);
  }
  function handleSave() { saveDeepCleanPricing(packages); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground text-lg">🧽 Deep Cleaning Packages</h2>
        <p className="text-sm text-muted-foreground">Fixed package prices by area size. Tasker count and hours are informational.</p>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["Package", "Max Area", "Taskers", "Hours", "Price (฿)"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map(pkg => (
              <tr key={pkg.id} className="hover:bg-muted/20">
                <td className="px-5 py-4 font-medium text-foreground">🧽 Max {pkg.maxArea} m²</td>
                <td className="px-5 py-4 text-muted-foreground">{pkg.maxArea} m²</td>
                <td className="px-5 py-4 text-muted-foreground">{pkg.taskers} Taskers</td>
                <td className="px-5 py-4 text-muted-foreground">{pkg.hours} hours</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">฿</span>
                    <input
                      type="number" min="0" step="100" value={pkg.price}
                      onChange={e => updatePrice(pkg.id, Number(e.target.value))}
                      className="w-28 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-muted/30 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">📱 App Preview Info</p>
        <p>The app shows a 2-column grid of these 6 packages. Users select one package and the price and tasker/hour details are shown at the bottom. The calendar for scheduling appears on the same screen.</p>
      </div>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Options ──────────────────────────────────────────────────────────────
const ALL_SERVICES = [
  { slug: "maid",       label: "🧹 Maid" },
  { slug: "nanny",      label: "👶 Nanny" },
  { slug: "elderly",    label: "🧓 Elderly Care" },
  { slug: "petcare",    label: "🐾 Pet Care" },
  { slug: "officemaid", label: "🏢 Office Maid" },
  { slug: "driver",     label: "🚗 Driver" },
  { slug: "ac",         label: "❄️ AC Cleaning" },
  { slug: "deepclean",  label: "🧽 Deep Clean" },
];

const EMPTY_ADDON: Omit<AddonPriceConfig, "id"> = {
  name_en: "", name_th: "", name_ja: "", name_zh: "", name_ko: "",
  desc_en: "", desc_th: "", desc_ja: "", desc_zh: "", desc_ko: "",
  price_per_hour: 0, price_per_time: 0, active: true, services: [],
};

function AddonsTab() {
  const { lang } = useT();
  const [addons, setAddons] = useState<AddonPriceConfig[]>(loadAddonPricing);
  const [editing, setEditing] = useState<AddonPriceConfig | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<AddonPriceConfig, "id">>(EMPTY_ADDON);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = () => setAddons(loadAddonPricing());

  function openNew() { setIsNew(true); setEditing(null); setForm(EMPTY_ADDON); }
  function openEdit(a: AddonPriceConfig) {
    setIsNew(false); setEditing(a);
    setForm({ name_en: a.name_en, name_th: a.name_th, name_ja: a.name_ja ?? "", name_zh: a.name_zh ?? "",
              name_ko: a.name_ko ?? "",
              desc_en: a.desc_en, desc_th: a.desc_th ?? "", desc_ja: a.desc_ja ?? "", desc_zh: a.desc_zh ?? "",
              desc_ko: a.desc_ko ?? "",
              price_per_hour: a.price_per_hour, price_per_time: a.price_per_time, active: a.active,
              services: a.services ?? [] });
  }

  function toggleService(slug: string) {
    setForm(f => {
      const svcs = f.services ?? [];
      return { ...f, services: svcs.includes(slug) ? svcs.filter(s => s !== slug) : [...svcs, slug] };
    });
  }
  function handleSave() {
    if (!form.name_en.trim() && !form.name_th.trim()) return;
    if (isNew) addAddon({ ...form, id: `opt_${Date.now()}` });
    else if (editing) updateAddon(editing.id, form);
    setEditing(null); setIsNew(false); refresh();
  }
  function handleDelete(id: string) { deleteAddon(id); setConfirmDeleteId(null); refresh(); }
  function handleToggle(id: string, active: boolean) { updateAddon(id, { active }); refresh(); }

  const dName  = (a: AddonPriceConfig) => lang === "th" ? (a.name_th || a.name_en) : (a.name_en || a.name_th);
  const dDesc  = (a: AddonPriceConfig) => lang === "th" ? (a.desc_th || a.desc_en) : (a.desc_en || a.desc_th);
  const dPrice = (a: AddonPriceConfig) => a.price_per_time > 0 ? `+฿${a.price_per_time}` : a.price_per_hour > 0 ? `+฿${a.price_per_hour}/h` : "Free";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-foreground text-lg">Options / Extra Services</h2>
          <p className="text-sm text-muted-foreground">Shown on Step 3 of booking. Assign each option to specific services so only relevant options appear.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">+ Add Option</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        {/* List */}
        <div className="space-y-2">
          {addons.map(a => (
            <div key={a.id} className={`bg-card border rounded-xl p-4 shadow-sm transition-all hover:border-primary/20 ${a.active ? "border-border" : "border-dashed border-border opacity-55"}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{dName(a)}</span>
                    {!a.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border font-medium">Off</span>}
                  </div>
                  {dDesc(a) && <p className="text-xs text-muted-foreground leading-snug">{dDesc(a)}</p>}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {a.price_per_time > 0 && <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">฿{a.price_per_time} / session</span>}
                    {a.price_per_hour > 0 && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">฿{a.price_per_hour} / hr</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {(a.services && a.services.length > 0)
                      ? a.services.map(s => {
                          const svc = ALL_SERVICES.find(x => x.slug === s);
                          return svc ? <span key={s} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{svc.label}</span> : null;
                        })
                      : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">All services</span>
                    }
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg hover:bg-accent font-medium">Edit</button>
                  <button onClick={() => handleToggle(a.id, !a.active)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${a.active ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"}`}>
                    {a.active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => setConfirmDeleteId(a.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {addons.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-xl">No options yet.</div>
          )}
        </div>

        {/* App Preview */}
        <div className="sticky top-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📱 App Preview</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2.5 border-b border-gray-100">
              <div className="font-bold text-gray-900 text-base">Extra Services</div>
            </div>
            <div className="divide-y divide-gray-100">
              {addons.filter(a => a.active).map(a => (
                <div key={a.id} className="flex items-center px-4 py-3.5 gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-snug">{dName(a)}</div>
                    {dDesc(a) && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dDesc(a)}</div>}
                  </div>
                  <div className="text-sm font-bold text-gray-900 flex-shrink-0">{dPrice(a)}</div>
                </div>
              ))}
              {addons.filter(a => a.active).length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">No active options</div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">Only "Active" options appear in the app</p>
        </div>
      </div>

      {/* Form Modal */}
      {(isNew || editing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl max-h-[94vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="font-bold text-lg">{isNew ? "Add Option" : "Edit Option"}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }}
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent text-lg leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Names row EN/TH */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (EN) *</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    placeholder="English Speaker"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (TH)</label>
                  <input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
                    placeholder="พูดภาษาอังกฤษ"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {/* Names JA/ZH/KO/MY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (JA 日本語)</label>
                  <input value={form.name_ja ?? ""} onChange={e => setForm(f => ({ ...f, name_ja: e.target.value }))}
                    placeholder="英語対応"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (ZH 中文)</label>
                  <input value={form.name_zh ?? ""} onChange={e => setForm(f => ({ ...f, name_zh: e.target.value }))}
                    placeholder="英语服务"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name (KO 한국어)</label>
                  <input value={form.name_ko ?? ""} onChange={e => setForm(f => ({ ...f, name_ko: e.target.value }))}
                    placeholder="영어 가능"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {/* Desc EN/TH */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description (EN)</label>
                  <textarea value={form.desc_en} onChange={e => setForm(f => ({ ...f, desc_en: e.target.value }))}
                    rows={2} placeholder="Basic English language"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description (TH)</label>
                  <textarea value={form.desc_th} onChange={e => setForm(f => ({ ...f, desc_th: e.target.value }))}
                    rows={2} placeholder="สื่อสารภาษาอังกฤษขั้นพื้นฐาน"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              </div>
              {/* Services */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Show on Services</p>
                <p className="text-[11px] text-muted-foreground">Leave all unchecked to show on ALL services.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {ALL_SERVICES.map(svc => {
                    const checked = (form.services ?? []).includes(svc.slug);
                    return (
                      <label key={svc.slug} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${checked ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleService(svc.slug)} className="w-3.5 h-3.5 accent-primary" />
                        {svc.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">฿ / Session (flat)</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">฿</span>
                      <input type="number" min="0" step="10" value={form.price_per_time}
                        onChange={e => setForm(f => ({ ...f, price_per_time: Math.max(0, Number(e.target.value)) }))}
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Fixed fee per booking</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">฿ / Hour</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">฿</span>
                      <input type="number" min="0" step="10" value={form.price_per_hour}
                        onChange={e => setForm(f => ({ ...f, price_per_hour: Math.max(0, Number(e.target.value)) }))}
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Added per booked hour</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Shown as:</span>
                  <span className="font-bold text-primary text-base">
                    {form.price_per_time > 0 ? `+฿${form.price_per_time}` : form.price_per_hour > 0 ? `+฿${form.price_per_hour}/h` : "Free"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.active ? "bg-primary" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${form.active ? "left-[22px]" : "left-0.5"}`} />
                </button>
                <span className="text-sm font-medium">{form.active ? "Visible in app" : "Hidden from app"}</span>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-bold text-gray-700">📱 Preview</div>
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{form.name_en || "Option Name"}</div>
                    {form.desc_en && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{form.desc_en}</div>}
                  </div>
                  <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {form.price_per_time > 0 ? `+฿${form.price_per_time}` : form.price_per_hour > 0 ? `+฿${form.price_per_hour}/h` : "Free"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-2 flex-shrink-0">
              <button onClick={() => { setEditing(null); setIsNew(false); }}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted">Cancel</button>
              <button onClick={handleSave}
                disabled={!form.name_en.trim() && !form.name_th.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">
                {isNew ? "Add Option" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="font-bold text-lg mb-2">Delete Option</h3>
            <p className="text-sm text-muted-foreground">This option will be permanently removed from the app.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Subscription ─────────────────────────────────────────────────────────
function SubscriptionTab() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(loadSubscriptionTiers);
  const [saved, setSaved] = useState(false);

  function updateTier(i: number, field: keyof SubscriptionTier, value: string | number) {
    setTiers(t=>t.map((tier,idx)=>idx===i?{...tier,[field]:value}:tier)); setSaved(false);
  }
  function handleSave() { saveSubscriptionTiers(tiers); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div className="space-y-4 max-w-xl">
      <div><h2 className="font-semibold text-foreground text-lg">Subscription Discount Tiers</h2><p className="text-sm text-muted-foreground">Discount applied when total hours per month ≥ min hours</p></div>
      <div className="space-y-3">
        {tiers.map((t, i)=>(
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Tier Name</label>
                <input value={t.label} onChange={e=>updateTier(i,"label",e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Min Hours/Month</label>
                <input type="number" min="1" step="1" value={t.minHours} onChange={e=>updateTier(i,"minHours",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Discount (%)</label>
                <input type="number" min="0" max="50" step="1" value={t.discountPct} onChange={e=>updateTier(i,"discountPct",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              ≥{t.minHours}h/month → <strong className="text-primary">{t.discountPct}% off</strong> all bookings
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Note:</strong> Daily booking prices are 5–20% higher than subscription prices. Tiers apply to total subscribed hours per calendar month.
      </div>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Home Sliders ─────────────────────────────────────────────────────────
function SlidersTab() {
  const [sliders, setSliders] = useState<HomeSlide[]>(loadSliders);
  const [editing, setEditing] = useState<HomeSlide | null>(null);
  const [form, setForm] = useState<Omit<HomeSlide,"id">>({ title_en:"",title_th:"",subtitle_en:"",subtitle_th:"",imageUrl:"",linkTarget:"",active:true,order:1 });
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const refresh = () => setSliders(loadSliders());
  function openEdit(s: HomeSlide) { setEditing(s); setIsNew(false); setForm({title_en:s.title_en,title_th:s.title_th,subtitle_en:s.subtitle_en??"",subtitle_th:s.subtitle_th??"",imageUrl:s.imageUrl,linkTarget:s.linkTarget??"",active:s.active,order:s.order}); }
  function openNew() { setIsNew(true); setEditing(null); setForm({title_en:"",title_th:"",subtitle_en:"",subtitle_th:"",imageUrl:"",linkTarget:"",active:true,order:sliders.length+1}); }
  function handleSave() {
    if (isNew) addSlide({...form,id:`sl${Date.now()}`});
    else if (editing) updateSlide(editing.id,form);
    setEditing(null); setIsNew(false); refresh(); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }
  function handleDelete(id: string) { deleteSlide(id); refresh(); }
  function toggleActive(id: string, active: boolean) { updateSlide(id,{active}); refresh(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="font-semibold text-foreground text-lg">Home Screen Sliders</h2><p className="text-sm text-muted-foreground">Manage the banner images shown on the app home screen</p></div>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">+ Add Slide</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...sliders].sort((a,b)=>a.order-b.order).map(s=>(
          <div key={s.id} className={`bg-card border rounded-xl overflow-hidden shadow-sm ${s.active?"border-border":"border-gray-200 opacity-60"}`}>
            {s.imageUrl && <div className="h-36 bg-muted overflow-hidden"><img src={s.imageUrl} alt={s.title_en} className="w-full h-full object-cover" onError={e=>(e.currentTarget.style.display="none")} /></div>}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{s.title_en}</div>
                  <div className="text-xs text-muted-foreground">{s.title_th}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{s.order}</span>
                  <button onClick={()=>toggleActive(s.id,!s.active)} className={`text-xs px-2 py-1 rounded-full border font-medium ${s.active?"bg-green-100 text-green-700 border-green-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>{s.active?"Active":"Off"}</button>
                </div>
              </div>
              {s.subtitle_en && <div className="text-sm text-muted-foreground">{s.subtitle_en}</div>}
              {s.linkTarget && <div className="text-xs text-primary">Links to: {s.linkTarget}</div>}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>openEdit(s)} className="px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md">Edit</button>
                <button onClick={()=>handleDelete(s.id)} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(editing||isNew) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-lg">{isNew?"Add Slide":"Edit Slide"}</h3>
            {[
              {label:"Title (EN) *",key:"title_en",ph:"Professional Home Care"},
              {label:"Title (TH)",  key:"title_th",ph:"บริการดูแลบ้านมืออาชีพ"},
              {label:"Subtitle EN", key:"subtitle_en",ph:"Trusted helpers, on demand"},
              {label:"Subtitle TH", key:"subtitle_th",ph:"ผู้ช่วยที่เชื่อใจได้"},
              {label:"Link Target", key:"linkTarget",ph:"maid / nanny / (empty=home)"},
            ].map(f=>(
              <div key={f.key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={f.ph} />
              </div>
            ))}
            <ImageUploadField
              label="Slide Image"
              value={form.imageUrl}
              onChange={v => setForm(p => ({ ...p, imageUrl: v }))}
              previewHeight="h-28"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Order</label>
                <input type="number" min="1" value={form.order} onChange={e=>setForm(p=>({...p,order:Number(e.target.value)}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={()=>setForm(p=>({...p,active:!p.active}))} className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.active?"bg-primary":"bg-gray-300"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${form.active?"left-5.5":"left-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setEditing(null);setIsNew(false);}} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={handleSave} disabled={!form.title_en.trim()} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Promotions ───────────────────────────────────────────────────────────
function PromotionsTab() {
  const [promos, setPromos] = useState<Promotion[]>(loadPromotions);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [isNew, setIsNew] = useState(false);
  const EMPTY_PROMO: Omit<Promotion,"id"|"createdAt"> = { title_en:"",title_th:"",description_en:"",description_th:"",imageUrl:"",discountPct:0,discountFlat:0,validFrom:"",validUntil:"",active:true };
  const [form, setForm] = useState<Omit<Promotion,"id"|"createdAt">>(EMPTY_PROMO);

  const refresh = () => setPromos(loadPromotions());
  function openEdit(p: Promotion) { setEditing(p); setIsNew(false); setForm({title_en:p.title_en,title_th:p.title_th,description_en:p.description_en,description_th:p.description_th,imageUrl:p.imageUrl,discountPct:p.discountPct??0,discountFlat:p.discountFlat??0,validFrom:p.validFrom,validUntil:p.validUntil,active:p.active}); }
  function openNew() { setIsNew(true); setEditing(null); setForm(EMPTY_PROMO); }
  function handleSave() {
    if (isNew) addPromotion({...form,id:`pr${Date.now()}`,createdAt:new Date().toISOString().slice(0,10)});
    else if (editing) updatePromotion(editing.id,form);
    setEditing(null); setIsNew(false); refresh();
  }
  function handleDelete(id: string) { deletePromotion(id); refresh(); }
  function toggleActive(id: string, active: boolean) { updatePromotion(id,{active}); refresh(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="font-semibold text-foreground text-lg">Promotions</h2><p className="text-sm text-muted-foreground">Create and manage promotional banners shown in the app</p></div>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">+ Add Promotion</button>
      </div>

      <div className="space-y-4">
        {promos.map(p=>(
          <div key={p.id} className={`bg-card border rounded-xl overflow-hidden shadow-sm ${p.active?"border-border":"border-gray-200 opacity-60"}`}>
            <div className="flex gap-0">
              {p.imageUrl && <div className="w-40 flex-shrink-0 bg-muted overflow-hidden"><img src={p.imageUrl} alt={p.title_en} className="w-full h-full object-cover" onError={e=>(e.currentTarget.style.display="none")} /></div>}
              <div className="flex-1 p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground text-base">{p.title_en}</div>
                    <div className="text-xs text-muted-foreground">{p.title_th}</div>
                  </div>
                  <button onClick={()=>toggleActive(p.id,!p.active)} className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${p.active?"bg-green-100 text-green-700 border-green-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>{p.active?"Active":"Off"}</button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description_en}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {p.discountPct?<span className="text-primary font-semibold">{p.discountPct}% off</span>:null}
                  {p.discountFlat?<span className="text-primary font-semibold">฿{p.discountFlat} off</span>:null}
                  <span>{p.validFrom} → {p.validUntil}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={()=>openEdit(p)} className="px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md">Edit</button>
                  <button onClick={()=>handleDelete(p.id)} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(editing||isNew) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-lg">{isNew?"Add Promotion":"Edit Promotion"}</h3>
            {[
              {label:"Title (EN) *",key:"title_en",ph:"Songkran Special"},
              {label:"Title (TH)",  key:"title_th",ph:"โปรโมชั่นสงกรานต์"},
              {label:"Description EN", key:"description_en",ph:"Book any service and get 15% off!"},
              {label:"Description TH", key:"description_th",ph:"จองบริการใดก็ได้รับส่วนลด 15%"},
            ].map(f=>(
              <div key={f.key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
                {f.key.includes("description")
                  ? <textarea value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder={f.ph} />
                  : <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={f.ph} />
                }
              </div>
            ))}
            <ImageUploadField
              label="Promotion Image"
              value={form.imageUrl}
              onChange={v => setForm(p => ({ ...p, imageUrl: v }))}
              previewHeight="h-28"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Discount % (or 0)</label>
                <input type="number" min="0" max="100" value={form.discountPct??0} onChange={e=>setForm(p=>({...p,discountPct:Number(e.target.value)}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Flat Discount ฿ (or 0)</label>
                <input type="number" min="0" step="50" value={form.discountFlat??0} onChange={e=>setForm(p=>({...p,discountFlat:Number(e.target.value)}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Valid From</label>
                <input type="date" value={form.validFrom} onChange={e=>setForm(p=>({...p,validFrom:e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Valid Until</label>
                <input type="date" value={form.validUntil} onChange={e=>setForm(p=>({...p,validUntil:e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={()=>setForm(p=>({...p,active:!p.active}))} className={`w-10 h-5 rounded-full transition-colors relative ${form.active?"bg-primary":"bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${form.active?"left-5.5":"left-0.5"}`} />
              </div>
              <span className="text-sm font-medium text-foreground">Active</span>
            </label>
            <div className="flex gap-2">
              <button onClick={()=>{setEditing(null);setIsNew(false);}} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={handleSave} disabled={!form.title_en.trim()} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Trip Driver Pricing ──────────────────────────────────────────────────
function DriverPricingTab() {
  const [cfg, setCfg] = useState<DriverPriceConfig>(loadDriverPricing);
  const [area, setArea] = useState<ServiceArea>("bangkok");
  const [saved, setSaved] = useState(false);

  function setBase(val: number) { setCfg(p => ({ ...p, basePricePerDay: val })); setSaved(false); }
  function setMultiplier(a: ServiceArea, val: number) { setCfg(p => ({ ...p, areaMultiplier: { ...p.areaMultiplier, [a]: val } })); setSaved(false); }
  function setCarPrice(id: string, val: number) {
    setCfg(p => ({ ...p, carOptions: p.carOptions.map(c => c.id === id ? { ...c, pricePerDay: val } : c) }));
    setSaved(false);
  }
  function handleSave() { saveDriverPricing(cfg); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const mult = cfg.areaMultiplier[area] ?? 1;
  const effectiveBase = Math.round(cfg.basePricePerDay * mult);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-foreground text-lg">🚗 Trip Driver Pricing</h2>
        <p className="text-sm text-muted-foreground">Day-rate pricing for the Trip Driver service. Includes base rate + optional car surcharge.</p>
      </div>

      {/* Area selector */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {AREAS.map(a => (
          <button key={a.id} onClick={() => setArea(a.id)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${area === a.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {a.label.split(" / ")[0]}
          </button>
        ))}
      </div>

      {/* Base rate + multiplier */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm text-foreground">Base Rate (per day)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Bangkok Base (฿/day)</label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">฿</span>
              <input type="number" min="0" step="100" value={cfg.basePricePerDay}
                onChange={e => setBase(Number(e.target.value))}
                className="w-28 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{AREAS.find(a=>a.id===area)?.label.split(" / ")[0]} Multiplier</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0.5" max="3" step="0.05" value={cfg.areaMultiplier[area] ?? 1}
                onChange={e => setMultiplier(area, Number(e.target.value))}
                className="w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <span className="text-xs text-muted-foreground">×</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Effective Rate ({AREAS.find(a=>a.id===area)?.label.split(" / ")[0]})</label>
            <div className="text-lg font-bold text-primary">฿{effectiveBase.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/day</span></div>
          </div>
        </div>
      </div>

      {/* Car options */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-muted/40 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Car Size Surcharges</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Added on top of the driver base rate per day</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20">
            <tr>
              {["Car Type", "Surcharge (฿/day)", `Total with Driver (${AREAS.find(a=>a.id===area)?.label.split(" / ")[0]})`].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cfg.carOptions.map(car => (
              <tr key={car.id} className="hover:bg-muted/20">
                <td className="px-5 py-4 font-medium text-foreground">{car.label_en}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">฿</span>
                    <input type="number" min="0" step="100" value={car.pricePerDay}
                      onChange={e => setCarPrice(car.id, Number(e.target.value))}
                      className="w-24 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="text-xs text-muted-foreground">/day</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold text-foreground">
                  ฿{Math.round((effectiveBase + car.pricePerDay) * mult).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/day</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Pricing formula:</strong> (Base Rate × Area Multiplier) + Car Surcharge = Total per day.<br />
        Car surcharges are added on top of the base after the area multiplier is applied.
      </div>

      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
export default function Settings() {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = (tab as Tab) || "pricing";

  const TAB_CONTENT: Record<Tab, JSX.Element> = {
    pricing:      <ServicePricingTab />,
    ac:           <AcPricingTab />,
    deepclean:    <DeepCleanTab />,
    addons:       <AddonsTab />,
    subscription: <SubscriptionTab />,
    driver:       <DriverPricingTab />,
    sliders:      <SlidersTab />,
    promotions:   <PromotionsTab />,
  };

  const { t } = useT();
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "pricing",      label: t.settings.tabs.pricing,      icon: "💴" },
    { id: "ac",           label: t.settings.tabs.ac,           icon: "❄️" },
    { id: "deepclean",    label: "Deep Cleaning",               icon: "🧽" },
    { id: "addons",       label: t.settings.tabs.addons,       icon: "➕" },
    { id: "subscription", label: t.settings.tabs.subscription, icon: "🔄" },
    { id: "driver",       label: "Trip Driver",                 icon: "🚗" },
    { id: "sliders",      label: t.settings.tabs.sliders,      icon: "🖼️" },
    { id: "promotions",   label: t.settings.tabs.promotions,   icon: "🎉" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-1">
        {TABS.map(tab=>(
          <a key={tab.id} href={`${import.meta.env.BASE_URL}settings/${tab.id}`}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
              ${activeTab===tab.id?"border-primary text-primary bg-primary/5":"border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
            <span>{tab.icon}</span>{tab.label}
          </a>
        ))}
      </div>

      <div>{TAB_CONTENT[activeTab] ?? <ServicePricingTab />}</div>
    </div>
  );
}
