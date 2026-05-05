import { useState, useMemo } from "react";
import {
  loadCampaigns, addCampaign, updateCampaign, deleteCampaign,
  loadAppUsers, Campaign, CampaignStatus, CampaignType, TargetSegment, AppUser,
  loadDiscountCodes, addDiscountCode, updateDiscountCode, deleteDiscountCode, DiscountCode,
  loadSliders, addSlide, updateSlide, deleteSlide, HomeSlide,
} from "@/data/store";
import { useT } from "@/i18n";
import { Image, Bell, Gift, X, Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Monitor } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

const LINK_TARGETS = [
  { value: "",              label: "No button" },
  { value: "booking",       label: "📅 Book a Service" },
  { value: "redeem",        label: "🎁 Redeem Points" },
  { value: "points",        label: "⭐ My Points" },
  { value: "subscriptions", label: "♾️ Subscriptions" },
];

const EMPTY_SLIDE: Omit<HomeSlide, "id"> = {
  title_en: "", title_th: "", subtitle_en: "", subtitle_th: "",
  imageUrl: "", linkTarget: "", buttonText_en: "", buttonText_th: "",
  active: true, order: 1,
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft:     "bg-gray-100 text-gray-700 border-gray-200",
  sent:      "bg-green-100 text-green-700 border-green-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
};

const CAMPAIGN_TYPES: { value: CampaignType; icon: string; label: string; desc: string }[] = [
  { value: "notification", icon: "🔔", label: "Push Notification",   desc: "Text-only message sent as a push notification" },
  { value: "promo",        icon: "🖼️", label: "Promotion Banner",    desc: "Include an image banner shown in Updates & Promotions" },
  { value: "points",       icon: "🎁", label: "Points Gift",         desc: "Gift loyalty points directly to target users" },
];

type SegmentDef = { value: TargetSegment; label: string; icon: string; desc: string };

function getSegments(): SegmentDef[] {
  return [
    { value: "all",          label: "All Users",                icon: "👥", desc: "Send to every registered user" },
    { value: "daily",        label: "Daily Booking Users",      icon: "📅", desc: "Users who have made at least one daily booking" },
    { value: "subscription", label: "Subscribers Only",         icon: "⭐", desc: "Active subscription plan users" },
    { value: "inactive",     label: "Inactive Users (30+ days)",icon: "😴", desc: "Users with no booking in the last 30 days" },
    { value: "new",          label: "New Users (≤ 2 bookings)", icon: "🆕", desc: "Recently joined users with few bookings" },
    { value: "vip",          label: "VIP Users (10+ bookings)", icon: "👑", desc: "High-frequency loyal customers" },
    { value: "specific",     label: "Specific Users",           icon: "🎯", desc: "Manually pick individual users to target" },
  ];
}

function segmentLabel(seg: TargetSegment) { return getSegments().find(s => s.value === seg)?.label ?? seg; }
function segmentIcon(seg: TargetSegment)  { return getSegments().find(s => s.value === seg)?.icon ?? "📣"; }

const EMPTY_FORM: Omit<Campaign, "id" | "createdAt"> = {
  title: "", body: "", campaignType: "notification", imageUrl: "", pointsGift: 0,
  discountCode: "", discountPctCampaign: 0,
  targetSegment: "all", status: "draft", targetUserIds: [],
};

// ─── User Picker ──────────────────────────────────────────────────────────────
function UserPicker({ allUsers, selected, onChange }: {
  allUsers: AppUser[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all"|"daily"|"subscription"|"both">("all");

  const areas = useMemo(() => ["all", ...Array.from(new Set(allUsers.map(u => u.area)))], [allUsers]);
  const filtered = useMemo(() => allUsers.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || (u.email?.toLowerCase().includes(q) ?? false);
    const matchArea = areaFilter === "all" || u.area === areaFilter;
    const matchType = typeFilter === "all" || u.bookingType === typeFilter || u.bookingType === "both";
    return matchQ && matchArea && matchType;
  }), [allUsers, search, areaFilter, typeFilter]);

  function toggle(id: string) { onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]); }
  function toggleAll() {
    const fids = filtered.map(u => u.id);
    const all = fids.every(id => selected.includes(id));
    if (all) onChange(selected.filter(id => !fids.includes(id)));
    else onChange(Array.from(new Set([...selected, ...fids])));
  }
  const filteredIds = filtered.map(u => u.id);
  const allSel = filteredIds.length > 0 && filteredIds.every(id => selected.includes(id));

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="p-3 bg-accent/40 border-b border-border space-y-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`🔍  ${t.common.search}`}
          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <div className="flex gap-2 flex-wrap">
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
            {areas.map(a => <option key={a} value={a}>{a === "all" ? t.common.allAreas : a}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
            <option value="all">{t.common.all}</option>
            <option value="daily">Daily</option>
            <option value="subscription">Subscription</option>
            <option value="both">Both</option>
          </select>
          <span className="text-xs text-muted-foreground self-center ml-auto">
            {filtered.length} {t.marketing.usersLabel} · {selected.length} {t.marketing.selectedCount}
          </span>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <div onClick={toggleAll} className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30 cursor-pointer hover:bg-accent/50">
          <input type="checkbox" readOnly checked={allSel} className="accent-primary" />
          <span className="text-xs font-semibold text-muted-foreground">{allSel ? t.marketing.deselectAll : t.marketing.selectAll}</span>
        </div>
        {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-5">{t.marketing.noUsersMatch}</div>}
        {filtered.map(u => (
          <div key={u.id} onClick={() => toggle(u.id)} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent/40 border-b border-border last:border-0 ${selected.includes(u.id) ? "bg-primary/5" : ""}`}>
            <input type="checkbox" readOnly checked={selected.includes(u.id)} className="accent-primary flex-shrink-0" />
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{u.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">{u.name}</span>
                {u.status === "inactive" && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">inactive</span>}
                {u.totalBookings >= 10 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">👑 VIP</span>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{u.phone} · {u.area} · {u.bookingType} · {u.totalBookings} bookings</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedChips({ ids, allUsers, onRemove }: { ids: string[]; allUsers: AppUser[]; onRemove: (id: string) => void }) {
  if (ids.length === 0) return <p className="text-xs text-muted-foreground italic">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
      {ids.map(id => {
        const u = allUsers.find(x => x.id === id);
        if (!u) return null;
        return (
          <span key={id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/20">
            {u.name}
            <button onClick={() => onRemove(id)} className="hover:text-red-500 ml-0.5 font-bold">×</button>
          </span>
        );
      })}
    </div>
  );
}

// ─── Campaign Type Badge ───────────────────────────────────────────────────────
function CampaignTypeBadge({ type }: { type: CampaignType }) {
  const def = CAMPAIGN_TYPES.find(c => c.value === type);
  const colors: Record<CampaignType, string> = {
    notification: "bg-blue-50 text-blue-700 border-blue-200",
    promo:        "bg-orange-50 text-orange-700 border-orange-200",
    points:       "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${colors[type]}`}>
      {def?.icon} {def?.label}
    </span>
  );
}

const EMPTY_DC_FORM = { code: "", discountPct: 10, description: "", validUntil: "", active: true, maxUses: 100, usedCount: 0 };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Marketing() {
  const { t } = useT();
  const m = t.marketing;
  const allUsers = useMemo(() => loadAppUsers(), []);
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<Omit<Campaign, "id" | "createdAt">>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<"campaigns" | "codes" | "banners">("campaigns");

  // Discount Codes state
  const [codes, setCodes] = useState<DiscountCode[]>(loadDiscountCodes);

  // ── Home Banners state ────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<HomeSlide[]>(() => loadSliders().sort((a, b) => a.order - b.order));
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [bannerForm, setBannerForm] = useState<Omit<HomeSlide, "id">>(EMPTY_SLIDE);
  const [confirmDeleteSlide, setConfirmDeleteSlide] = useState<string | null>(null);

  const refreshSlides = () => setSlides(loadSliders().sort((a, b) => a.order - b.order));

  function openNewBanner() { setEditingSlide(null); setBannerForm(EMPTY_SLIDE); setShowBannerForm(true); }
  function openEditBanner(s: HomeSlide) {
    setEditingSlide(s);
    setBannerForm({ title_en: s.title_en, title_th: s.title_th, subtitle_en: s.subtitle_en ?? "", subtitle_th: s.subtitle_th ?? "",
      imageUrl: s.imageUrl, linkTarget: s.linkTarget ?? "", buttonText_en: s.buttonText_en ?? "", buttonText_th: s.buttonText_th ?? "",
      active: s.active, order: s.order });
    setShowBannerForm(true);
  }
  function handleSaveBanner() {
    if (!bannerForm.title_en.trim()) return;
    if (editingSlide) updateSlide(editingSlide.id, bannerForm);
    else addSlide({ ...bannerForm, id: `sl${Date.now()}` });
    setShowBannerForm(false); setEditingSlide(null); refreshSlides();
  }
  function handleDeleteSlide(id: string) { deleteSlide(id); setConfirmDeleteSlide(null); refreshSlides(); }
  function toggleSlideActive(s: HomeSlide) { updateSlide(s.id, { active: !s.active }); refreshSlides(); }
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [codeForm, setCodeForm] = useState<Omit<DiscountCode, "id" | "createdAt">>(EMPTY_DC_FORM);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);

  const refreshCodes = () => setCodes(loadDiscountCodes());

  function openNewCode() { setEditingCode(null); setCodeForm(EMPTY_DC_FORM); setShowCodeForm(true); }
  function openEditCode(d: DiscountCode) {
    setEditingCode(d);
    setCodeForm({ code: d.code, discountPct: d.discountPct, description: d.description,
      validUntil: d.validUntil, active: d.active, maxUses: d.maxUses, usedCount: d.usedCount });
    setShowCodeForm(true);
  }
  function handleSaveCode() {
    if (!codeForm.code.trim() || codeForm.discountPct <= 0) return;
    const payload = { ...codeForm, code: codeForm.code.trim().toUpperCase() };
    if (editingCode) updateDiscountCode(editingCode.id, payload);
    else addDiscountCode({ ...payload, id: `dc${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) });
    setShowCodeForm(false); setEditingCode(null); refreshCodes();
  }
  function handleDeleteCode(id: string) { deleteDiscountCode(id); setConfirmDeleteCode(null); refreshCodes(); }
  function toggleCodeActive(d: DiscountCode) { updateDiscountCode(d.id, { active: !d.active }); refreshCodes(); }

  const refresh = () => setCampaigns(loadCampaigns());

  function openNew() { setShowForm(true); setEditing(null); setForm(EMPTY_FORM); }
  function openEdit(c: Campaign) {
    setEditing(c); setShowForm(true);
    setForm({
      title: c.title, body: c.body, campaignType: c.campaignType ?? "notification",
      imageUrl: c.imageUrl ?? "", pointsGift: c.pointsGift ?? 0,
      discountCode: c.discountCode ?? "", discountPctCampaign: c.discountPctCampaign ?? 0,
      targetSegment: c.targetSegment, status: c.status,
      scheduledAt: c.scheduledAt, targetUserIds: c.targetUserIds ?? [],
    });
  }

  function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    if (form.targetSegment === "specific" && (form.targetUserIds?.length ?? 0) === 0) { alert(m.atLeastOne); return; }
    const payload = { ...form };
    if (payload.targetSegment !== "specific") delete payload.targetUserIds;
    if (payload.campaignType !== "promo") delete payload.imageUrl;
    if (payload.campaignType !== "points") delete payload.pointsGift;
    if (editing) updateCampaign(editing.id, payload);
    else addCampaign({ ...payload, id: `cp${Date.now()}`, createdAt: new Date().toISOString().slice(0,10) });
    setShowForm(false); setEditing(null); refresh();
  }

  function handleDelete(id: string) { deleteCampaign(id); setConfirmDelete(null); refresh(); }

  async function handleSend(id: string) {
    setSending(id);
    await new Promise(r => setTimeout(r, 1500));
    const camp = campaigns.find(c => c.id === id);
    const sentCount = camp?.targetSegment === "specific"
      ? (camp.targetUserIds?.length ?? 0)
      : Math.floor(Math.random() * 1000 + 200);
    const now = new Date().toISOString().slice(0, 10);
    updateCampaign(id, { status: "sent", sentAt: now, sentCount });
    // Sync to shared API so mobile app can see it
    if (camp && (camp.campaignType === "promo" || camp.campaignType === "points")) {
      fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...camp, status: "sent", sentAt: now, sentCount }),
      }).catch(() => {});
    }
    setSending(null); refresh();
    const typeLabel = CAMPAIGN_TYPES.find(c => c.value === camp?.campaignType)?.label ?? "campaign";
    alert(`✅ ${typeLabel} sent!\n📱 Delivered to ${sentCount.toLocaleString()} users.`);
  }

  function estimateReach(seg: TargetSegment, ids?: string[]) {
    if (seg === "specific") return ids?.length ?? 0;
    if (seg === "all") return allUsers.length;
    if (seg === "daily") return allUsers.filter(u => u.bookingType === "daily" || u.bookingType === "both").length;
    if (seg === "subscription") return allUsers.filter(u => u.bookingType === "subscription" || u.bookingType === "both").length;
    if (seg === "inactive") return allUsers.filter(u => u.status === "inactive").length;
    if (seg === "new") return allUsers.filter(u => u.totalBookings <= 2).length;
    if (seg === "vip") return allUsers.filter(u => u.totalBookings >= 10).length;
    return 0;
  }

  const totalSent  = campaigns.filter(c=>c.status==="sent").reduce((s,c)=>s+(c.sentCount??0),0);
  const draftCount = campaigns.filter(c=>c.status==="draft").length;

  // ── App preview mock ─────────────────────────────────────────────────────────
  function AppPreviewCard({ c }: { c: Campaign }) {
    return (
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm w-full">
        {c.imageUrl && (
          <div className="relative h-28 bg-gray-100 overflow-hidden">
            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover"
              onError={e => (e.currentTarget.style.display = "none")} />
            {c.campaignType === "points" && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-900/60">
                <div className="text-white text-center">
                  <div className="text-2xl font-black">+{c.pointsGift}</div>
                  <div className="text-xs font-semibold">Points Gift</div>
                </div>
              </div>
            )}
          </div>
        )}
        {!c.imageUrl && c.campaignType === "points" && (
          <div className="h-20 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center gap-3">
            <span className="text-4xl">🎁</span>
            <div className="text-white">
              <div className="text-2xl font-black">+{c.pointsGift ?? 0}</div>
              <div className="text-xs font-semibold opacity-90">Points</div>
            </div>
          </div>
        )}
        <div className="px-3 py-2.5">
          <div className="font-semibold text-gray-900 text-sm">{c.title || "Campaign Title"}</div>
          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.body || "Message preview..."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{m.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{m.subtitle}</p>
        </div>
        {activeTab === "campaigns" ? (
          <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">{m.newCampaign}</button>
        ) : activeTab === "codes" ? (
          <button onClick={openNewCode} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
            <Plus size={15} /> New Discount Code
          </button>
        ) : (
          <button onClick={openNewBanner} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
            <Plus size={15} /> New Banner
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "campaigns" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Bell size={14} /> Campaigns
        </button>
        <button
          onClick={() => setActiveTab("codes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "codes" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Tag size={14} /> Discount Codes
          <span className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">{codes.filter(c => c.active).length}</span>
        </button>
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "banners" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Monitor size={14} /> Home Banners
          <span className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">{slides.filter(s => s.active).length}</span>
        </button>
      </div>

      {activeTab === "banners" ? (
        /* ── Home Banners Panel ── */
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary flex items-start gap-3">
            <Monitor size={18} className="flex-shrink-0 mt-0.5" />
            <p>Banners appear as a scrolling carousel on the home screen. Set a <strong>Link Target</strong> + <strong>Button Text</strong> to give users a quick action button on each slide.</p>
          </div>
          {slides.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Monitor size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No banners yet</p>
              <p className="text-sm mt-1">Click "New Banner" to add one</p>
            </div>
          )}
          <div className="grid gap-4">
            {slides.map(s => {
              const linkLabel = LINK_TARGETS.find(l => l.value === (s.linkTarget ?? ""))?.label ?? "No button";
              return (
                <div key={s.id} className={`bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row ${!s.active ? "opacity-60" : "border-border"}`}>
                  {/* Image */}
                  <div className="md:w-48 h-32 md:h-auto flex-shrink-0 bg-muted relative">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.title_en} className="w-full h-full object-cover"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Monitor size={32} className="opacity-30" />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{s.title_en}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{s.order}</span>
                    </div>
                    {s.subtitle_en && <p className="text-sm text-muted-foreground">{s.subtitle_en}</p>}
                    {s.title_th && <p className="text-xs text-muted-foreground">TH: {s.title_th}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{linkLabel}</span>
                      {s.buttonText_en && <span className="text-xs bg-muted border border-border px-2 py-0.5 rounded-full">🔘 {s.buttonText_en}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 p-4 justify-end md:justify-center border-t md:border-t-0 md:border-l border-border">
                    <button onClick={() => openEditBanner(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 font-medium">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => toggleSlideActive(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-accent text-foreground font-medium">
                      {s.active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} {s.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setConfirmDeleteSlide(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === "codes" ? (
        /* ── Discount Codes Panel ── */
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Codes", value: codes.length, icon: "🏷️" },
              { label: "Active", value: codes.filter(c => c.active).length, icon: "✅" },
              { label: "Total Uses", value: codes.reduce((s, c) => s + c.usedCount, 0).toLocaleString(), icon: "📊" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg">{s.icon}</div>
                <div><div className="text-2xl font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Codes list */}
          <div className="space-y-3">
            {codes.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Tag size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No discount codes yet</p>
                <p className="text-sm mt-1">Click "New Discount Code" to create one</p>
              </div>
            )}
            {codes.map(dc => {
              const usePct = dc.maxUses > 0 ? Math.min(100, Math.round((dc.usedCount / dc.maxUses) * 100)) : 0;
              const expired = dc.validUntil && new Date(dc.validUntil) < new Date();
              return (
                <div key={dc.id} className={`bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4 ${dc.active && !expired ? "border-border" : "border-border opacity-60"}`}>
                  {/* Code badge */}
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-2 rounded-lg border-2 border-dashed font-mono font-bold text-lg tracking-widest ${dc.active && !expired ? "border-primary text-primary bg-primary/5" : "border-gray-300 text-gray-400 bg-gray-50"}`}>
                      {dc.code}
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-2xl font-black text-primary">{dc.discountPct}%</span>
                      <span className="text-xs text-muted-foreground ml-1">OFF</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${dc.active && !expired ? "bg-green-50 text-green-700 border-green-200" : expired ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {expired ? "Expired" : dc.active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-muted-foreground">Valid until {dc.validUntil || "—"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{dc.description || "—"}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{dc.usedCount.toLocaleString()} / {dc.maxUses.toLocaleString()} uses</span>
                        <span>{usePct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usePct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleCodeActive(dc)} title={dc.active ? "Deactivate" : "Activate"}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      {dc.active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => openEditCode(dc)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDeleteCode(dc.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: m.totalCampaigns, value: campaigns.length, icon:"📣" },
          { label: m.totalReached,   value: totalSent.toLocaleString(), icon:"📱" },
          { label: m.draftsPending,  value: draftCount, icon:"📝" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg">{s.icon}</div>
            <div><div className="text-2xl font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map(c => {
          const reach = estimateReach(c.targetSegment, c.targetUserIds);
          const targetedUsers = c.targetSegment === "specific" && c.targetUserIds ? allUsers.filter(u => c.targetUserIds!.includes(u.id)) : [];
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex gap-0">
                {/* Image thumbnail */}
                {c.campaignType === "promo" && c.imageUrl && (
                  <div className="w-28 flex-shrink-0 bg-muted overflow-hidden">
                    <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover min-h-[96px]"
                      onError={e => (e.currentTarget.parentElement!.style.display = "none")} />
                  </div>
                )}
                {c.campaignType === "points" && (
                  <div className="w-28 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <span className="text-3xl">🎁</span>
                    <div className="text-white text-center leading-tight">
                      <div className="text-lg font-black">+{c.pointsGift ?? 0}</div>
                      <div className="text-[10px] font-semibold opacity-90">pts</div>
                    </div>
                  </div>
                )}
                {c.campaignType === "notification" && (
                  <div className="w-14 flex-shrink-0 bg-blue-50 flex items-center justify-center min-h-[96px]">
                    <Bell size={22} className="text-blue-400" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                        <CampaignTypeBadge type={c.campaignType ?? "notification"} />
                        <span className="text-xs bg-accent px-2 py-0.5 rounded-full text-foreground font-medium">{segmentIcon(c.targetSegment)} {segmentLabel(c.targetSegment)}</span>
                        <span className="text-xs text-muted-foreground">~{reach} {m.usersLabel}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{c.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{c.body}</p>
                      {c.targetSegment === "specific" && targetedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {targetedUsers.slice(0, 4).map(u => <span key={u.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{u.name}</span>)}
                          {targetedUsers.length > 4 && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{targetedUsers.length - 4} more</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{m.created} {c.createdAt}</span>
                        {c.sentAt && <span>{m.sent} {c.sentAt}</span>}
                        {c.sentCount != null && <span>📱 {c.sentCount.toLocaleString()} {m.delivered}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {c.status === "draft" && (
                        <button onClick={() => handleSend(c.id)} disabled={sending===c.id} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 min-w-[80px]">
                          {sending===c.id ? m.sending : m.send}
                        </button>
                      )}
                      <button onClick={() => openEdit(c)} className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg hover:bg-accent">{t.common.edit}</button>
                      <button onClick={() => setConfirmDelete(c.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100">{t.common.delete}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {campaigns.length === 0 && <div className="text-center text-muted-foreground py-12 bg-card border border-border rounded-xl">{m.noCampaigns}</div>}
      </div>
      </>
      )}

      {/* ── Campaign Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="font-bold text-foreground text-lg">{editing ? m.editCampaign : m.newCampaignTitle}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Campaign Type */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.campaignType}</label>
                <div className="grid grid-cols-3 gap-2">
                  {CAMPAIGN_TYPES.map(ct => (
                    <button key={ct.value} type="button"
                      onClick={() => setForm(f => ({ ...f, campaignType: ct.value, imageUrl: "", pointsGift: 0 }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${form.campaignType === ct.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-accent/30"}`}>
                      <span className="text-2xl">{ct.icon}</span>
                      <span className="text-xs font-semibold text-foreground leading-tight">{ct.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{ct.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload — promo only */}
              {form.campaignType === "promo" && (
                <>
                  <ImageUploadField
                    label={<span className="flex items-center gap-1.5"><Image size={12} /> {m.imageUrl}</span>}
                    value={form.imageUrl ?? ""}
                    onChange={v => setForm(f => ({ ...f, imageUrl: v }))}
                    hint={m.imageUrlHint}
                  />
                  {/* Discount code & percent */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        🏷️ Discount Code
                      </label>
                      <input
                        value={form.discountCode ?? ""}
                        onChange={e => setForm(f => ({ ...f, discountCode: e.target.value.toUpperCase() }))}
                        placeholder="PROMO15"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        % Discount
                      </label>
                      <input
                        type="number" min="0" max="100"
                        value={form.discountPctCampaign ?? 0}
                        onChange={e => setForm(f => ({ ...f, discountPctCampaign: Number(e.target.value) }))}
                        placeholder="15"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Points Gift — points only */}
              {form.campaignType === "points" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Gift size={12} /> {m.pointsGift}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex-1">
                      <span className="text-2xl">🎁</span>
                      <input type="number" min="1" step="50" value={form.pointsGift ?? 0}
                        onChange={e => setForm(f => ({ ...f, pointsGift: Math.max(0, Number(e.target.value)) }))}
                        className="flex-1 text-2xl font-black text-purple-700 bg-transparent focus:outline-none w-24 min-w-0" />
                      <span className="text-sm font-semibold text-purple-600 flex-shrink-0">pts</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[50, 100, 200, 500].map(v => (
                        <button key={v} type="button" onClick={() => setForm(f => ({ ...f, pointsGift: v }))}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${form.pointsGift === v ? "bg-purple-600 text-white border-purple-600" : "border-border text-muted-foreground hover:border-purple-300 hover:text-purple-600"}`}>
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{m.pointsGiftHint}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><Bell size={12} /> {m.titleField}</span>
                </label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={form.campaignType === "promo" ? "New Year Special 🎉" : form.campaignType === "points" ? "Subscriber Gift 🎁" : "Songkran Special 🎉"} />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{m.messageField}</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder={form.campaignType === "points" ? "You've been gifted points — thank you for your loyalty!" : "Write your push notification message..."} />
              </div>

              {/* App Preview */}
              {(form.campaignType === "promo" || form.campaignType === "points") && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.appPreview}</label>
                  <div className="w-48">
                    <AppPreviewCard c={{ ...form, id: "preview", createdAt: "" }} />
                  </div>
                </div>
              )}

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.targetAudience}</label>
                <div className="grid grid-cols-1 gap-2">
                  {getSegments().map(seg => (
                    <label key={seg.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.targetSegment === seg.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"}`}>
                      <input type="radio" name="segment" value={seg.value} checked={form.targetSegment === seg.value}
                        onChange={() => setForm(f => ({ ...f, targetSegment: seg.value, targetUserIds: [] }))} className="accent-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{seg.icon}</span>
                          <span className="text-sm font-semibold text-foreground">{seg.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">~{estimateReach(seg.value, form.targetUserIds)} {m.usersLabel}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{seg.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specific User Picker */}
              {form.targetSegment === "specific" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.selectUsers}</label>
                  <UserPicker allUsers={allUsers} selected={form.targetUserIds ?? []} onChange={ids => setForm(f => ({ ...f, targetUserIds: ids }))} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{m.selectedCount} ({form.targetUserIds?.length ?? 0}):</p>
                    <SelectedChips ids={form.targetUserIds ?? []} allUsers={allUsers} onRemove={id => setForm(f => ({ ...f, targetUserIds: (f.targetUserIds ?? []).filter(x => x !== id) }))} />
                  </div>
                  {(form.targetUserIds?.length ?? 0) === 0 && <p className="text-xs text-red-500">{m.atLeastOne}</p>}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={handleSave}
                disabled={
                  !form.title.trim() || !form.body.trim() ||
                  (form.targetSegment === "specific" && (form.targetUserIds?.length ?? 0) === 0) ||
                  (form.campaignType === "points" && (form.pointsGift ?? 0) <= 0)
                }
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">
                {m.saveAsDraft}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Campaign */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2">{m.deleteCampaign}</h3>
            <p className="text-sm text-muted-foreground">{t.common.cannotUndo}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">{t.common.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Discount Code Form Modal ── */}
      {showCodeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                {editingCode ? "Edit Discount Code" : "New Discount Code"}
              </h3>
              <button onClick={() => { setShowCodeForm(false); setEditingCode(null); }}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Discount Code <span className="text-red-500">*</span>
                </label>
                <input
                  value={codeForm.code}
                  onChange={e => setCodeForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER20"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-widest font-bold uppercase"
                />
              </div>

              {/* Discount % */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Discount Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number" min={1} max={100}
                    value={codeForm.discountPct}
                    onChange={e => setCodeForm(f => ({ ...f, discountPct: Number(e.target.value) }))}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                <input
                  value={codeForm.description}
                  onChange={e => setCodeForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Summer promotion for all users"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Valid Until + Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Valid Until</label>
                  <input
                    type="date"
                    value={codeForm.validUntil}
                    onChange={e => setCodeForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Max Uses</label>
                  <input
                    type="number" min={1}
                    value={codeForm.maxUses}
                    onChange={e => setCodeForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setCodeForm(f => ({ ...f, active: !f.active }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${codeForm.active ? "bg-primary" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${codeForm.active ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{codeForm.active ? "Active" : "Inactive"}</span>
              </label>

              {/* Preview */}
              {codeForm.code && codeForm.discountPct > 0 && (
                <div className="border-2 border-dashed border-primary rounded-xl p-4 flex items-center gap-4 bg-primary/5">
                  <div className="text-center">
                    <div className="font-mono font-black text-primary tracking-widest text-lg">{codeForm.code}</div>
                    <div className="text-3xl font-black text-primary">{codeForm.discountPct}% OFF</div>
                  </div>
                  <div className="text-sm text-muted-foreground flex-1">{codeForm.description || "No description"}</div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowCodeForm(false); setEditingCode(null); }}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted">{t.common.cancel}</button>
              <button
                onClick={handleSaveCode}
                disabled={!codeForm.code.trim() || codeForm.discountPct <= 0}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">
                {editingCode ? "Update Code" : "Create Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Code */}
      {confirmDeleteCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2">Delete Discount Code</h3>
            <p className="text-sm text-muted-foreground">{t.common.cannotUndo}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDeleteCode(null)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={() => handleDeleteCode(confirmDeleteCode)} className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">{t.common.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner Form Modal ── */}
      {showBannerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground text-lg">{editingSlide ? "Edit Banner" : "New Home Banner"}</h2>
              <button onClick={() => { setShowBannerForm(false); setEditingSlide(null); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Title (EN) *</label>
                  <input value={bannerForm.title_en} onChange={e => setBannerForm(f => ({ ...f, title_en: e.target.value }))}
                    placeholder="e.g. Redeem Your Points"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Title (TH)</label>
                  <input value={bannerForm.title_th} onChange={e => setBannerForm(f => ({ ...f, title_th: e.target.value }))}
                    placeholder="e.g. แลกรับของรางวัล"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {/* Subtitles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Subtitle (EN)</label>
                  <input value={bannerForm.subtitle_en} onChange={e => setBannerForm(f => ({ ...f, subtitle_en: e.target.value }))}
                    placeholder="e.g. Use points for e-vouchers & gifts"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Subtitle (TH)</label>
                  <input value={bannerForm.subtitle_th} onChange={e => setBannerForm(f => ({ ...f, subtitle_th: e.target.value }))}
                    placeholder="e.g. ใช้คะแนนแลกรับบัตรกำนัล"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {/* Image */}
              <ImageUploadField label="Banner Image" value={bannerForm.imageUrl}
                onChange={v => setBannerForm(f => ({ ...f, imageUrl: v }))}
                hint="Recommended 800×300 px" previewHeight="h-32" />
              {/* Link Target */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Link Target (button action)</label>
                <div className="grid grid-cols-3 gap-2">
                  {LINK_TARGETS.map(lt => (
                    <label key={lt.value} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${bannerForm.linkTarget === lt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <input type="radio" name="banner_link" value={lt.value} checked={bannerForm.linkTarget === lt.value}
                        onChange={() => setBannerForm(f => ({ ...f, linkTarget: lt.value }))} className="accent-primary" />
                      <span className="text-sm">{lt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Button text — only if link target is set */}
              {bannerForm.linkTarget && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Button Text (EN)</label>
                    <input value={bannerForm.buttonText_en} onChange={e => setBannerForm(f => ({ ...f, buttonText_en: e.target.value }))}
                      placeholder="e.g. Redeem Now"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Button Text (TH)</label>
                    <input value={bannerForm.buttonText_th} onChange={e => setBannerForm(f => ({ ...f, buttonText_th: e.target.value }))}
                      placeholder="e.g. แลกเลย"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              )}
              {/* Order + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Display Order</label>
                  <input type="number" min="1" value={bannerForm.order}
                    onChange={e => setBannerForm(f => ({ ...f, order: Math.max(1, Number(e.target.value)) }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {([true, false] as const).map(v => (
                      <label key={String(v)} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer ${bannerForm.active === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <input type="radio" checked={bannerForm.active === v} onChange={() => setBannerForm(f => ({ ...f, active: v }))} className="accent-primary" />
                        <span className="text-sm">{v ? "✅ Active" : "⛔ Inactive"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* Preview */}
              {bannerForm.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-border relative h-36">
                  <img src={bannerForm.imageUrl} alt="preview" className="w-full h-full object-cover"
                    onError={e => (e.currentTarget.style.display = "none")} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-lg leading-tight">{bannerForm.title_en || "Banner Title"}</p>
                    {bannerForm.subtitle_en && <p className="text-white/80 text-sm">{bannerForm.subtitle_en}</p>}
                    {bannerForm.linkTarget && bannerForm.buttonText_en && (
                      <span className="mt-2 self-start bg-white text-primary text-xs font-bold px-3 py-1 rounded-full">{bannerForm.buttonText_en}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowBannerForm(false); setEditingSlide(null); }}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={handleSaveBanner} disabled={!bannerForm.title_en.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40">
                {editingSlide ? "Update Banner" : "Create Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Slide */}
      {confirmDeleteSlide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2">Delete Banner</h3>
            <p className="text-sm text-muted-foreground">{t.common.cannotUndo}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDeleteSlide(null)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
              <button onClick={() => handleDeleteSlide(confirmDeleteSlide)} className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">{t.common.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
