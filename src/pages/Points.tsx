import { useState } from "react";
import { loadPointsConfig, savePointsConfig, PointsConfig, loadBookings } from "@/data/store";
import { useT } from "@/i18n";

export default function Points() {
  const { t } = useT();
  const [config, setConfig] = useState<PointsConfig>(loadPointsConfig);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof PointsConfig>(key: K, value: PointsConfig[K]) {
    setConfig(c => ({ ...c, [key]: value }));
    setSaved(false);
  }
  function handleSave() { savePointsConfig(config); setSaved(true); setTimeout(()=>setSaved(false), 2000); }

  const bookings   = loadBookings();
  const totalPoints = bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+(b.pointsEarned??0),0);
  const example1   = Math.floor(1000 * config.pointsPerBaht);
  const example1s  = Math.floor(1000 * config.pointsPerBaht * config.subscriptionMultiplier);
  const redeem100  = (config.redemptionRate > 0) ? Math.floor(100 / config.redemptionRate * 10) : 0;

  const p = t.points;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{p.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-foreground">{p.enabled}</span>
            <div onClick={()=>update("enabled",!config.enabled)} className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${config.enabled?"bg-primary":"bg-gray-300"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${config.enabled?"left-6.5":"left-0.5"}`} />
            </div>
          </label>
          <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${saved?"bg-green-500 text-white":"bg-primary text-white hover:bg-primary/90"}`}>
            {saved ? t.common.saved : t.common.saveChanges}
          </button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">{p.livePreview}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-muted-foreground mb-1">{p.dailyBooking}</div>
            <div className="text-2xl font-bold text-primary">+{example1} pts</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-muted-foreground mb-1">{p.subBooking}</div>
            <div className="text-2xl font-bold text-purple-600">+{example1s} pts</div>
            <div className="text-xs text-purple-500">{config.subscriptionMultiplier}× {p.multiplier}</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-muted-foreground mb-1">{p.redeem100}</div>
            <div className="text-2xl font-bold text-green-600">฿{redeem100}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-card rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">{p.firstBookingBonus}</div>
            <div className="font-bold text-foreground">+{config.bonusFirstBooking} pts</div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">{p.referralBonus}</div>
            <div className="font-bold text-foreground">+{config.bonusReferral} pts / {p.perReferral}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{p.totalIssued}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-foreground">฿{Math.floor(totalPoints/config.redemptionRate*10).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{p.potentialRedemption}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-foreground">{config.expiryDays}d</div>
          <div className="text-sm text-muted-foreground">{p.expiry}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold text-foreground">{p.earningRules}</h2></div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.pointsPerBaht}</label>
              <p className="text-xs text-muted-foreground mb-2">{p.pointsPerBahtDesc}</p>
              <input type="number" min="0.01" max="1" step="0.01" value={config.pointsPerBaht} onChange={e=>update("pointsPerBaht",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.subMultiplier}</label>
              <p className="text-xs text-muted-foreground mb-2">{p.subMultiplierDesc}</p>
              <input type="number" min="1" max="5" step="0.1" value={config.subscriptionMultiplier} onChange={e=>update("subscriptionMultiplier",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.firstBookingBonusPts}</label>
              <input type="number" min="0" step="10" value={config.bonusFirstBooking} onChange={e=>update("bonusFirstBooking",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.referralBonusPts}</label>
              <input type="number" min="0" step="10" value={config.bonusReferral} onChange={e=>update("bonusReferral",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold text-foreground">{p.redemptionExpiry}</h2></div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.redemptionRate}</label>
              <p className="text-xs text-muted-foreground mb-2">{p.redemptionRateDesc}</p>
              <input type="number" min="1" step="10" value={config.redemptionRate} onChange={e=>update("redemptionRate",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">{p.expiryDays}</label>
              <p className="text-xs text-muted-foreground mb-2">{p.expiryDaysDesc}</p>
              <input type="number" min="30" step="30" value={config.expiryDays} onChange={e=>update("expiryDays",Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold text-foreground">{p.earningExamples}</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>{[p.bookingAmount, p.dailyPoints, p.subPoints, p.redemptionValue].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[500,1000,2000,5000].map(amt=>{
              const d = Math.floor(amt * config.pointsPerBaht);
              const s = Math.floor(d * config.subscriptionMultiplier);
              const rv = (v: number) => `฿${Math.floor(v / config.redemptionRate * 10)}`;
              return (
                <tr key={amt} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium text-foreground">฿{amt.toLocaleString()}</td>
                  <td className="px-5 py-3 text-primary font-semibold">+{d} pts</td>
                  <td className="px-5 py-3 text-purple-600 font-semibold">+{s} pts <span className="text-xs text-muted-foreground">({config.subscriptionMultiplier}×)</span></td>
                  <td className="px-5 py-3 text-muted-foreground">{rv(d)} / {rv(s)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
