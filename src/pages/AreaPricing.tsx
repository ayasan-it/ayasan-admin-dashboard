import { useState } from "react";
import { loadServicePricing, saveServicePricing, ServicePriceConfig, ServiceArea, AREAS } from "@/data/store";
import { Save, RotateCcw } from "lucide-react";
import { useT } from "@/i18n";

const AREA_FLAGS: Record<ServiceArea, string> = {
  bangkok:   "🇹🇭",
  phuket:    "🌴",
  pattaya:   "🏖️",
  chiangmai: "🏔️",
};

function effectivePrice(base: number, multiplier: number) {
  return Math.round(base * multiplier);
}

function BulkAdjustModal({ area, services, onApply, onClose }: {
  area: ServiceArea; services: ServicePriceConfig[]; onApply: (area: ServiceArea, delta: number) => void; onClose: () => void;
}) {
  const { t } = useT();
  const ap = t.areaPricing;
  const [mode, setMode]   = useState<"pct" | "fixed">("pct");
  const [value, setValue] = useState("");

  function apply() {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (mode === "pct") {
      onApply(area, num / 100);
    } else {
      const avgBase = services.reduce((s, svc) => s + (svc.tiers[0]?.ratePerHour ?? 0), 0) / services.length;
      onApply(area, num / avgBase);
    }
    onClose();
  }

  const aLabel = AREAS.find(a => a.id === area)?.label ?? area;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="font-bold text-gray-900">{AREA_FLAGS[area]} {aLabel} — {ap.bulkAdjustTitle}</div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode("pct")} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === "pct" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600"}`}>{ap.pct}</button>
            <button onClick={() => setMode("fixed")} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === "fixed" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600"}`}>{ap.flat}</button>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ap.applyMode}</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={mode === "pct" ? "e.g. +10" : "e.g. +50"}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <span className="text-gray-400 font-semibold">{mode === "pct" ? "%" : "฿"}</span>
            </div>
          </div>
          {value && !isNaN(parseFloat(value)) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
              <div className="text-blue-700 font-semibold">
                {mode === "pct"
                  ? `All ${aLabel} rates: ${parseFloat(value) >= 0 ? "+" : ""}${parseFloat(value)}%`
                  : `All ${aLabel} rates: ฿${parseFloat(value)} adjustment`}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">{t.common.cancel}</button>
          <button onClick={apply} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 flex items-center gap-1.5">
            <Save size={13} /> {ap.applyAll}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AreaPricing() {
  const { t } = useT();
  const ap = t.areaPricing;
  const [services, setServices] = useState<ServicePriceConfig[]>(() => loadServicePricing());
  const [saved, setSaved]       = useState(false);
  const [bulkArea, setBulkArea] = useState<ServiceArea | null>(null);
  const [activeArea, setActiveArea] = useState<ServiceArea | "all">("all");

  const areas = AREAS.map(a => a.id as ServiceArea);
  const visibleAreas = activeArea === "all" ? areas : [activeArea];

  function updateMultiplier(slug: string, area: ServiceArea, val: string) {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setServices(prev => prev.map(s => s.slug === slug ? { ...s, areaMultiplier: { ...s.areaMultiplier, [area]: Math.round(num * 100) / 100 } } : s));
    setSaved(false);
  }

  function handleSave() { saveServicePricing(services); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function handleReset() {
    if (!confirm(t.common.cannotUndo)) return;
    localStorage.removeItem("service_pricing_v3");
    setServices(loadServicePricing());
  }

  function handleBulkApply(area: ServiceArea, delta: number) {
    setServices(prev => prev.map(s => ({
      ...s,
      areaMultiplier: { ...s.areaMultiplier, [area]: Math.round(Math.max(0.5, (s.areaMultiplier[area] + delta)) * 100) / 100 },
    })));
    setSaved(false);
  }

  function getBaseRate(svc: ServicePriceConfig) { return svc.tiers[0]?.ratePerHour ?? 0; }

  return (
    <div className="p-6 space-y-5 bg-background min-h-screen">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ap.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ap.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RotateCcw size={13} /> {ap.reset}
          </button>
          <button onClick={handleSave} className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"}`}>
            <Save size={13} /> {saved ? t.common.saved : ap.save}
          </button>
        </div>
      </div>

      <div className="flex gap-0.5 bg-muted rounded-xl p-1 w-fit">
        <button onClick={() => setActiveArea("all")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeArea === "all" ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {ap.allAreas}
        </button>
        {areas.map(a => (
          <button key={a} onClick={() => setActiveArea(a)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeArea === a ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {AREA_FLAGS[a]} {AREAS.find(x=>x.id===a)?.label.split(" / ")[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {areas.map(area => {
          const avgMult = services.reduce((s,svc) => s + svc.areaMultiplier[area], 0) / services.length;
          const compared = avgMult > 1 ? `+${((avgMult - 1) * 100).toFixed(0)}%` : avgMult < 1 ? `${((avgMult - 1) * 100).toFixed(0)}%` : ap.base;
          const color = avgMult > 1 ? "text-green-600 bg-green-50" : avgMult < 1 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-100";
          const areaLabel = AREAS.find(x=>x.id===area)?.label ?? area;
          return (
            <div key={area} className={`bg-white rounded-2xl border shadow-sm p-5 ${activeArea === area ? "border-primary ring-1 ring-primary/20" : "border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl">{AREA_FLAGS[area]}</div>
                  <div className="font-bold text-gray-900 mt-1">{areaLabel.split(" / ")[0]}</div>
                  <div className="text-xs text-gray-400">{areaLabel.split(" / ")[1] ?? ""}</div>
                </div>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${color}`}>{compared}</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">{ap.avgMultiplier}: <span className="font-semibold text-gray-800">×{avgMult.toFixed(2)}</span></div>
              <button onClick={() => setBulkArea(area)} className="mt-3 w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                {ap.bulkAdjust}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{ap.matrixTitle}</div>
          <div className="text-xs text-gray-400 mt-0.5">{ap.matrixDesc}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">{ap.service}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{ap.baseRate}<br/><span className="text-gray-300 normal-case font-normal">฿/h (Bangkok)</span></th>
                {visibleAreas.map(area => {
                  const aLabel = AREAS.find(x=>x.id===area)?.label ?? area;
                  return (
                    <th key={area} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      {AREA_FLAGS[area]} {aLabel.split(" / ")[0]}
                      <br/><span className="text-gray-300 normal-case font-normal">{aLabel.split(" / ")[1] ?? ""}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(svc => {
                const baseRate = getBaseRate(svc);
                return (
                  <tr key={svc.slug} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{svc.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{svc.label}</div>
                          <div className="text-xs text-gray-400">{svc.minHours}h min</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-gray-900">฿{baseRate}</div>
                      <div className="text-xs text-gray-400">×1.00</div>
                    </td>
                    {visibleAreas.map(area => {
                      const mult = svc.areaMultiplier[area];
                      const effective = effectivePrice(baseRate, mult);
                      const isHigher = mult > 1;
                      const isLower  = mult < 1;
                      return (
                        <td key={area} className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <span className="text-xs text-gray-400">×</span>
                            <input type="number" step="0.01" min="0.5" max="3" value={mult}
                              onChange={e => updateMultiplier(svc.slug, area, e.target.value)}
                              className="w-16 text-center border border-gray-200 rounded-lg px-1.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                          <div className={`text-sm font-bold ${isHigher ? "text-green-600" : isLower ? "text-red-500" : "text-gray-700"}`}>฿{effective}/h</div>
                          {isHigher && <div className="text-xs text-green-400">+{((mult-1)*100).toFixed(0)}%</div>}
                          {isLower  && <div className="text-xs text-red-400">{((mult-1)*100).toFixed(0)}%</div>}
                          {!isHigher && !isLower && <div className="text-xs text-gray-300">{ap.base}</div>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
          <span>🟢 <span className="text-green-600 font-medium">Higher than Bangkok</span></span>
          <span>🔴 <span className="text-red-500 font-medium">Lower than Bangkok</span></span>
          <span>⬜ <span className="text-gray-500 font-medium">{ap.base}</span></span>
        </div>
      </div>

      {bulkArea && (
        <BulkAdjustModal area={bulkArea} services={services} onApply={handleBulkApply} onClose={() => setBulkArea(null)} />
      )}
    </div>
  );
}
