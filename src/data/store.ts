// ─────────────────────────────────────────────
//  Ayasan Admin – Central Data Store (localStorage)
// ─────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type BookingType   = "daily" | "subscription";
export type WorkerStatus  = "available" | "busy" | "off";
export type ReviewRating  = 1 | 2 | 3;   // 1=unsatisfied 2=satisfied 3=very satisfied

export interface SubscriptionSchedule {
  frequency: 2 | 3 | 4;
  daySlots: {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startTime: string;
    hours: number;
  }[];
}

// ── Bookings ──────────────────────────────────
export interface BookingReview {
  rating: ReviewRating;
  createdAt: string;
  comment?: string;
}
export interface NannyServiceExtras {
  children?: { age: string }[];
  gender?: string;
  locationType?: string;
  notes?: string;
}

export interface ElderlyServiceExtras {
  age?: string;
  gender?: string;
  careTypes?: string[];
  healthNotes?: string;
  locationType?: string;
  notes?: string;
}

export interface PetCareServiceExtras {
  petType?: string;
  petCount?: number;
  petNotes?: string;
}

export interface FullBookingRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  service: string;
  serviceSlug: string;
  serviceIcon: string;
  date: string;
  startTime: string;
  hours: number;
  address: string;
  area: ServiceArea;
  total: number;
  bookingType: BookingType;
  status: BookingStatus;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  workerLineId?: string;
  notes?: string;
  review?: BookingReview;
  createdAt: string;
  pointsEarned?: number;
  parentBookingId?: string;
  multiDateTotal?: number;
  requestedWorkerId?: string;
  requestedWorkerName?: string;
  serviceExtras?: NannyServiceExtras | ElderlyServiceExtras | PetCareServiceExtras | Record<string, unknown>;
  paymentMethod?: "cash" | "card" | "transfer";
  pointsUsed?: number;
  pointsDiscount?: number;
  promoCode?: string;
  promoDiscount?: number;
  addons?: { id: string; label: string; price: number }[];
  subscriptionSchedule?: SubscriptionSchedule;
}

// ── Workers ──────────────────────────────────
export interface WorkerProfile {
  id: string;
  full_name: string;
  phone: string;
  line_id: string;
  services: string[];
  status: WorkerStatus;
  rating: number;
  completedJobs: number;
  joinedDate: string;
  area: ServiceArea;
  photoUrl?: string;
}

// ── Pricing ──────────────────────────────────
export type ServiceArea = "bangkok" | "phuket" | "pattaya" | "chiangmai";

export interface PriceTier { minHours: number; maxHours: number | null; ratePerHour: number; }
export interface ServicePriceConfig {
  slug: string;
  label: string;
  icon: string;
  minHours: number;
  tiers: PriceTier[];           // base tiers (Bangkok = default)
  areaMultiplier: Record<ServiceArea, number>;  // 1.0 = no change
}

export interface AcTypePrice { id: string; typeEn: string; btuEn: string; price: number; }

export interface DeepCleanPackage {
  id: string;
  maxArea: number;       // m²
  taskers: number;
  hours: number;
  price: number;
}

export interface AddonPriceConfig {
  id: string;
  name_en: string;
  name_th: string;
  name_ja?: string;
  name_zh?: string;
  name_ko?: string;
  desc_en: string;
  desc_th: string;
  desc_ja?: string;
  desc_zh?: string;
  desc_ko?: string;
  price_per_hour: number;
  price_per_time: number;
  active: boolean;
  services?: string[];  // slugs of services that show this option; empty/undefined = all services
}

export interface SubscriptionTier {
  label: string;
  minHours: number;
  discountPct: number;
}

// ── Trip Driver Pricing ───────────────────────
export interface DriverCarOption {
  id: string;
  label_en: string;
  pricePerDay: number;
}
export interface DriverPriceConfig {
  basePricePerDay: number;
  areaMultiplier: Record<ServiceArea, number>;
  carOptions: DriverCarOption[];
}

// ── Points ────────────────────────────────────
export interface PointsConfig {
  pointsPerBaht: number;          // e.g. 1 point per ฿10
  redemptionRate: number;         // e.g. 100 points = ฿10
  subscriptionMultiplier: number; // e.g. 1.5×
  bonusFirstBooking: number;
  bonusReferral: number;
  expiryDays: number;
  enabled: boolean;
}

// ── App Users (for campaign targeting) ───────
export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  area: string;
  bookingType: "daily" | "subscription" | "both";
  totalBookings: number;
  lastBooking: string;
  status: "active" | "inactive";
  avatar?: string;
}

// ── Marketing ────────────────────────────────
export type CampaignStatus = "draft" | "sent" | "scheduled";
export type TargetSegment = "all" | "daily" | "subscription" | "inactive" | "new" | "vip" | "specific";
export type CampaignType = "notification" | "promo" | "points";

export interface Campaign {
  id: string;
  title: string;
  body: string;
  campaignType: CampaignType;
  imageUrl?: string;
  discountCode?: string;
  discountPctCampaign?: number;
  pointsGift?: number;
  targetSegment: TargetSegment;
  targetUserIds?: string[];
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  sentCount?: number;
  createdAt: string;
}

// ── Home Sliders ──────────────────────────────
export interface HomeSlide {
  id: string;
  title_en: string;
  title_th: string;
  subtitle_en?: string;
  subtitle_th?: string;
  imageUrl: string;
  linkTarget?: string;
  buttonText_en?: string;
  buttonText_th?: string;
  active: boolean;
  order: number;
}

// ── App Feedback ──────────────────────────────
export type FeedbackCategory = "bug" | "feature" | "general" | "complaint";
export type FeedbackStatus   = "new" | "reviewed" | "resolved";
export interface AppFeedback {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating: number;        // 1–5 app store style
  appVersion: string;
  os: "ios" | "android";
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: string;
}

// ── Discount Codes ─────────────────────────────
export interface DiscountCode {
  id: string;
  code: string;
  discountPct: number;
  description: string;
  validUntil: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

// ── Promotions ────────────────────────────────
export interface Promotion {
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

// ─────────────────────────────────────────────
//  Storage Keys
// ─────────────────────────────────────────────
const KEYS = {
  bookings:     "full_bookings_v7",
  workers:      "workers_list_v3",
  servicePricing: "service_pricing_v3",
  acPricing:    "ac_pricing_v2",
  deepCleanPricing: "deep_clean_pricing_v1",
  addonPricing: "addon_options_v1",
  subscriptions: "subscription_tiers_v2",
  points:       "points_config_v2",
  campaigns:    "marketing_campaigns_v3",
  sliders:      "home_sliders_v4",
  promotions:   "promotions_v2",
  feedback:     "app_feedback_v1",
  gifts:        "gift_catalog_v2",
  giftCodes:    "gift_codes_v1",
  giftRedemptions: "gift_redemptions_v1",
  discountCodes: "ayasan_discount_codes_v1",
  driverPricing: "driver_pricing_v1",
};

// ─────────────────────────────────────────────
//  Seed Data
// ─────────────────────────────────────────────
export const SERVICE_OPTIONS: Pick<ServicePriceConfig, "slug" | "label" | "icon">[] = [
  { slug: "maid",       label: "Maid",          icon: "🧹" },
  { slug: "nanny",      label: "Nanny",          icon: "👶" },
  { slug: "elderly",    label: "Elderly Care",   icon: "🧓" },
  { slug: "petcare",    label: "Pet Care",       icon: "🐾" },
  { slug: "officemaid", label: "Office Maid",    icon: "🏢" },
  { slug: "ac",         label: "AC Cleaning",    icon: "❄️" },
  { slug: "deepclean",  label: "Deep Cleaning",  icon: "🧽" },
  { slug: "driver",     label: "Trip Driver",    icon: "🚗" },
];

export const AREAS: { id: ServiceArea; label: string }[] = [
  { id: "bangkok",   label: "Bangkok / กรุงเทพฯ" },
  { id: "phuket",    label: "Phuket / ภูเก็ต" },
  { id: "pattaya",   label: "Pattaya / พัทยา" },
  { id: "chiangmai", label: "Chiang Mai / เชียงใหม่" },
];

const SEED_SERVICE_PRICING: ServicePriceConfig[] = [
  { slug: "maid",       label: "Maid",        icon: "🧹", minHours: 2, tiers: [{ minHours: 2, maxHours: 2, ratePerHour: 250 }, { minHours: 3, maxHours: null, ratePerHour: 210 }], areaMultiplier: { bangkok: 1.0, phuket: 1.1, pattaya: 1.0, chiangmai: 0.95 } },
  { slug: "nanny",      label: "Nanny",       icon: "👶", minHours: 2, tiers: [{ minHours: 2, maxHours: 2, ratePerHour: 270 }, { minHours: 3, maxHours: null, ratePerHour: 240 }], areaMultiplier: { bangkok: 1.0, phuket: 1.1, pattaya: 1.05, chiangmai: 0.95 } },
  { slug: "elderly",    label: "Elderly Care",icon: "🧓", minHours: 2, tiers: [{ minHours: 2, maxHours: null, ratePerHour: 420 }], areaMultiplier: { bangkok: 1.0, phuket: 1.1, pattaya: 1.05, chiangmai: 0.95 } },
  { slug: "petcare",    label: "Pet Care",    icon: "🐾", minHours: 2, tiers: [{ minHours: 2, maxHours: 2, ratePerHour: 230 }, { minHours: 3, maxHours: null, ratePerHour: 220 }], areaMultiplier: { bangkok: 1.0, phuket: 1.1, pattaya: 1.0, chiangmai: 0.95 } },
  { slug: "officemaid", label: "Office Maid", icon: "🏢", minHours: 2, tiers: [{ minHours: 2, maxHours: 2, ratePerHour: 250 }, { minHours: 3, maxHours: null, ratePerHour: 210 }], areaMultiplier: { bangkok: 1.0, phuket: 1.1, pattaya: 1.0, chiangmai: 0.95 } },
  { slug: "driver",     label: "Trip Driver", icon: "🚗", minHours: 2, tiers: [{ minHours: 2, maxHours: null, ratePerHour: 350 }], areaMultiplier: { bangkok: 1.0, phuket: 1.15, pattaya: 1.1, chiangmai: 0.95 } },
];

const SEED_DEEP_CLEAN_PACKAGES: DeepCleanPackage[] = [
  { id: "dc_60",  maxArea: 60,  taskers: 2, hours: 3, price: 1920  },
  { id: "dc_80",  maxArea: 80,  taskers: 2, hours: 4, price: 2560  },
  { id: "dc_100", maxArea: 100, taskers: 3, hours: 3, price: 2880  },
  { id: "dc_150", maxArea: 150, taskers: 3, hours: 4, price: 3840  },
  { id: "dc_200", maxArea: 200, taskers: 4, hours: 4, price: 5120  },
  { id: "dc_400", maxArea: 400, taskers: 4, hours: 8, price: 11008 },
];

const SEED_AC_PRICING: AcTypePrice[] = [
  { id: "wall_sm",  typeEn: "Wall Type (9,000–23,000 BTU)",    btuEn: "9,000–23,000 BTU",   price: 850  },
  { id: "wall_lg",  typeEn: "Wall Type (24,000–36,000 BTU)",   btuEn: "24,000–36,000 BTU",  price: 900  },
  { id: "ceil_sm",  typeEn: "Ceiling Type (18,000–24,000 BTU)",btuEn: "18,000–24,000 BTU",  price: 1500 },
  { id: "ceil_lg",  typeEn: "Ceiling Type (25,000–60,000 BTU)",btuEn: "25,000–60,000 BTU",  price: 1800 },
  { id: "cass_sm",  typeEn: "Cassette (18,000–30,000 BTU)",    btuEn: "18,000–30,000 BTU",  price: 1500 },
  { id: "cass_lg",  typeEn: "Cassette (30,000–60,000 BTU)",    btuEn: "30,000–60,000 BTU",  price: 1800 },
];

const SEED_ADDON_PRICING: AddonPriceConfig[] = [
  { id: "english",      name_en: "English Speaker",    name_th: "พูดภาษาอังกฤษ",       name_ja: "英語対応",        name_zh: "英语服务",     name_ko: "영어 가능",
    desc_en: "Basic English language",                 desc_th: "สื่อสารภาษาอังกฤษขั้นพื้นฐาน",    desc_ja: "基本的な英語対応",              desc_zh: "基本英语沟通",          desc_ko: "기본 영어 소통",
    price_per_hour: 0, price_per_time: 120, active: true,
    services: ["maid","nanny","elderly","petcare","officemaid","driver","deepclean"] },

  { id: "cooking",      name_en: "Cooking (Thai food)", name_th: "ทำอาหารไทย",          name_ja: "タイ料理調理",    name_zh: "泰式烹饪",     name_ko: "태국 요리",
    desc_en: "Thai food only. Price is not included food material", desc_th: "เฉพาะอาหารไทย ราคาไม่รวมวัตถุดิบ", desc_ja: "タイ料理のみ。食材費は別途", desc_zh: "仅限泰式料理，不含食材费用", desc_ko: "태국 음식만 가능. 재료비 별도",
    price_per_hour: 0, price_per_time: 150, active: true,
    services: ["maid","nanny","elderly"] },

  { id: "shopping",     name_en: "Shopping Support",   name_th: "ช่วยซื้อของ",          name_ja: "買い物サポート",  name_zh: "购物协助",     name_ko: "쇼핑 보조",
    desc_en: "Not including transportation cost",      desc_th: "ไม่รวมค่าเดินทาง",                 desc_ja: "交通費は含まれません",          desc_zh: "不含交通费",            desc_ko: "교통비 미포함",
    price_per_hour: 0, price_per_time: 200, active: true,
    services: ["maid","nanny","elderly"] },

  { id: "supplies",     name_en: "Cleaning Supplies",  name_th: "อุปกรณ์ทำความสะอาด",  name_ja: "清掃用具持参",    name_zh: "清洁用品",     name_ko: "청소 용품",
    desc_en: "Mop, Cleaning Detergent, Broom",         desc_th: "ไม้ถูพื้น น้ำยาทำความสะอาด ไม้กวาด", desc_ja: "モップ・洗剤・ほうきを持参", desc_zh: "拖把、清洁剂、扫帚",       desc_ko: "대걸레, 세제, 빗자루 포함",
    price_per_hour: 0, price_per_time: 240, active: true,
    services: ["maid","officemaid","deepclean"] },

  { id: "insurance",    name_en: "Insurance Coverage", name_th: "ประกันความเสียหาย",    name_ja: "損害補償保険",    name_zh: "损坏保障",     name_ko: "손해 보험",
    desc_en: "Cover max 10,000 baht for lost / damage",desc_th: "คุ้มครองสูงสุด 10,000 บาท กรณีสูญหาย/เสียหาย", desc_ja: "紛失・破損最大10,000バーツ補償", desc_zh: "丢失/损坏最高赔偿10,000泰铢", desc_ko: "분실/파손 최대 10,000바트 보상",
    price_per_hour: 0, price_per_time: 240, active: true,
    services: ["maid","nanny","elderly","petcare","officemaid","deepclean"] },

  { id: "extra_helper", name_en: "Extra 1 Helper",     name_th: "ผู้ช่วยเพิ่ม 1 คน",   name_ja: "ヘルパー追加1名", name_zh: "额外助手1名",  name_ko: "추가 도우미 1명",
    desc_en: "In case for booking 2 people",           desc_th: "สำหรับจอง 2 คน",                    desc_ja: "2名での予約の場合",             desc_zh: "适用于预约2人的情况",       desc_ko: "2인 예약 시 추가",
    price_per_hour: 0, price_per_time: 600, active: true,
    services: ["maid","nanny","elderly","petcare","officemaid"] },

  { id: "overnight",    name_en: "Overnight Stay",     name_th: "ค้างคืน",              name_ja: "宿泊対応",        name_zh: "过夜服务",     name_ko: "숙박 서비스",
    desc_en: "For multi-day or out-of-city assignments. Overnight fee applied automatically.",
    desc_th: "สำหรับงานหลายวันหรือต่างจังหวัด ค่าค้างคืนคิดอัตโนมัติ", desc_ja: "複数日・他県の場合。宿泊費は自動計算", desc_zh: "多日或外地任务，自动收取住宿费", desc_ko: "다일 또는 타 지역 서비스. 숙박비 자동 적용",
    price_per_hour: 0, price_per_time: 500, active: true,
    services: ["driver","nanny"] },

  { id: "ironing",      name_en: "Ironing",            name_th: "รีดผ้า",               name_ja: "アイロン掛け",    name_zh: "熨衣服",       name_ko: "다림질",
    desc_en: "Ironing clothes (per session)",           desc_th: "รีดผ้า (ต่อครั้ง)",                 desc_ja: "衣類のアイロン掛け（1回分）",    desc_zh: "熨烫衣物（每次）",           desc_ko: "의류 다림질 (1회)",
    price_per_hour: 0, price_per_time: 100, active: false,
    services: ["maid","officemaid"] },

  { id: "laundry",      name_en: "Laundry",            name_th: "ซักผ้า",               name_ja: "洗濯",            name_zh: "洗衣服",       name_ko: "세탁",
    desc_en: "Wash & fold (per session)",               desc_th: "ซักและพับผ้า (ต่อครั้ง)",            desc_ja: "洗濯・折り畳み（1回分）",       desc_zh: "洗涤折叠（每次）",           desc_ko: "세탁 및 접기 (1회)",
    price_per_hour: 0, price_per_time: 150, active: false,
    services: ["maid","officemaid"] },
];

const SEED_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { label: "Basic",    minHours: 1,  discountPct: 5  },
  { label: "Standard", minHours: 13, discountPct: 10 },
  { label: "Premium",  minHours: 25, discountPct: 20 },
];

const SEED_POINTS: PointsConfig = {
  pointsPerBaht: 0.1,          // 1 point per ฿10
  redemptionRate: 100,          // 100 points = ฿10
  subscriptionMultiplier: 1.5,
  bonusFirstBooking: 200,
  bonusReferral: 100,
  expiryDays: 365,
  enabled: true,
};

const SEED_BOOKINGS: FullBookingRecord[] = [
  // ── Pending (未確認) — ワーカー未割当て, 管理者の対応待ち ──
  { id: "BK-001", customerId: "c1",  customerName: "Kotaro Ise",      customerPhone: "+66 81 234 5678", customerEmail: "kotaro@example.com", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "02/05/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily",        status: "pending",   createdAt: "2026-04-26", notes: "Please bring eco-friendly products", paymentMethod: "card", pointsUsed: 100, pointsDiscount: 50, addons: [{ id: "deep_clean", label: "Deep Cleaning", price: 300 }] },
  { id: "BK-002", customerId: "c2",  customerName: "Sarah Chen",       customerPhone: "+66 92 345 6789", customerEmail: "sarah.chen@gmail.com", service: "Nanny",        serviceSlug: "nanny",      serviceIcon: "👶", date: "03/05/2026", startTime: "08:00", hours: 6, address: "Ploenchit Center, Bangkok",               area: "bangkok",   total: 1620,  bookingType: "daily",        status: "pending",   createdAt: "2026-04-26", serviceExtras: { children: [{ age: "3" }, { age: "6" }], gender: "girl", locationType: "home", notes: "Peanut allergy. Please avoid any products containing nuts." }, paymentMethod: "cash", promoCode: "WELCOME20", promoDiscount: 324 },
  { id: "BK-003", customerId: "c3",  customerName: "Malee Sompong",    customerPhone: "+66 76 111 2233", customerEmail: "malee@hotmail.com", service: "AC Cleaning",  serviceSlug: "ac",         serviceIcon: "❄️", date: "04/05/2026", startTime: "10:00", hours: 2, address: "55 Thalang Road, Phuket Town",            area: "phuket",    total: 935,   bookingType: "daily",        status: "pending",   createdAt: "2026-04-25", paymentMethod: "transfer" },
  { id: "BK-004", customerId: "c8",  customerName: "David Park",       customerPhone: "+66 82 456 7890", service: "Pet Care",     serviceSlug: "petcare",    serviceIcon: "🐾", date: "03/05/2026", startTime: "14:00", hours: 3, address: "Jomtien Complex, Pattaya",                area: "pattaya",   total: 690,   bookingType: "daily",        status: "pending",   createdAt: "2026-04-25", serviceExtras: { petType: "dog", petCount: 2, petNotes: "2 golden retrievers, very friendly. Please bring extra treats." }, paymentMethod: "cash" },
  { id: "BK-005", customerId: "c9",  customerName: "Priya Sharma",     customerPhone: "+66 83 567 8901", customerEmail: "priya.sharma@example.com", service: "Elderly Care", serviceSlug: "elderly",    serviceIcon: "🧓", date: "05/05/2026", startTime: "07:00", hours: 8, address: "Nimman Rd, Chiang Mai",                   area: "chiangmai", total: 3192,  bookingType: "subscription", status: "pending",   createdAt: "2026-04-24", serviceExtras: { age: "78", gender: "female", careTypes: ["basic", "mobility"], healthNotes: "Mild dementia, uses a walker. Takes medication at 8am and 6pm.", locationType: "home", notes: "Please speak slowly and clearly. She responds well to music." }, paymentMethod: "card", pointsUsed: 200, pointsDiscount: 100 },

  // ── Confirmed (確認済み) — ワーカー割当て済み ──
  { id: "BK-006", customerId: "c1",  customerName: "Kotaro Ise",       customerPhone: "+66 81 234 5678", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "30/04/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily",        status: "confirmed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk",    createdAt: "2026-04-20", pointsEarned: 100 },
  { id: "BK-007", customerId: "c4",  customerName: "James Wilson",     customerPhone: "+66 91 222 3344", service: "Driver",       serviceSlug: "driver",     serviceIcon: "🚗", date: "30/04/2026", startTime: "08:00", hours: 5, address: "Jomtien Beach Hotel, Pattaya",            area: "pattaya",   total: 1925,  bookingType: "daily",        status: "confirmed", assignedWorkerName: "Prasit T.",   assignedWorkerId: "w002", workerLineId: "prasitt_ac",    createdAt: "2026-04-21", pointsEarned: 192 },
  { id: "BK-008", customerId: "c5",  customerName: "Emma Johnson",     customerPhone: "+66 94 678 9012", service: "Nanny",        serviceSlug: "nanny",      serviceIcon: "👶", date: "01/05/2026", startTime: "14:00", hours: 4, address: "Central Phuket, Phuket",                 area: "phuket",    total: 1188,  bookingType: "subscription", status: "confirmed", assignedWorkerName: "Malee S.",    assignedWorkerId: "w003", workerLineId: "malees_nanny",  createdAt: "2026-04-22", pointsEarned: 178, serviceExtras: { children: [{ age: "2" }], gender: "boy", locationType: "hotel", notes: "" } },
  { id: "BK-009", customerId: "c6",  customerName: "Tanaka Hiroshi",   customerPhone: "+66 85 789 0123", service: "Office Maid",  serviceSlug: "officemaid", serviceIcon: "🏢", date: "01/05/2026", startTime: "09:00", hours: 5, address: "Asoke Tower, Sukhumvit, Bangkok",         area: "bangkok",   total: 1250,  bookingType: "daily",        status: "confirmed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk",    createdAt: "2026-04-23" },
  { id: "BK-010", customerId: "c7",  customerName: "Siriwan P.",       customerPhone: "+66 86 890 1234", service: "Elderly Care", serviceSlug: "elderly",    serviceIcon: "🧓", date: "02/05/2026", startTime: "07:00", hours: 8, address: "Nimmanhaemin Rd, Chiang Mai",             area: "chiangmai", total: 3192,  bookingType: "subscription", status: "confirmed", assignedWorkerName: "Wanida P.",   assignedWorkerId: "w005", workerLineId: "wanidap_care",  createdAt: "2026-04-24", pointsEarned: 319, serviceExtras: { age: "85", gender: "male", careTypes: ["basic", "companion", "medical"], healthNotes: "Type 2 diabetes. Needs blood sugar check twice daily.", locationType: "nursing", notes: "Family visits on weekends. Keep him calm and comfortable." } },

  // ── Completed (完了) — レビューあり・なし ──
  { id: "BK-011", customerId: "c1",  customerName: "Kotaro Ise",       customerPhone: "+66 81 234 5678", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "24/04/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily",        status: "completed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk",    review: { rating: 3, createdAt: "2026-04-24", comment: "Excellent work, very thorough!" }, createdAt: "2026-04-15", pointsEarned: 100 },
  { id: "BK-012", customerId: "c4",  customerName: "James Wilson",     customerPhone: "+66 91 222 3344", service: "Nanny",        serviceSlug: "nanny",      serviceIcon: "👶", date: "23/04/2026", startTime: "09:00", hours: 3, address: "Jomtien Beach, Pattaya",                 area: "pattaya",   total: 756,   bookingType: "daily",        status: "completed", assignedWorkerName: "Malee S.",    assignedWorkerId: "w003", workerLineId: "malees_nanny",  review: { rating: 1, createdAt: "2026-04-23", comment: "Arrived 40 minutes late with no notice." }, createdAt: "2026-04-13", pointsEarned: 75 },
  { id: "BK-013", customerId: "c3",  customerName: "Malee Sompong",    customerPhone: "+66 76 111 2233", service: "Pet Care",     serviceSlug: "petcare",    serviceIcon: "🐾", date: "22/04/2026", startTime: "11:00", hours: 3, address: "Rawai Beach, Phuket",                     area: "phuket",    total: 759,   bookingType: "daily",        status: "completed", assignedWorkerName: "Somsak P.",   assignedWorkerId: "w004",                               review: { rating: 2, createdAt: "2026-04-22", comment: "Good service overall." }, createdAt: "2026-04-10", pointsEarned: 76, serviceExtras: { petType: "cat", petCount: 1, petNotes: "Older cat, gentle handling required." } },
  { id: "BK-014", customerId: "c2",  customerName: "Sarah Chen",       customerPhone: "+66 92 345 6789", service: "Driver",       serviceSlug: "driver",     serviceIcon: "🚗", date: "21/04/2026", startTime: "08:00", hours: 6, address: "Silom Rd, Bangkok",                       area: "bangkok",   total: 2100,  bookingType: "daily",        status: "completed", assignedWorkerName: "Prasit T.",   assignedWorkerId: "w002", workerLineId: "prasitt_ac",    review: { rating: 3, createdAt: "2026-04-21", comment: "Very professional and safe driver!" }, createdAt: "2026-04-12", pointsEarned: 210 },
  { id: "BK-015", customerId: "c5",  customerName: "Emma Johnson",     customerPhone: "+66 94 678 9012", service: "Office Maid",  serviceSlug: "officemaid", serviceIcon: "🏢", date: "20/04/2026", startTime: "09:00", hours: 4, address: "Central Phuket, Phuket",                 area: "phuket",    total: 1100,  bookingType: "subscription", status: "completed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk",    review: { rating: 3, createdAt: "2026-04-20" }, createdAt: "2026-04-11", pointsEarned: 165 },
  { id: "BK-016", customerId: "c9",  customerName: "Priya Sharma",     customerPhone: "+66 83 567 8901", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "19/04/2026", startTime: "10:00", hours: 3, address: "Nimman Rd, Chiang Mai",                   area: "chiangmai", total: 598,   bookingType: "daily",        status: "completed", assignedWorkerName: "Wanida P.",   assignedWorkerId: "w005", workerLineId: "wanidap_care",  createdAt: "2026-04-10", pointsEarned: 60 },
  { id: "BK-017", customerId: "c6",  customerName: "Tanaka Hiroshi",   customerPhone: "+66 85 789 0123", service: "Elderly Care", serviceSlug: "elderly",    serviceIcon: "🧓", date: "18/04/2026", startTime: "07:00", hours: 8, address: "Sukhumvit Soi 33, Bangkok",               area: "bangkok",   total: 3360,  bookingType: "subscription", status: "completed", assignedWorkerName: "Malee S.",    assignedWorkerId: "w003", workerLineId: "malees_nanny",  review: { rating: 3, createdAt: "2026-04-18", comment: "Very caring and patient with elderly." }, createdAt: "2026-04-09", pointsEarned: 336 },
  { id: "BK-018", customerId: "c8",  customerName: "David Park",       customerPhone: "+66 82 456 7890", service: "AC Cleaning",  serviceSlug: "ac",         serviceIcon: "❄️", date: "17/04/2026", startTime: "13:00", hours: 2, address: "Pattaya Beach Rd, Pattaya",               area: "pattaya",   total: 900,   bookingType: "daily",        status: "completed", assignedWorkerName: "Somsak P.",   assignedWorkerId: "w004",                               review: { rating: 2, createdAt: "2026-04-17" }, createdAt: "2026-04-08", pointsEarned: 90 },

  // ── Cancelled (キャンセル) ──
  { id: "BK-019", customerId: "c7",  customerName: "Siriwan P.",       customerPhone: "+66 86 890 1234", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "28/04/2026", startTime: "10:00", hours: 3, address: "Maya Mall, Chiang Mai",                   area: "chiangmai", total: 598,   bookingType: "daily",        status: "cancelled",  createdAt: "2026-04-20", notes: "Customer cancelled — schedule conflict" },
  { id: "BK-020", customerId: "c2",  customerName: "Sarah Chen",       customerPhone: "+66 92 345 6789", service: "Pet Care",     serviceSlug: "petcare",    serviceIcon: "🐾", date: "27/04/2026", startTime: "11:00", hours: 2, address: "Ploenchit Center, Bangkok",               area: "bangkok",   total: 500,   bookingType: "daily",        status: "cancelled",  createdAt: "2026-04-19" },

  // ── Subscription bookings ──
  { id: "BK-021", customerId: "c10", customerName: "Robert Kim",       customerPhone: "+66 87 901 2345", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "05/05/2026", startTime: "09:00", hours: 4, address: "Icon Siam, Bangkok",                      area: "bangkok",   total: 950,   bookingType: "subscription", status: "confirmed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk",    createdAt: "2026-04-26", pointsEarned: 142, subscriptionSchedule: { frequency: 2, slots: [{ dayOfWeek: 1, hour: 9, minute: 0, hours: 4 }, { dayOfWeek: 4, hour: 9, minute: 0, hours: 4 }] } },
  { id: "BK-022", customerId: "c10", customerName: "Robert Kim",       customerPhone: "+66 87 901 2345", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "12/05/2026", startTime: "09:00", hours: 4, address: "Icon Siam, Bangkok",                      area: "bangkok",   total: 950,   bookingType: "subscription", status: "pending",   createdAt: "2026-04-26" },
  { id: "BK-023", customerId: "c10", customerName: "Robert Kim",       customerPhone: "+66 87 901 2345", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "19/05/2026", startTime: "09:00", hours: 4, address: "Icon Siam, Bangkok",                      area: "bangkok",   total: 950,   bookingType: "subscription", status: "pending",   createdAt: "2026-04-26" },
  { id: "BK-024", customerId: "c10", customerName: "Robert Kim",       customerPhone: "+66 87 901 2345", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "26/05/2026", startTime: "09:00", hours: 4, address: "Icon Siam, Bangkok",                      area: "bangkok",   total: 950,   bookingType: "subscription", status: "pending",   createdAt: "2026-04-26" },

  // ── Multi-date Daily (複数日まとめてリクエスト — GROUP-001) ──
  { id: "BK-025", customerId: "c1",  customerName: "Kotaro Ise",       customerPhone: "+66 81 234 5678", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "07/05/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily", status: "pending",   createdAt: "2026-04-26", notes: "Please bring eco-friendly products", parentBookingId: "GROUP-001", multiDateTotal: 3000, requestedWorkerName: "Napasorn K.", requestedWorkerId: "w001" },
  { id: "BK-026", customerId: "c1",  customerName: "Kotaro Ise",       customerPhone: "+66 81 234 5678", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "09/05/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily", status: "pending",   createdAt: "2026-04-26", notes: "Please bring eco-friendly products", parentBookingId: "GROUP-001", multiDateTotal: 3000, requestedWorkerName: "Napasorn K.", requestedWorkerId: "w001" },
  { id: "BK-027", customerId: "c1",  customerName: "Kotaro Ise",       customerPhone: "+66 81 234 5678", service: "Maid",         serviceSlug: "maid",       serviceIcon: "🧹", date: "12/05/2026", startTime: "09:00", hours: 4, address: "Noble BE19, Sukhumvit 19, Bangkok",       area: "bangkok",   total: 1000,  bookingType: "daily", status: "pending",   createdAt: "2026-04-26", notes: "Please bring eco-friendly products", parentBookingId: "GROUP-001", multiDateTotal: 3000, requestedWorkerName: "Napasorn K.", requestedWorkerId: "w001" },

  // ── Multi-date Daily (GROUP-002) ──
  { id: "BK-028", customerId: "c6",  customerName: "Tanaka Hiroshi",   customerPhone: "+66 85 789 0123", service: "Office Maid",  serviceSlug: "officemaid", serviceIcon: "🏢", date: "06/05/2026", startTime: "08:00", hours: 5, address: "Asoke Tower, Sukhumvit, Bangkok",         area: "bangkok",   total: 1250,  bookingType: "daily", status: "confirmed", assignedWorkerName: "Napasorn K.", assignedWorkerId: "w001", workerLineId: "napasornk", createdAt: "2026-04-25", parentBookingId: "GROUP-002", multiDateTotal: 2500 },
  { id: "BK-029", customerId: "c6",  customerName: "Tanaka Hiroshi",   customerPhone: "+66 85 789 0123", service: "Office Maid",  serviceSlug: "officemaid", serviceIcon: "🏢", date: "13/05/2026", startTime: "08:00", hours: 5, address: "Asoke Tower, Sukhumvit, Bangkok",         area: "bangkok",   total: 1250,  bookingType: "daily", status: "pending",   createdAt: "2026-04-25", parentBookingId: "GROUP-002", multiDateTotal: 2500 },
];

const SEED_WORKERS: WorkerProfile[] = [
  { id: "w001", full_name: "Napasorn K.",  phone: "+66 85 111 2233", line_id: "napasornk",     services: ["maid", "officemaid"],  status: "available", rating: 4.8, completedJobs: 47, joinedDate: "2024-01-15", area: "bangkok",  photoUrl: "https://i.pravatar.cc/150?img=47" },
  { id: "w002", full_name: "Prasit T.",    phone: "+66 89 333 4455", line_id: "prasitt_ac",    services: ["ac", "driver"],        status: "available", rating: 4.9, completedJobs: 83, joinedDate: "2023-11-10", area: "bangkok",  photoUrl: "https://i.pravatar.cc/150?img=12" },
  { id: "w003", full_name: "Malee S.",     phone: "+66 81 555 6677", line_id: "malees_nanny",  services: ["nanny", "elderly"],    status: "busy",      rating: 4.7, completedJobs: 62, joinedDate: "2024-03-20", area: "pattaya",  photoUrl: "https://i.pravatar.cc/150?img=25" },
  { id: "w004", full_name: "Somsak P.",    phone: "+66 82 777 8899", line_id: "somsakp",       services: ["petcare", "maid"],     status: "available", rating: 4.5, completedJobs: 28, joinedDate: "2024-06-01", area: "phuket",   photoUrl: "https://i.pravatar.cc/150?img=65" },
  { id: "w005", full_name: "Wanida P.",    phone: "+66 83 999 0011", line_id: "wanidap_care",  services: ["elderly", "nanny"],    status: "available", rating: 4.6, completedJobs: 35, joinedDate: "2024-04-10", area: "pattaya",  photoUrl: "https://i.pravatar.cc/150?img=32" },
];

const SEED_FEEDBACK: AppFeedback[] = [
  { id: "fb001", userId: "c1", userName: "Kotaro Ise",    userPhone: "+66 81 234 5678", category: "general",   subject: "Great experience overall",         message: "The app is really easy to use and the workers are always professional. I especially love the real-time tracking feature!", rating: 5, appVersion: "2.1.0", os: "ios",     status: "reviewed", adminNote: "Thank you for your kind words!", createdAt: "2026-04-24" },
  { id: "fb002", userId: "c2", userName: "Thai User",     userPhone: "+66 89 876 5432", category: "bug",       subject: "Payment page freezes on checkout",  message: "ขณะชำระเงินหน้าแอปค้างบ่อยมาก ต้องกดย้อนกลับแล้วลองใหม่หลายครั้ง iPhone 14 iOS 17.4", rating: 2, appVersion: "2.1.0", os: "ios",     status: "new",      createdAt: "2026-04-25" },
  { id: "fb003", userId: "c3", userName: "Malee Sompong", userPhone: "+66 76 111 2233", category: "feature",   subject: "Add ability to reschedule booking",  message: "I often need to change the booking time by just 30 minutes. Currently I have to cancel and rebook which is annoying. Please add reschedule option!", rating: 4, appVersion: "2.0.8", os: "android", status: "new",      createdAt: "2026-04-23" },
  { id: "fb004", userId: "c4", userName: "Somchai R.",    userPhone: "+66 84 555 6677", category: "complaint", subject: "Worker arrived 45 minutes late",     message: "นายช่างมาสาย 45 นาทีโดยไม่แจ้งล่วงหน้า ทำให้เสียเวลามาก ควรมีระบบแจ้งเตือนเมื่อนายช่างออกเดินทางแล้ว", rating: 1, appVersion: "2.1.0", os: "android", status: "resolved", adminNote: "ติดต่อลูกค้าแล้ว และส่งส่วนลด 15% สำหรับการจองครั้งถัดไป", createdAt: "2026-04-22" },
  { id: "fb005", userId: "c5", userName: "James Wilson",  userPhone: "+66 91 222 3344", category: "feature",   subject: "Dark mode support please",          message: "The app is great but can you add dark mode? My eyes get tired when using it at night. Most modern apps have this feature now.", rating: 4, appVersion: "2.0.8", os: "ios",     status: "new",      createdAt: "2026-04-21" },
  { id: "fb006", userId: "c6", userName: "Siriwan P.",    userPhone: "+66 82 333 4455", category: "bug",       subject: "Push notifications not working",    message: "ไม่ได้รับ push notification เลยทั้งที่เปิดการแจ้งเตือนแล้ว Samsung Galaxy S24 Android 14", rating: 2, appVersion: "2.1.0", os: "android", status: "reviewed", adminNote: "ทีมงานกำลังตรวจสอบปัญหาอยู่", createdAt: "2026-04-20" },
  { id: "fb007", userId: "c7", userName: "David Chen",                                  category: "general",   subject: "Best home service app in Thailand", message: "I've used many home service apps but Ayasan is by far the best. The workers are vetted, professional and the booking process is seamless. 5 stars!", rating: 5, appVersion: "2.1.0", os: "ios",     status: "reviewed", createdAt: "2026-04-19" },
  { id: "fb008", userId: "c8", userName: "Nattaya K.",    userPhone: "+66 85 666 7788", category: "feature",   subject: "Add LINE payment option",           message: "อยากให้เพิ่มการชำระเงินผ่าน LINE Pay ด้วยค่ะ ใช้งานสะดวกมากกว่า ลูกค้าส่วนใหญ่ก็ใช้ LINE อยู่แล้ว", rating: 4, appVersion: "2.0.8", os: "android", status: "new",      createdAt: "2026-04-18" },
  { id: "fb009", userId: "c9", userName: "Robert Kim",                                  category: "complaint", subject: "Incorrect price charged",           message: "I was quoted ฿840 but charged ฿1,050. No explanation for the difference. Please fix this and refund the difference.", rating: 1, appVersion: "2.1.0", os: "ios",     status: "resolved", adminNote: "Refund processed. Pricing bug fixed in v2.1.1", createdAt: "2026-04-17" },
  { id: "fb010", userId: "c2", userName: "Thai User",     userPhone: "+66 89 876 5432", category: "general",   subject: "Points system is confusing",        message: "ระบบคะแนนยังไม่ค่อยเข้าใจว่าใช้ยังไง อยากให้มีหน้าอธิบายให้ชัดเจนกว่านี้ว่าสะสมคะแนนได้ยังไงและนำไปใช้ได้ที่ไหนบ้าง", rating: 3, appVersion: "2.1.0", os: "android", status: "new",      createdAt: "2026-04-16" },
];

const SEED_APP_USERS: AppUser[] = [
  { id: "u001", name: "Kotaro Ise",      phone: "+66 81 234 5678", email: "kotaro@example.com",  area: "Bangkok",    bookingType: "both",         totalBookings: 8,  lastBooking: "2026-04-24", status: "active" },
  { id: "u002", name: "Sarah Chen",      phone: "+66 92 345 6789", email: "sarah@example.com",   area: "Bangkok",    bookingType: "daily",        totalBookings: 5,  lastBooking: "2026-04-21", status: "active" },
  { id: "u003", name: "Malee Sompong",   phone: "+66 76 111 2233", email: "malee@example.com",   area: "Phuket",     bookingType: "daily",        totalBookings: 4,  lastBooking: "2026-04-22", status: "active" },
  { id: "u004", name: "David Park",      phone: "+66 82 456 7890", email: "david@example.com",   area: "Pattaya",    bookingType: "daily",        totalBookings: 3,  lastBooking: "2026-04-25", status: "active" },
  { id: "u005", name: "Priya Sharma",    phone: "+66 83 567 8901", email: "priya@example.com",   area: "Chiang Mai", bookingType: "subscription", totalBookings: 6,  lastBooking: "2026-04-24", status: "active" },
  { id: "u006", name: "James Wilson",    phone: "+66 91 222 3344", email: "james@example.com",   area: "Pattaya",    bookingType: "both",         totalBookings: 7,  lastBooking: "2026-04-23", status: "active" },
  { id: "u007", name: "Emma Johnson",    phone: "+66 94 678 9012", email: "emma@example.com",    area: "Phuket",     bookingType: "subscription", totalBookings: 9,  lastBooking: "2026-04-20", status: "active" },
  { id: "u008", name: "Tanaka Hiroshi",  phone: "+66 85 789 0123", email: "tanaka@example.com",  area: "Bangkok",    bookingType: "subscription", totalBookings: 11, lastBooking: "2026-04-18", status: "active" },
  { id: "u009", name: "Siriwan P.",      phone: "+66 86 890 1234", email: "siriwan@example.com", area: "Chiang Mai", bookingType: "both",         totalBookings: 5,  lastBooking: "2026-04-28", status: "active" },
  { id: "u010", name: "Robert Kim",      phone: "+66 87 901 2345", email: "robert@example.com",  area: "Bangkok",    bookingType: "subscription", totalBookings: 12, lastBooking: "2026-04-26", status: "active" },
  { id: "u011", name: "Nattaya K.",      phone: "+66 85 666 7788", email: "nattaya@example.com", area: "Bangkok",    bookingType: "daily",        totalBookings: 2,  lastBooking: "2026-04-18", status: "active" },
  { id: "u012", name: "Somchai R.",      phone: "+66 84 555 6677", email: "somchai@example.com", area: "Chiang Mai", bookingType: "daily",        totalBookings: 1,  lastBooking: "2026-04-19", status: "inactive" },
  { id: "u013", name: "Linda Nguyen",    phone: "+66 93 444 5566", email: "linda@example.com",   area: "Phuket",     bookingType: "subscription", totalBookings: 15, lastBooking: "2026-04-26", status: "active" },
  { id: "u014", name: "Chanida T.",      phone: "+66 84 333 4455", email: "chanida@example.com", area: "Bangkok",    bookingType: "daily",        totalBookings: 3,  lastBooking: "2026-03-15", status: "inactive" },
  { id: "u015", name: "Michael Chen",    phone: "+66 91 222 1100", email: "michael@example.com", area: "Pattaya",    bookingType: "both",         totalBookings: 6,  lastBooking: "2026-04-22", status: "active" },
];

const SEED_CAMPAIGNS: Campaign[] = [
  { id: "cp1", campaignType: "promo",        title: "Songkran Special 🎉",      body: "Book any service in April and get 15% off! Use the code below at checkout.", targetSegment: "all",          status: "sent",  sentAt: "2026-04-10", sentCount: 1243, createdAt: "2026-04-09", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", discountCode: "SONGKRAN15", discountPctCampaign: 15 },
  { id: "cp2", campaignType: "points",       title: "Subscriber Exclusive 🌟",  body: "As a valued subscriber, enjoy bonus points this weekend! Tap Redeem to add them instantly.", targetSegment: "subscription", status: "sent",  sentAt: "2026-04-20", sentCount: 312,  createdAt: "2026-04-19", pointsGift: 200 },
  { id: "cp3", campaignType: "promo",        title: "May Sale 🛒",              body: "May is here! Get 10% off AC Cleaning service all month.",           targetSegment: "all",          status: "sent",                                    createdAt: "2026-04-24", imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800", discountCode: "MAYSALE10", discountPctCampaign: 10 },
  { id: "cp4", campaignType: "notification", title: "VIP Appreciation 👑",      body: "Thank you for your continued support! Here's an exclusive 20% discount for our VIP members.", targetSegment: "vip",  status: "draft", createdAt: "2026-04-25" },
  { id: "cp5", campaignType: "points",       title: "We Miss You! 💌",          body: "It's been a while! Come back and book again — here's a gift from us.", targetSegment: "inactive",   status: "draft",                                   createdAt: "2026-04-26", pointsGift: 100 },
];

const SEED_SLIDERS: HomeSlide[] = [
  { id: "sl_redeem", title_en: "Redeem Your Points", title_th: "แลกรับของรางวัล", subtitle_en: "Use points for e-vouchers & gifts", subtitle_th: "ใช้คะแนนแลกรับบัตรกำนัลและของรางวัล", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800", linkTarget: "redeem", buttonText_en: "Redeem Points", buttonText_th: "แลกคะแนน", active: true, order: 1 },
];

const SEED_PROMOTIONS: Promotion[] = [
  { id: "pr1", title_en: "Songkran Special",   title_th: "โปรโมชั่นสงกรานต์",   description_en: "Book any home service in April and get 15% off. Perfect for spring cleaning!", description_th: "จองบริการใดก็ได้ในเดือนเมษายน รับส่วนลด 15%", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", discountPct: 15, discountCode: "SONGKRAN15", validFrom: "2026-04-01", validUntil: "2026-04-30", active: false, createdAt: "2026-03-25" },
  { id: "pr2", title_en: "New User Bonus",      title_th: "โบนัสผู้ใช้ใหม่",     description_en: "First-time users get 200 bonus points and free first booking consultation.", description_th: "ผู้ใช้ใหม่รับ 200 คะแนนพิเศษ", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800", discountFlat: 0, validFrom: "2026-01-01", validUntil: "2026-12-31", active: true, createdAt: "2026-01-01" },
];

// ─────────────────────────────────────────────
//  Generic helpers
// ─────────────────────────────────────────────
function load<T>(key: string, seed: T): T {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s) as T; } catch {}
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}
function save(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─────────────────────────────────────────────
//  CRUD exports
// ─────────────────────────────────────────────

// Bookings
export const loadBookings  = () => load<FullBookingRecord[]>(KEYS.bookings, SEED_BOOKINGS);
export const saveBookings  = (b: FullBookingRecord[]) => save(KEYS.bookings, b);
export const updateBooking = (id: string, u: Partial<FullBookingRecord>) => saveBookings(loadBookings().map(b => b.id === id ? { ...b, ...u } : b));
export const deleteBooking = (id: string) => saveBookings(loadBookings().filter(b => b.id !== id));
export const addBooking    = (b: FullBookingRecord) => saveBookings([b, ...loadBookings()]);

// Workers
export const loadWorkers  = () => load<WorkerProfile[]>(KEYS.workers, SEED_WORKERS);
export const saveWorkers  = (w: WorkerProfile[]) => save(KEYS.workers, w);
export const updateWorker = (id: string, u: Partial<WorkerProfile>) => saveWorkers(loadWorkers().map(w => w.id === id ? { ...w, ...u } : w));
export const deleteWorker = (id: string) => saveWorkers(loadWorkers().filter(w => w.id !== id));
export const addWorker    = (w: WorkerProfile) => saveWorkers([...loadWorkers(), w]);

// Service pricing
export const loadServicePricing = () => load<ServicePriceConfig[]>(KEYS.servicePricing, SEED_SERVICE_PRICING);
export const saveServicePricing = (p: ServicePriceConfig[]) => save(KEYS.servicePricing, p);

// AC pricing
export const loadAcPricing = () => load<AcTypePrice[]>(KEYS.acPricing, SEED_AC_PRICING);
export const saveAcPricing = (p: AcTypePrice[]) => save(KEYS.acPricing, p);

// Deep Clean pricing
export const loadDeepCleanPricing = () => load<DeepCleanPackage[]>(KEYS.deepCleanPricing, SEED_DEEP_CLEAN_PACKAGES);
export const saveDeepCleanPricing = (p: DeepCleanPackage[]) => save(KEYS.deepCleanPricing, p);

// Addon pricing
export const loadAddonPricing  = () => load<AddonPriceConfig[]>(KEYS.addonPricing, SEED_ADDON_PRICING).map(a => ({ desc_th: "", active: true, ...a }));
export const saveAddonPricing  = (p: AddonPriceConfig[]) => save(KEYS.addonPricing, p);
export const addAddon          = (a: AddonPriceConfig) => saveAddonPricing([...loadAddonPricing(), a]);
export const updateAddon       = (id: string, u: Partial<AddonPriceConfig>) => saveAddonPricing(loadAddonPricing().map(a => a.id === id ? { ...a, ...u } : a));
export const deleteAddon       = (id: string) => saveAddonPricing(loadAddonPricing().filter(a => a.id !== id));

// Subscription tiers
export const loadSubscriptionTiers = () => load<SubscriptionTier[]>(KEYS.subscriptions, SEED_SUBSCRIPTION_TIERS);
export const saveSubscriptionTiers = (t: SubscriptionTier[]) => save(KEYS.subscriptions, t);

// Points
export const loadPointsConfig = () => load<PointsConfig>(KEYS.points, SEED_POINTS);
export const savePointsConfig = (p: PointsConfig) => save(KEYS.points, p);

// App Users (read-only seed — in a real app this would come from auth DB)
export const loadAppUsers = () => SEED_APP_USERS;

// Campaigns
export const loadCampaigns  = () => load<Campaign[]>(KEYS.campaigns, SEED_CAMPAIGNS);
export const saveCampaigns  = (c: Campaign[]) => save(KEYS.campaigns, c);
export const addCampaign    = (c: Campaign) => saveCampaigns([c, ...loadCampaigns()]);
export const updateCampaign = (id: string, u: Partial<Campaign>) => saveCampaigns(loadCampaigns().map(c => c.id === id ? { ...c, ...u } : c));
export const deleteCampaign = (id: string) => saveCampaigns(loadCampaigns().filter(c => c.id !== id));

// Home sliders
export const loadSliders  = () => load<HomeSlide[]>(KEYS.sliders, SEED_SLIDERS);
export const saveSliders  = (s: HomeSlide[]) => save(KEYS.sliders, s);
export const addSlide     = (s: HomeSlide) => saveSliders([...loadSliders(), s]);
export const updateSlide  = (id: string, u: Partial<HomeSlide>) => saveSliders(loadSliders().map(s => s.id === id ? { ...s, ...u } : s));
export const deleteSlide  = (id: string) => saveSliders(loadSliders().filter(s => s.id !== id));

// Promotions
export const loadPromotions  = () => load<Promotion[]>(KEYS.promotions, SEED_PROMOTIONS);
export const savePromotions  = (p: Promotion[]) => save(KEYS.promotions, p);
export const addPromotion    = (p: Promotion) => savePromotions([p, ...loadPromotions()]);
export const updatePromotion = (id: string, u: Partial<Promotion>) => savePromotions(loadPromotions().map(p => p.id === id ? { ...p, ...u } : p));
export const deletePromotion = (id: string) => savePromotions(loadPromotions().filter(p => p.id !== id));

// App Feedback
export const loadFeedback  = () => load<AppFeedback[]>(KEYS.feedback, SEED_FEEDBACK);
export const saveFeedback  = (f: AppFeedback[]) => save(KEYS.feedback, f);
export const updateFeedback = (id: string, u: Partial<AppFeedback>) => saveFeedback(loadFeedback().map(f => f.id === id ? { ...f, ...u } : f));
export const deleteFeedback = (id: string) => saveFeedback(loadFeedback().filter(f => f.id !== id));

// ── Gift Catalog ──────────────────────────────
export type GiftCategory = "voucher" | "product" | "experience" | "session" | "other";
export type GiftType     = "evoucher" | "physical" | "discount_code" | "experience";
export type CodeDelivery = "reveal_in_app" | "email_only" | "both";

export interface GiftItem {
  id: string;
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  imageUrl: string;
  pointsRequired: number;
  category: GiftCategory;
  stock: number | null;
  active: boolean;
  redeemedCount: number;
  createdAt: string;
  gift_type: GiftType;
  partner_name?: string;
  partner_logo_url?: string;
  code_delivery: CodeDelivery;
  terms_url?: string;
  valid_until?: string;
  rewardDetails_en?: string;
  rewardDetails_th?: string;
  termsAndConditions_en?: string;
  termsAndConditions_th?: string;
}

export interface GiftCode {
  id: string;
  gift_id: string;
  code: string;
  is_used: boolean;
  used_by_user_id?: string;
  used_by_name?: string;
  used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface GiftRedemption {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  gift_id: string;
  gift_name: string;
  gift_code_id: string;
  code: string;
  points_used: number;
  status: "completed" | "cancelled" | "refunded";
  redeemed_at: string;
  cancelled_at?: string;
  admin_note?: string;
}

const SEED_GIFTS: GiftItem[] = [
  {
    id: "g001", name_en: "Starbucks E-Voucher ฿100", name_th: "บัตรกำนัล Starbucks ฿100",
    description_en: "Enjoy any drink or food item worth up to ฿100 at any Starbucks Thailand branch.", description_th: "รับสิทธิ์เครื่องดื่มหรืออาหารมูลค่าสูงสุด ฿100 ที่ Starbucks ทุกสาขาในไทย",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
    pointsRequired: 300, category: "voucher", stock: null, active: true, redeemedCount: 47, createdAt: "2026-01-10",
    gift_type: "evoucher", partner_name: "Starbucks Thailand",
    partner_logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png",
    code_delivery: "both", valid_until: "2026-12-31", terms_url: "https://www.starbucks.co.th/",
    rewardDetails_en: "Present your e-voucher barcode with the cashier during the payment process.",
    rewardDetails_th: "แสดงบาร์โค้ด e-voucher ของคุณกับแคชเชียร์ในขั้นตอนการชำระเงิน",
    termsAndConditions_en: "This e-voucher can be used at all Starbucks Thailand branches and for all menu items.\nPlease present and show the e-voucher to the staff before using it.\nThe e-voucher cannot be exchanged, refunded, or redeemed for cash.\nThis e-voucher cannot be used in conjunction with other promotions, including Starbucks membership discounts.\nEach e-voucher can be used for one receipt only.\nThe company reserves the right to refuse to accept e-vouchers based on showing a photo or capturing a phone screen.",
    termsAndConditions_th: "บัตรกำนัลนี้สามารถใช้ได้ที่ Starbucks ทุกสาขาในไทยสำหรับเมนูทุกรายการ\nกรุณาแสดงบัตรกำนัลให้พนักงานก่อนใช้งาน\nบัตรกำนัลไม่สามารถแลกเปลี่ยน คืนเงิน หรือแลกเป็นเงินสดได้\nบัตรกำนัลไม่สามารถใช้ร่วมกับโปรโมชั่นอื่น รวมถึงส่วนลดสมาชิก\nบัตรกำนัลแต่ละใบใช้ได้สำหรับ 1 ใบเสร็จเท่านั้น",
  },
  {
    id: "g002", name_en: "Free Cleaning Session", name_th: "บริการทำความสะอาดฟรี 1 ครั้ง",
    description_en: "One complimentary daily cleaning session (up to 4 hrs).", description_th: "บริการทำความสะอาดรายครั้งฟรี 1 ครั้ง (สูงสุด 4 ชั่วโมง)",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    pointsRequired: 1500, category: "session", stock: 20, active: true, redeemedCount: 12, createdAt: "2026-01-15",
    gift_type: "experience", partner_name: "Ayasan", code_delivery: "reveal_in_app",
  },
  {
    id: "g003", name_en: "Häagen-Dazs Ice Cream ฿150", name_th: "ไอศกรีม Häagen-Dazs ฿150",
    description_en: "Redeem one scoop or ice cream bar worth up to ฿150 at any Häagen-Dazs Thailand outlet.", description_th: "แลกไอศกรีม 1 สกูปหรือไม้มูลค่าสูงสุด ฿150 ที่ Häagen-Dazs ทุกสาขาในไทย",
    imageUrl: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&q=80",
    pointsRequired: 500, category: "voucher", stock: 87, active: true, redeemedCount: 28, createdAt: "2026-02-01",
    gift_type: "evoucher", partner_name: "Häagen-Dazs Thailand",
    partner_logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Haagen-Dazs_logo.svg/200px-Haagen-Dazs_logo.svg.png",
    code_delivery: "reveal_in_app", valid_until: "2026-09-30",
  },
  {
    id: "g004", name_en: "Spa Day Experience", name_th: "แพ็กเกจสปา 1 วัน",
    description_en: "Full-day spa treatment at partnered wellness centres in Bangkok.", description_th: "แพ็กเกจสปาเต็มวันที่ศูนย์สุขภาพพาร์ทเนอร์ในกรุงเทพ",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
    pointsRequired: 3000, category: "experience", stock: 5, active: true, redeemedCount: 3, createdAt: "2026-02-15",
    gift_type: "experience", partner_name: "Divana Spa", code_delivery: "email_only",
    valid_until: "2026-12-31",
  },
  {
    id: "g005", name_en: "McDonald's Value Set", name_th: "ชุดอาหาร McDonald's",
    description_en: "Exchange for any value set meal at McDonald's Thailand.", description_th: "แลกรับชุดอาหารมูลค่าที่ McDonald's ไทย",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    pointsRequired: 800, category: "voucher", stock: 4, active: true, redeemedCount: 19, createdAt: "2026-03-01",
    gift_type: "evoucher", partner_name: "McDonald's Thailand",
    code_delivery: "both", valid_until: "2026-06-30",
  },
];

const SEED_GIFT_CODES: GiftCode[] = [
  { id: "gc001", gift_id: "g001", code: "STBK-2026-AYXQ", is_used: true,  used_by_user_id: "u1", used_by_name: "Somchai P.", used_at: "2026-04-10T09:23:00Z", created_at: "2026-01-10T00:00:00Z" },
  { id: "gc002", gift_id: "g001", code: "STBK-2026-BRTL", is_used: true,  used_by_user_id: "u2", used_by_name: "Malee S.",   used_at: "2026-04-15T14:07:00Z", created_at: "2026-01-10T00:00:00Z" },
  { id: "gc003", gift_id: "g001", code: "STBK-2026-CZMN", is_used: false, created_at: "2026-01-10T00:00:00Z", expires_at: "2026-12-31T23:59:59Z" },
  { id: "gc004", gift_id: "g001", code: "STBK-2026-DPWK", is_used: false, created_at: "2026-01-10T00:00:00Z", expires_at: "2026-12-31T23:59:59Z" },
  { id: "gc005", gift_id: "g001", code: "STBK-2026-EQVJ", is_used: false, created_at: "2026-01-10T00:00:00Z", expires_at: "2026-12-31T23:59:59Z" },
  { id: "gc006", gift_id: "g003", code: "HGDZ-150-FXKR", is_used: true,  used_by_user_id: "u3", used_by_name: "Pranee K.",  used_at: "2026-04-20T11:30:00Z", created_at: "2026-02-01T00:00:00Z" },
  { id: "gc007", gift_id: "g003", code: "HGDZ-150-GTMW", is_used: false, created_at: "2026-02-01T00:00:00Z", expires_at: "2026-09-30T23:59:59Z" },
  { id: "gc008", gift_id: "g003", code: "HGDZ-150-HVNS", is_used: false, created_at: "2026-02-01T00:00:00Z", expires_at: "2026-09-30T23:59:59Z" },
  { id: "gc009", gift_id: "g005", code: "MCTH-SET-IPQZ", is_used: false, created_at: "2026-03-01T00:00:00Z", expires_at: "2026-06-30T23:59:59Z" },
  { id: "gc010", gift_id: "g005", code: "MCTH-SET-JYLB", is_used: false, created_at: "2026-03-01T00:00:00Z", expires_at: "2026-06-30T23:59:59Z" },
  { id: "gc011", gift_id: "g005", code: "MCTH-SET-KZMC", is_used: false, created_at: "2026-03-01T00:00:00Z", expires_at: "2026-06-30T23:59:59Z" },
  { id: "gc012", gift_id: "g005", code: "MCTH-SET-LAND", is_used: false, created_at: "2026-03-01T00:00:00Z", expires_at: "2026-06-30T23:59:59Z" },
];

const SEED_GIFT_REDEMPTIONS: GiftRedemption[] = [
  { id: "gr001", user_id: "u1", user_name: "Somchai P.", user_email: "somchai@example.com", gift_id: "g001", gift_name: "Starbucks E-Voucher ฿100", gift_code_id: "gc001", code: "STBK-2026-AYXQ", points_used: 300, status: "completed", redeemed_at: "2026-04-10T09:23:00Z" },
  { id: "gr002", user_id: "u2", user_name: "Malee S.",   user_email: "malee@example.com",   gift_id: "g001", gift_name: "Starbucks E-Voucher ฿100", gift_code_id: "gc002", code: "STBK-2026-BRTL", points_used: 300, status: "completed", redeemed_at: "2026-04-15T14:07:00Z" },
  { id: "gr003", user_id: "u3", user_name: "Pranee K.",  user_email: "pranee@example.com",  gift_id: "g003", gift_name: "Häagen-Dazs Ice Cream ฿150", gift_code_id: "gc006", code: "HGDZ-150-FXKR", points_used: 500, status: "completed", redeemed_at: "2026-04-20T11:30:00Z" },
  { id: "gr004", user_id: "u1", user_name: "Somchai P.", user_email: "somchai@example.com", gift_id: "g003", gift_name: "Häagen-Dazs Ice Cream ฿150", gift_code_id: "gc007", code: "HGDZ-150-GTMW", points_used: 500, status: "cancelled", redeemed_at: "2026-04-22T08:00:00Z", cancelled_at: "2026-04-22T10:00:00Z", admin_note: "Customer request" },
];

export const loadGifts          = () => load<GiftItem[]>(KEYS.gifts, SEED_GIFTS);
export const saveGifts          = (g: GiftItem[]) => save(KEYS.gifts, g);
export const addGift            = (g: GiftItem) => saveGifts([g, ...loadGifts()]);
export const updateGift         = (id: string, u: Partial<GiftItem>) => saveGifts(loadGifts().map(g => g.id === id ? { ...g, ...u } : g));
export const deleteGift         = (id: string) => saveGifts(loadGifts().filter(g => g.id !== id));

export const loadGiftCodes      = () => load<GiftCode[]>(KEYS.giftCodes, SEED_GIFT_CODES);
export const saveGiftCodes      = (c: GiftCode[]) => save(KEYS.giftCodes, c);
export const addGiftCodes       = (codes: GiftCode[]) => saveGiftCodes([...loadGiftCodes(), ...codes]);
export const deleteGiftCode     = (id: string) => saveGiftCodes(loadGiftCodes().filter(c => c.id !== id));
export const getCodesForGift    = (gift_id: string) => loadGiftCodes().filter(c => c.gift_id === gift_id);
export const getUnusedCodeCount = (gift_id: string) => loadGiftCodes().filter(c => c.gift_id === gift_id && !c.is_used).length;

export const loadGiftRedemptions = () => load<GiftRedemption[]>(KEYS.giftRedemptions, SEED_GIFT_REDEMPTIONS);
export const saveGiftRedemptions = (r: GiftRedemption[]) => save(KEYS.giftRedemptions, r);
export const addGiftRedemption   = (r: GiftRedemption) => saveGiftRedemptions([r, ...loadGiftRedemptions()]);
export const updateGiftRedemption = (id: string, u: Partial<GiftRedemption>) =>
  saveGiftRedemptions(loadGiftRedemptions().map(r => r.id === id ? { ...r, ...u } : r));
export const getRedemptionsForGift = (gift_id: string) => loadGiftRedemptions().filter(r => r.gift_id === gift_id);

// ── Discount Codes ─────────────────────────────
const SEED_DISCOUNT_CODES: DiscountCode[] = [
  {
    id: "dc001", code: "WELCOME10", discountPct: 10,
    description: "10% off for new members on their first booking",
    validUntil: "2026-12-31", active: true, maxUses: 500, usedCount: 87,
    createdAt: "2026-01-01",
  },
  {
    id: "dc002", code: "SONGKRAN15", discountPct: 15,
    description: "Songkran Festival 15% discount",
    validUntil: "2026-04-30", active: true, maxUses: 200, usedCount: 143,
    createdAt: "2026-04-01",
  },
  {
    id: "dc003", code: "VIP20", discountPct: 20,
    description: "Exclusive 20% off for VIP members",
    validUntil: "2026-06-30", active: true, maxUses: 100, usedCount: 32,
    createdAt: "2026-03-01",
  },
  {
    id: "dc004", code: "NEWYEAR20", discountPct: 20,
    description: "New Year Special 20% off all services",
    validUntil: "2026-12-31", active: true, maxUses: 300, usedCount: 51,
    createdAt: "2026-01-01",
  },
  {
    id: "dc005", code: "NEWMEMBER10", discountPct: 10,
    description: "New Member 10% off first booking",
    validUntil: "2026-12-31", active: true, maxUses: 1000, usedCount: 124,
    createdAt: "2026-01-01",
  },
];

export const loadDiscountCodes  = () => load<DiscountCode[]>(KEYS.discountCodes, SEED_DISCOUNT_CODES);
export const saveDiscountCodes  = (d: DiscountCode[]) => save(KEYS.discountCodes, d);
export const addDiscountCode    = (d: DiscountCode) => saveDiscountCodes([d, ...loadDiscountCodes()]);
export const updateDiscountCode = (id: string, u: Partial<DiscountCode>) => saveDiscountCodes(loadDiscountCodes().map(d => d.id === id ? { ...d, ...u } : d));
export const deleteDiscountCode = (id: string) => saveDiscountCodes(loadDiscountCodes().filter(d => d.id !== id));

// ── Trip Driver Pricing ─────────────────────────
const SEED_DRIVER_PRICING: DriverPriceConfig = {
  basePricePerDay: 1800,
  areaMultiplier: { bangkok: 1.0, phuket: 1.15, pattaya: 1.1, chiangmai: 0.95 },
  carOptions: [
    { id: "none",     label_en: "No Car (Driver Only)", pricePerDay: 0    },
    { id: "standard", label_en: "Standard Car",          pricePerDay: 1400 },
    { id: "mid",      label_en: "Mid-size Car",           pricePerDay: 1800 },
    { id: "large",    label_en: "Large Car",              pricePerDay: 2500 },
    { id: "van",      label_en: "Van / MPV",              pricePerDay: 2500 },
  ],
};
export const loadDriverPricing = () => load<DriverPriceConfig>(KEYS.driverPricing, SEED_DRIVER_PRICING);
export const saveDriverPricing = (d: DriverPriceConfig) => save(KEYS.driverPricing, d);
