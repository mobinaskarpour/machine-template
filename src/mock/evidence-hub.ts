/** Evidence Hub — mock media & documents for برج آریا */

export type ZoneStatus = "done" | "active" | "delayed" | "pending";

export type ImageCategory =
  | "اسکلت"
  | "بتن"
  | "نما"
  | "تأسیسات"
  | "محوطه"
  | "طبقات"
  | "سقف";

export type VideoSource = "Drone" | "Mobile" | "CCTV";

export type DocStatus = "approved" | "review" | "draft" | "rejected";

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const evidenceKpis = {
  images: 186,
  videos: 42,
  documents: 128,
  drawings: 64,
  lastSiteVisit: "دیروز · ۱۴:۲۰",
  visualCoverage: 78,
  lastAiAnalysis: "۳۵ دقیقه پیش",
  issuesFound: 11,
};

export interface SiteZone {
  id: string;
  name: string;
  status: ZoneStatus;
  progress: number;
  x: number;
  y: number;
  w: number;
  h: number;
  summary: string;
  imageIds: string[];
  docIds: string[];
}

export const siteZones: SiteZone[] = [
  {
    id: "z-a",
    name: "بلوک A — اسکلت",
    status: "delayed",
    progress: 61,
    x: 8,
    y: 18,
    w: 28,
    h: 42,
    summary: "عقب از برنامه · کمبود فولاد مسیر بحرانی",
    imageIds: ["img1", "img2", "img3"],
    docIds: ["doc1", "doc4"],
  },
  {
    id: "z-b",
    name: "بلوک B — طبقات",
    status: "active",
    progress: 74,
    x: 40,
    y: 12,
    w: 26,
    h: 36,
    summary: "در حال بتن‌ریزی سقف طبقه ۱۲",
    imageIds: ["img4", "img5"],
    docIds: ["doc2", "doc7"],
  },
  {
    id: "z-c",
    name: "محوطه شمالی",
    status: "done",
    progress: 100,
    x: 70,
    y: 14,
    w: 22,
    h: 28,
    summary: "تکمیل محوطه‌سازی و دسترسی موقت",
    imageIds: ["img6"],
    docIds: ["doc10"],
  },
  {
    id: "z-d",
    name: "تأسیسات مکانیکال",
    status: "active",
    progress: 48,
    x: 40,
    y: 54,
    w: 30,
    h: 28,
    summary: "نصب کانال هوا · طبقه زیرزمین",
    imageIds: ["img7", "img8"],
    docIds: ["doc3", "doc5"],
  },
  {
    id: "z-e",
    name: "نما — ضلع جنوب",
    status: "pending",
    progress: 12,
    x: 8,
    y: 66,
    w: 28,
    h: 24,
    summary: "هنوز شروع نشده · منتظر تأیید Shop Drawing",
    imageIds: ["img9"],
    docIds: ["doc6"],
  },
];

export const zoneStatusLabel: Record<ZoneStatus, string> = {
  done: "تکمیل‌شده",
  active: "در حال اجرا",
  delayed: "عقب از برنامه",
  pending: "شروع‌نشده",
};

export interface EvidenceImage {
  id: string;
  src: string;
  category: ImageCategory;
  date: string;
  location: string;
  progress: number;
  aiAnalysis: string;
  zoneId: string;
}

export const evidenceImages: EvidenceImage[] = [
  {
    id: "img1",
    src: u("photo-1541888946425-d81bb19240f5"),
    category: "اسکلت",
    date: "۱۱ مرداد ۱۴۰۵",
    location: "بلوک A · تراز ۱۰",
    progress: 58,
    aiAnalysis: "اسکلت ستون‌ها تکمیل؛ تیرهای اصلی ناقص · تأخیر تخمینی ۴ روز",
    zoneId: "z-a",
  },
  {
    id: "img2",
    src: u("photo-1504307651254-35680f356dfd"),
    category: "اسکلت",
    date: "۹ مرداد ۱۴۰۵",
    location: "بلوک A · جبهه شرق",
    progress: 52,
    aiAnalysis: "تراکم داربست بالا؛ احتمال تداخل مسیر مصالح",
    zoneId: "z-a",
  },
  {
    id: "img3",
    src: u("photo-1589939705384-5185137a7f0f"),
    category: "بتن",
    date: "۸ مرداد ۱۴۰۵",
    location: "بلوک A · سقف طبقه ۹",
    progress: 61,
    aiAnalysis: "کیفیت سطح بتن قابل قبول · ۲ نقطه ناپیوستگی جزئی",
    zoneId: "z-a",
  },
  {
    id: "img4",
    src: u("photo-1503387762-592deb58ef4e"),
    category: "طبقات",
    date: "۱۰ مرداد ۱۴۰۵",
    location: "بلوک B · طبقه ۱۲",
    progress: 74,
    aiAnalysis: "پیشرفت هم‌تراز برنامه · تجهیزات فعال",
    zoneId: "z-b",
  },
  {
    id: "img5",
    src: u("photo-1581094794329-c8112a89af12"),
    category: "بتن",
    date: "۷ مرداد ۱۴۰۵",
    location: "بلوک B · سقف",
    progress: 70,
    aiAnalysis: "قالب‌بندی منظم · آماده بتن‌ریزی فردا",
    zoneId: "z-b",
  },
  {
    id: "img6",
    src: u("photo-1590496793929-36417d95d294"),
    category: "محوطه",
    date: "۵ مرداد ۱۴۰۵",
    location: "محوطه شمالی",
    progress: 100,
    aiAnalysis: "محوطه تکمیل و پاکسازی‌شده",
    zoneId: "z-c",
  },
  {
    id: "img7",
    src: u("photo-1621905251189-08b45d6a269e"),
    category: "تأسیسات",
    date: "۱۱ مرداد ۱۴۰۵",
    location: "زیرزمین · مکانیکال",
    progress: 48,
    aiAnalysis: "کانال‌کشی ۴۸٪ · فاصله از برنامه ۶ روز",
    zoneId: "z-d",
  },
  {
    id: "img8",
    src: u("photo-1581092918056-0c4c3acd3789"),
    category: "تأسیسات",
    date: "۶ مرداد ۱۴۰۵",
    location: "موتورخانه",
    progress: 40,
    aiAnalysis: "تجهیزات ذخیره شده · نصب آغاز نشده برای دو دستگاه",
    zoneId: "z-d",
  },
  {
    id: "img9",
    src: u("photo-1486406146926-c627a92ad1ab"),
    category: "نما",
    date: "۳ مرداد ۱۴۰۵",
    location: "ضلع جنوب",
    progress: 12,
    aiAnalysis: "آماده‌سازی داربست نما · اجرا شروع نشده",
    zoneId: "z-e",
  },
  {
    id: "img10",
    src: u("photo-1429497419816-9ca5cfb2251e"),
    category: "سقف",
    date: "۴ مرداد ۱۴۰۵",
    location: "بلوک B · بام موقت",
    progress: 66,
    aiAnalysis: "پوشش موقت پایدار · زهکشی نیاز به اصلاح دارد",
    zoneId: "z-b",
  },
  {
    id: "img11",
    src: u("photo-1517581177697-a0923758a5d3", 900),
    category: "اسکلت",
    date: "۲ مرداد ۱۴۰۵",
    location: "بلوک A · نمای کلی",
    progress: 55,
    aiAnalysis: "پوشش تصویری خوب · نقاط کور گوشه جنوب‌شرق",
    zoneId: "z-a",
  },
  {
    id: "img12",
    src: u("photo-1460411794035-42aac080490a"),
    category: "محوطه",
    date: "۱ مرداد ۱۴۰۵",
    location: "ورودی کارگاه",
    progress: 90,
    aiAnalysis: "مسیر دسترسی امن · علائم HSE کامل",
    zoneId: "z-c",
  },
];

export const imageCategories: ImageCategory[] = [
  "اسکلت",
  "بتن",
  "نما",
  "تأسیسات",
  "محوطه",
  "طبقات",
  "سقف",
];

export interface EvidenceVideo {
  id: string;
  title: string;
  thumb: string;
  duration: string;
  location: string;
  date: string;
  source: VideoSource;
  aiAnalysis: string;
  zoneId: string;
}

export const evidenceVideos: EvidenceVideo[] = [
  {
    id: "vid1",
    title: "پرواز پهپاد — نمای کلی آریا",
    thumb: u("photo-1473968512647-3e447244af8f"),
    duration: "۰۴:۳۲",
    location: "کل سایت",
    date: "۱۱ مرداد ۱۴۰۵",
    source: "Drone",
    aiAnalysis: "پوشش ۷۸٪ · بلوک A عقب‌تر از بقیه · جرثقیل ۲ بیکار",
    zoneId: "z-a",
  },
  {
    id: "vid2",
    title: "بازرسی اسکلت تراز ۱۰",
    thumb: u("photo-1541888946425-d81bb19240f5", 700),
    duration: "۰۲:۱۸",
    location: "بلوک A",
    date: "۱۰ مرداد ۱۴۰۵",
    source: "Mobile",
    aiAnalysis: "۳ اتصال نیازمند بازبینی کیفیت · ایمنی لبه ناقص",
    zoneId: "z-a",
  },
  {
    id: "vid3",
    title: "CCTV جبهه بتن‌ریزی",
    thumb: u("photo-1503387762-592deb58ef4e", 700),
    duration: "۱۲:۰۵",
    location: "بلوک B",
    date: "۹ مرداد ۱۴۰۵",
    source: "CCTV",
    aiAnalysis: "ریتم بتن‌ریزی پایدار · توقف ۳۰ دقیقه‌ای پمپ",
    zoneId: "z-b",
  },
  {
    id: "vid4",
    title: "پهپاد — محوطه شمالی",
    thumb: u("photo-1590496793929-36417d95d294", 700),
    duration: "۰۱:۴۷",
    location: "محوطه",
    date: "۸ مرداد ۱۴۰۵",
    source: "Drone",
    aiAnalysis: "محوطه تکمیل · انباشت مصالح خارج از محدوده",
    zoneId: "z-c",
  },
  {
    id: "vid5",
    title: "بازرسی تأسیسات زیرزمین",
    thumb: u("photo-1621905251189-08b45d6a269e", 700),
    duration: "۰۳:۵۱",
    location: "موتورخانه",
    date: "۷ مرداد ۱۴۰۵",
    source: "Mobile",
    aiAnalysis: "کانال‌ها نیمه‌کاره · مسیر تخلیه مسدود",
    zoneId: "z-d",
  },
  {
    id: "vid6",
    title: "CCTV ورودی کارگاه",
    thumb: u("photo-1460411794035-42aac080490a", 700),
    duration: "۰۸:۲۲",
    location: "ورودی",
    date: "۶ مرداد ۱۴۰۵",
    source: "CCTV",
    aiAnalysis: "ترافیک کامیون در اوج · صف ۱۵ دقیقه‌ای",
    zoneId: "z-c",
  },
];

export interface EvidenceDocument {
  id: string;
  fileName: string;
  category: string;
  version: string;
  date: string;
  author: string;
  lastEdit: string;
  status: DocStatus;
  size: string;
  previewHint: string;
}

export const evidenceDocuments: EvidenceDocument[] = [
  {
    id: "doc1",
    fileName: "Structural_Drawing_B2_v4.pdf",
    category: "نقشه‌های سازه",
    version: "۴",
    date: "۱۴۰۵/۰۵/۰۸",
    author: "مهندس کریمی",
    lastEdit: "۲ روز پیش",
    status: "approved",
    size: "۱۲.۴ مگابایت",
    previewHint: "نقشه سازه طبقه ۲ · Rev ۴",
  },
  {
    id: "doc2",
    fileName: "Architectural_Plan_Level12_v3.pdf",
    category: "نقشه‌های معماری",
    version: "۳",
    date: "۱۴۰۵/۰۵/۰۶",
    author: "دفتر معماری سپهر",
    lastEdit: "۴ روز پیش",
    status: "approved",
    size: "۸.۱ مگابایت",
    previewHint: "پلان معماری طبقه ۱۲",
  },
  {
    id: "doc3",
    fileName: "MEP_Shop_Drawing_HVAC_v2.pdf",
    category: "Shop Drawing",
    version: "۲",
    date: "۱۴۰۵/۰۵/۱۰",
    author: "پیمانکار تأسیسات",
    lastEdit: "دیروز",
    status: "review",
    size: "۶.۷ مگابایت",
    previewHint: "جزئیات کانال هوا",
  },
  {
    id: "doc4",
    fileName: "Concrete_Report_Week12.pdf",
    category: "گزارش روزانه",
    version: "۱",
    date: "۱۴۰۵/۰۵/۱۱",
    author: "آزمایشگاه بتن",
    lastEdit: "امروز",
    status: "approved",
    size: "۱.۲ مگابایت",
    previewHint: "نتایج مقاومت هفته ۱۲",
  },
  {
    id: "doc5",
    fileName: "RFI-128.pdf",
    category: "RFI",
    version: "۱",
    date: "۱۴۰۵/۰۵/۰۹",
    author: "پیمانکار سازه",
    lastEdit: "۳ روز پیش",
    status: "review",
    size: "۴۲۰ کیلوبایت",
    previewHint: "سؤال اجرایی اتصال تیر",
  },
  {
    id: "doc6",
    fileName: "Facade_Inspection_Report.pdf",
    category: "گزارش HSE",
    version: "۲",
    date: "۱۴۰۵/۰۵/۰۳",
    author: "واحد ایمنی",
    lastEdit: "یک هفته پیش",
    status: "approved",
    size: "۲.۸ مگابایت",
    previewHint: "بازرسی ایمنی نما",
  },
  {
    id: "doc7",
    fileName: "Daily_Report_2026-08-11.pdf",
    category: "گزارش روزانه",
    version: "۱",
    date: "۱۴۰۵/۰۵/۱۱",
    author: "سرپرست کارگاه",
    lastEdit: "امروز",
    status: "approved",
    size: "۹۸۰ کیلوبایت",
    previewHint: "گزارش روزانه ۱۱ مرداد",
  },
  {
    id: "doc8",
    fileName: "Site_Meeting_Minutes_042.pdf",
    category: "صورتجلسات کارگاهی",
    version: "۱",
    date: "۱۴۰۵/۰۵/۱۰",
    author: "دفتر مدیریت پروژه",
    lastEdit: "دیروز",
    status: "approved",
    size: "۶۱۰ کیلوبایت",
    previewHint: "صورت‌جلسه شماره ۴۲",
  },
  {
    id: "doc9",
    fileName: "Contract_Main_Agreement_v3.pdf",
    category: "قراردادها",
    version: "۳",
    date: "۱۴۰۴/۱۱/۲۰",
    author: "امور حقوقی",
    lastEdit: "۶ ماه پیش",
    status: "approved",
    size: "۴.۵ مگابایت",
    previewHint: "قرارداد اصلی کارفرما",
  },
  {
    id: "doc10",
    fileName: "SOW_Phase2_Statement.pdf",
    category: "صورت وضعیت",
    version: "۲",
    date: "۱۴۰۵/۰۵/۰۱",
    author: "واحد مالی پروژه",
    lastEdit: "۱۰ روز پیش",
    status: "review",
    size: "۱.۹ مگابایت",
    previewHint: "صورت‌وضعیت فاز ۲",
  },
  {
    id: "doc11",
    fileName: "Permit_High_Work_2026.pdf",
    category: "مجوزها",
    version: "۱",
    date: "۱۴۰۵/۰۴/۲۸",
    author: "HSE",
    lastEdit: "۲ هفته پیش",
    status: "approved",
    size: "۳۴۰ کیلوبایت",
    previewHint: "پروانه کار در ارتفاع",
  },
  {
    id: "doc12",
    fileName: "Foundation_Photos_Zone_A.zip",
    category: "نقشه‌های تأسیسات",
    version: "۱",
    date: "۱۴۰۵/۰۳/۱۵",
    author: "تیم نقشه‌برداری",
    lastEdit: "۳ ماه پیش",
    status: "approved",
    size: "۸۴ مگابایت",
    previewHint: "بایگانی فونداسیون Zone A",
  },
  {
    id: "doc13",
    fileName: "MEP_Electrical_SingleLine_v5.pdf",
    category: "نقشه‌های تأسیسات",
    version: "۵",
    date: "۱۴۰۵/۰۵/۰۵",
    author: "مهندس برق",
    lastEdit: "۵ روز پیش",
    status: "approved",
    size: "۳.۲ مگابایت",
    previewHint: "تک‌خطی برق",
  },
  {
    id: "doc14",
    fileName: "Meeting_Minutes_Client_038.pdf",
    category: "صورتجلسات",
    version: "۱",
    date: "۱۴۰۵/۰۵/۰۴",
    author: "روابط کارفرما",
    lastEdit: "یک هفته پیش",
    status: "draft",
    size: "۵۵۰ کیلوبایت",
    previewHint: "جلسه با کارفرما ۳۸",
  },
];

export const docCategories = [
  "همه",
  "قراردادها",
  "نقشه‌های معماری",
  "نقشه‌های سازه",
  "نقشه‌های تأسیسات",
  "Shop Drawing",
  "RFI",
  "صورتجلسات",
  "صورت وضعیت",
  "مجوزها",
  "گزارش روزانه",
  "گزارش HSE",
  "صورتجلسات کارگاهی",
];

export const docStatusLabel: Record<DocStatus, string> = {
  approved: "تأییدشده",
  review: "در بررسی",
  draft: "پیش‌نویس",
  rejected: "ردشده",
};

export interface AiInsightBlock {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "ok" | "warn" | "danger" | "info";
}

export const aiInsights: AiInsightBlock[] = [
  {
    id: "a1",
    title: "پیشرفت واقعی",
    value: "۶۱٪",
    detail: "برآورد از تحلیل تصویر و پهپاد هفته جاری",
    tone: "warn",
  },
  {
    id: "a2",
    title: "پیشرفت برنامه",
    value: "۷۴٪",
    detail: "بر اساس برنامه مصوب تیرماه",
    tone: "info",
  },
  {
    id: "a3",
    title: "اختلاف",
    value: "۱۳٪ · ۱۳ روز",
    detail: "عمدتاً بلوک A و تأمین فولاد",
    tone: "danger",
  },
  {
    id: "a4",
    title: "ریسک‌های شناسایی‌شده",
    value: "۱۱ مورد",
    detail: "۴ ایمنی · ۵ اجرایی · ۲ کیفیت",
    tone: "danger",
  },
  {
    id: "a5",
    title: "کیفیت اجرا",
    value: "۸۲٪",
    detail: "ناپیوستگی جزئی بتن در ۲ نقطه",
    tone: "ok",
  },
  {
    id: "a6",
    title: "فعالیت‌های شناسایی‌شده",
    value: "۷ جبهه",
    detail: "بتن‌ریزی، اسکلت، کانال‌کشی، داربست نما…",
    tone: "info",
  },
];

export interface TimelinePoint {
  id: string;
  label: string;
  date: string;
  progress: number;
  imageIds: string[];
  note: string;
}

export const evidenceTimeline: TimelinePoint[] = [
  {
    id: "t1",
    label: "خرداد",
    date: "خرداد ۱۴۰۵",
    progress: 38,
    imageIds: ["img12", "img11"],
    note: "شروع اسکلت بلوک A · فونداسیون تکمیل",
  },
  {
    id: "t2",
    label: "تیر",
    date: "تیر ۱۴۰۵",
    progress: 51,
    imageIds: ["img2", "img9"],
    note: "رشد اسکلت · آماده‌سازی نما",
  },
  {
    id: "t3",
    label: "مرداد هفته ۱",
    date: "هفته ۱ مرداد",
    progress: 58,
    imageIds: ["img1", "img5"],
    note: "بتن‌ریزی طبقات · فشار تأمین فولاد",
  },
  {
    id: "t4",
    label: "مرداد هفته ۲",
    date: "هفته ۲ مرداد · امروز",
    progress: 61,
    imageIds: ["img4", "img7", "img3"],
    note: "اختلاف با برنامه به ۱۳٪ رسیده",
  },
];

export interface BeforeAfterPair {
  id: string;
  title: string;
  location: string;
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  delta: string;
}

export const beforeAfterPairs: BeforeAfterPair[] = [
  {
    id: "ba1",
    title: "بلوک A — اسکلت",
    location: "تراز ۸ تا ۱۰",
    before: u("photo-1504307651254-35680f356dfd"),
    after: u("photo-1541888946425-d81bb19240f5"),
    beforeLabel: "خرداد ۱۴۰۵",
    afterLabel: "مرداد ۱۴۰۵",
    delta: "+۲۳٪ پیشرفت اسکلت",
  },
  {
    id: "ba2",
    title: "بلوک B — طبقات",
    location: "طبقه ۱۰ تا ۱۲",
    before: u("photo-1581094794329-c8112a89af12"),
    after: u("photo-1503387762-592deb58ef4e"),
    beforeLabel: "تیر ۱۴۰۵",
    afterLabel: "مرداد ۱۴۰۵",
    delta: "+۱۸٪ پیشرفت طبقات",
  },
  {
    id: "ba3",
    title: "محوطه شمالی",
    location: "ورودی و دسترسی",
    before: u("photo-1460411794035-42aac080490a", 700),
    after: u("photo-1590496793929-36417d95d294"),
    beforeLabel: "اردیبهشت ۱۴۰۵",
    afterLabel: "مرداد ۱۴۰۵",
    delta: "تکمیل محوطه‌سازی",
  },
];
