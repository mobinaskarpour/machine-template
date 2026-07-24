import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  Package,
  HardHat,
  FileText,
  Bot,
  CalendarClock,
  FolderKanban,
  Cloud,
  Boxes,
  Landmark,
  Database,
  Briefcase,
  Warehouse,
  Truck,
  Radio,
  Users,
  Clock,
  Mail,
  Share2,
  HardDrive,
  BarChart3,
  Webhook,
  Cpu,
  Layers,
} from "lucide-react";

export type ConnectionStatus = "online" | "warning" | "offline";

export type ConnectionCategoryId =
  | "project"
  | "finance"
  | "procurement"
  | "hr-ops"
  | "docs"
  | "ai-data";

export interface OrgConnection {
  id: string;
  name: string;
  category: ConnectionCategoryId;
  status: ConnectionStatus;
  lastSyncLabel: string;
  /** minutes since last successful sync */
  lastSyncMinutes: number;
  latencyMs: number;
  dataQuality: number;
  recordsSynced: number;
  health: number;
  lastError?: string;
  feeds: string[];
  businessImpact: string;
  recommendedAction: string;
  monogram: string;
  icon: LucideIcon;
}

export interface ConnectionCategory {
  id: ConnectionCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const connectionCategories: ConnectionCategory[] = [
  {
    id: "project",
    title: "مدیریت پروژه",
    subtitle: "زمان‌بندی، پیشرفت و هماهنگی جبهه‌ها",
    icon: Building2,
  },
  {
    id: "finance",
    title: "مالی و ERP",
    subtitle: "نقد، هزینه، قرارداد و سودآوری",
    icon: Calculator,
  },
  {
    id: "procurement",
    title: "خرید و انبار",
    subtitle: "تأمین، موجودی و دارایی‌ها",
    icon: Package,
  },
  {
    id: "hr-ops",
    title: "منابع انسانی و عملیات",
    subtitle: "نیرو، ناوگان و تله‌متری تجهیزات",
    icon: HardHat,
  },
  {
    id: "docs",
    title: "اسناد و ارتباطات",
    subtitle: "فایل‌ها، مکاتبات و فضای مشترک",
    icon: FileText,
  },
  {
    id: "ai-data",
    title: "هوش مصنوعی و داده",
    subtitle: "تحلیل، API و منابع سفارشی",
    icon: Bot,
  },
];

export const statusLabel: Record<ConnectionStatus, string> = {
  online: "آنلاین",
  warning: "هشدار",
  offline: "قطع‌شده",
};

/** 24 enterprise connections — THE MACHINE as organizational brain */
export const orgConnections: OrgConnection[] = [
  // Project — 4
  {
    id: "primavera",
    name: "Primavera P6",
    category: "project",
    status: "warning",
    lastSyncLabel: "۳۵ دقیقه پیش",
    lastSyncMinutes: 35,
    latencyMs: 420,
    dataQuality: 78,
    recordsSynced: 18420,
    health: 72,
    lastError: "تأخیر همگام‌سازی برنامه مسیر بحرانی",
    feeds: ["اطمینان برنامه", "مسیر بحرانی", "نقاط عطف"],
    businessImpact:
      "داده‌های Primavera با ۳۵ دقیقه تأخیر دریافت شده‌اند. پیش‌بینی پیشرفت پروژه ممکن است با خطای زمانی همراه باشد.",
    recommendedAction:
      "همگام‌سازی دستی مسیر بحرانی آریا را فعال کنید و تا پایدار شدن، تصمیم‌های نقطه عطف را با تأخیر اعلام‌شده در نظر بگیرید.",
    monogram: "P6",
    icon: CalendarClock,
  },
  {
    id: "ms-project",
    name: "Microsoft Project",
    category: "project",
    status: "online",
    lastSyncLabel: "۴ دقیقه پیش",
    lastSyncMinutes: 4,
    latencyMs: 180,
    dataQuality: 94,
    recordsSynced: 9620,
    health: 96,
    feeds: ["برنامه پروژه‌های فرعی"],
    businessImpact: "جریان برنامه پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "MP",
    icon: FolderKanban,
  },
  {
    id: "acc",
    name: "Autodesk Construction Cloud",
    category: "project",
    status: "online",
    lastSyncLabel: "۸ دقیقه پیش",
    lastSyncMinutes: 8,
    latencyMs: 240,
    dataQuality: 91,
    recordsSynced: 22100,
    health: 93,
    feeds: ["مدل‌ها", "RFIs", "نقشه‌ها"],
    businessImpact: "مدل و اسناد فنی به‌روز هستند.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "AC",
    icon: Cloud,
  },
  {
    id: "procore",
    name: "Procore",
    category: "project",
    status: "online",
    lastSyncLabel: "۶ دقیقه پیش",
    lastSyncMinutes: 6,
    latencyMs: 210,
    dataQuality: 89,
    recordsSynced: 15340,
    health: 91,
    feeds: ["صورت‌جلسه", "کیفیت میدانی"],
    businessImpact: "داده‌های میدانی پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "PC",
    icon: Boxes,
  },

  // Finance — 4
  {
    id: "sap",
    name: "SAP ERP",
    category: "finance",
    status: "offline",
    lastSyncLabel: "۲ ساعت پیش",
    lastSyncMinutes: 120,
    latencyMs: 0,
    dataQuality: 41,
    recordsSynced: 0,
    health: 28,
    lastError: "مهلت نشست سرویس منقضی شده — احراز هویت ناموفق",
    feeds: ["نقد", "هزینه", "حاشیه", "صورت‌وضعیت"],
    businessImpact:
      "اتصال SAP ERP طی ۲ ساعت گذشته همگام‌سازی نشده است. در صورت ادامه این وضعیت، داشبوردهای مالی و گزارش‌های سودآوری با داده‌های قدیمی نمایش داده خواهند شد.",
    recommendedAction:
      "اعتبار اتصال مالی را تمدید کنید و همگام‌سازی اجباری را پس از بازیابی اجرا کنید. تا آن زمان تصمیم‌های نقدی را با برچسب «داده کهنه» در نظر بگیرید.",
    monogram: "SAP",
    icon: Landmark,
  },
  {
    id: "oracle-erp",
    name: "Oracle ERP",
    category: "finance",
    status: "online",
    lastSyncLabel: "۵ دقیقه پیش",
    lastSyncMinutes: 5,
    latencyMs: 260,
    dataQuality: 92,
    recordsSynced: 28700,
    health: 94,
    feeds: ["تعهدات", "پرداخت‌ها"],
    businessImpact: "جریان مالی کمکی پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "OR",
    icon: Database,
  },
  {
    id: "dynamics",
    name: "Microsoft Dynamics 365",
    category: "finance",
    status: "online",
    lastSyncLabel: "۹ دقیقه پیش",
    lastSyncMinutes: 9,
    latencyMs: 300,
    dataQuality: 88,
    recordsSynced: 12450,
    health: 90,
    feeds: ["قراردادها", "مشتریان"],
    businessImpact: "داده‌های قراردادی به‌روز است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "D365",
    icon: Briefcase,
  },
  {
    id: "sepidar",
    name: "سپیدار",
    category: "finance",
    status: "online",
    lastSyncLabel: "۳ دقیقه پیش",
    lastSyncMinutes: 3,
    latencyMs: 150,
    dataQuality: 95,
    recordsSynced: 19880,
    health: 97,
    feeds: ["حسابداری داخلی", "خزانه"],
    businessImpact: "حسابداری داخلی هم‌تراز است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "سپ",
    icon: Calculator,
  },

  // Procurement — 4
  {
    id: "procurement",
    name: "سامانه خرید",
    category: "procurement",
    status: "online",
    lastSyncLabel: "۷ دقیقه پیش",
    lastSyncMinutes: 7,
    latencyMs: 190,
    dataQuality: 90,
    recordsSynced: 8420,
    health: 92,
    feeds: ["سفارش‌ها", "اقلام بحرانی"],
    businessImpact: "صف خرید هم‌تراز برنامه است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "خر",
    icon: Package,
  },
  {
    id: "wms",
    name: "مدیریت انبار",
    category: "procurement",
    status: "online",
    lastSyncLabel: "۵ دقیقه پیش",
    lastSyncMinutes: 5,
    latencyMs: 170,
    dataQuality: 93,
    recordsSynced: 22110,
    health: 95,
    feeds: ["موجودی", "حواله"],
    businessImpact: "موجودی انبار به‌روز است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "ان",
    icon: Warehouse,
  },
  {
    id: "supplier",
    name: "پورتال تأمین‌کنندگان",
    category: "procurement",
    status: "warning",
    lastSyncLabel: "۴۸ دقیقه پیش",
    lastSyncMinutes: 48,
    latencyMs: 680,
    dataQuality: 74,
    recordsSynced: 3120,
    health: 68,
    lastError: "پاسخ کند تأمین‌کننده فولاد — صف تأیید معوق",
    feeds: ["وضعیت سفارش بلندمدت"],
    businessImpact:
      "پورتال تأمین‌کنندگان با تأخیر هم‌گام می‌شود. ریسک تأمین اقلام مسیر بحرانی ممکن است دیرتر از واقعیت دیده شود.",
    recommendedAction:
      "وضعیت سفارش فولاد آریا را خارج از سامانه نیز تأیید کنید تا تصمیم تدارکات روی داده کهنه گرفته نشود.",
    monogram: "تأ",
    icon: Truck,
  },
  {
    id: "asset",
    name: "مدیریت دارایی",
    category: "procurement",
    status: "online",
    lastSyncLabel: "۱۱ دقیقه پیش",
    lastSyncMinutes: 11,
    latencyMs: 220,
    dataQuality: 87,
    recordsSynced: 5640,
    health: 89,
    feeds: ["دارایی ثابت", "استهلاک"],
    businessImpact: "ثبت دارایی پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "دا",
    icon: Layers,
  },

  // HR & Ops — 4
  {
    id: "attendance",
    name: "سامانه حضور و غیاب",
    category: "hr-ops",
    status: "online",
    lastSyncLabel: "۲ دقیقه پیش",
    lastSyncMinutes: 2,
    latencyMs: 120,
    dataQuality: 96,
    recordsSynced: 45200,
    health: 98,
    feeds: ["حضور کارگاه", "اضافه‌کاری"],
    businessImpact: "حضور نیرو هم‌زمان است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "حض",
    icon: Clock,
  },
  {
    id: "hr",
    name: "سامانه منابع انسانی",
    category: "hr-ops",
    status: "online",
    lastSyncLabel: "۱۵ دقیقه پیش",
    lastSyncMinutes: 15,
    latencyMs: 200,
    dataQuality: 91,
    recordsSynced: 6780,
    health: 93,
    feeds: ["پست‌ها", "مهارت‌ها"],
    businessImpact: "ظرفیت نیروی انسانی به‌روز است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "HR",
    icon: Users,
  },
  {
    id: "fleet-gps",
    name: "ناوگان GPS",
    category: "hr-ops",
    status: "online",
    lastSyncLabel: "۱ دقیقه پیش",
    lastSyncMinutes: 1,
    latencyMs: 90,
    dataQuality: 94,
    recordsSynced: 128400,
    health: 96,
    feeds: ["موقعیت خودرو", "مسیر"],
    businessImpact: "ردیابی ناوگان زنده است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "GPS",
    icon: Truck,
  },
  {
    id: "iot-equip",
    name: "تله‌متری تجهیزات (IoT)",
    category: "hr-ops",
    status: "online",
    lastSyncLabel: "۴۵ ثانیه پیش",
    lastSyncMinutes: 1,
    latencyMs: 75,
    dataQuality: 92,
    recordsSynced: 890200,
    health: 95,
    feeds: ["بهره‌برداری", "خواب ناوگان"],
    businessImpact: "سیگنال تجهیزات زنده است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "IoT",
    icon: Radio,
  },

  // Docs — 4
  {
    id: "m365",
    name: "Microsoft 365",
    category: "docs",
    status: "online",
    lastSyncLabel: "۳ دقیقه پیش",
    lastSyncMinutes: 3,
    latencyMs: 160,
    dataQuality: 93,
    recordsSynced: 33400,
    health: 95,
    feeds: ["تقویم", "تیم‌ها"],
    businessImpact: "همکاری سازمانی پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "M365",
    icon: Briefcase,
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    category: "docs",
    status: "online",
    lastSyncLabel: "۶ دقیقه پیش",
    lastSyncMinutes: 6,
    latencyMs: 210,
    dataQuality: 90,
    recordsSynced: 41200,
    health: 92,
    feeds: ["اسناد پروژه", "نسخه‌ها"],
    businessImpact: "مخزن اسناد هم‌تراز است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "SP",
    icon: Share2,
  },
  {
    id: "gdrive",
    name: "Google Drive",
    category: "docs",
    status: "online",
    lastSyncLabel: "۱۰ دقیقه پیش",
    lastSyncMinutes: 10,
    latencyMs: 240,
    dataQuality: 88,
    recordsSynced: 15600,
    health: 90,
    feeds: ["فایل‌های مشترک"],
    businessImpact: "فضای ابری کمکی پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "GD",
    icon: HardDrive,
  },
  {
    id: "email",
    name: "سرور ایمیل",
    category: "docs",
    status: "online",
    lastSyncLabel: "۲ دقیقه پیش",
    lastSyncMinutes: 2,
    latencyMs: 110,
    dataQuality: 97,
    recordsSynced: 67200,
    health: 98,
    feeds: ["مکاتبات کارفرما", "اعلان‌ها"],
    businessImpact: "جریان مکاتبات زنده است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "ای",
    icon: Mail,
  },

  // AI & Data — 4
  {
    id: "powerbi",
    name: "Power BI",
    category: "ai-data",
    status: "online",
    lastSyncLabel: "۱۲ دقیقه پیش",
    lastSyncMinutes: 12,
    latencyMs: 280,
    dataQuality: 86,
    recordsSynced: 9400,
    health: 88,
    feeds: ["گزارش‌های هیئت"],
    businessImpact: "خروجی تحلیلی مکمل پایدار است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "PBI",
    icon: BarChart3,
  },
  {
    id: "rest-apis",
    name: "REST APIs",
    category: "ai-data",
    status: "online",
    lastSyncLabel: "۱ دقیقه پیش",
    lastSyncMinutes: 1,
    latencyMs: 95,
    dataQuality: 94,
    recordsSynced: 210450,
    health: 96,
    feeds: ["ادغام‌های سفارشی"],
    businessImpact: "لایه API پاسخ‌گو است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "API",
    icon: Webhook,
  },
  {
    id: "ai-agents",
    name: "عامل‌های هوش مصنوعی",
    category: "ai-data",
    status: "online",
    lastSyncLabel: "لحظاتی پیش",
    lastSyncMinutes: 0,
    latencyMs: 60,
    dataQuality: 95,
    recordsSynced: 1280,
    health: 97,
    feeds: ["استخراج گفتگو", "پیشنهاد اجرایی"],
    businessImpact: "لایه هوش اجرایی فعال است.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "AI",
    icon: Cpu,
  },
  {
    id: "custom-data",
    name: "منابع داده سفارشی",
    category: "ai-data",
    status: "online",
    lastSyncLabel: "۱۴ دقیقه پیش",
    lastSyncMinutes: 14,
    latencyMs: 310,
    dataQuality: 85,
    recordsSynced: 7200,
    health: 87,
    feeds: ["فایل‌های ETL", "جداول عملیاتی"],
    businessImpact: "منابع سفارشی در محدوده قابل قبول هستند.",
    recommendedAction: "پایش عادی کافی است.",
    monogram: "DS",
    icon: Database,
  },
];

export interface EcosystemOverview {
  total: number;
  online: number;
  warning: number;
  offline: number;
  lastSyncLabel: string;
  healthScore: number;
}

export function getEcosystemOverview(
  connections: OrgConnection[] = orgConnections
): EcosystemOverview {
  const online = connections.filter((c) => c.status === "online").length;
  const warning = connections.filter((c) => c.status === "warning").length;
  const offline = connections.filter((c) => c.status === "offline").length;
  const freshest = Math.min(...connections.map((c) => c.lastSyncMinutes));
  const lastSyncLabel =
    freshest <= 1
      ? "کمتر از یک دقیقه پیش"
      : freshest <= 2
        ? "۲ دقیقه پیش"
        : `${freshest} دقیقه پیش`;

  const healthScore = Math.round(
    (online * 100 + warning * 70 + offline * 15) / connections.length
  );

  return {
    total: connections.length,
    online,
    warning,
    offline,
    lastSyncLabel,
    healthScore,
  };
}

export function getPriorityAdvisories(
  connections: OrgConnection[] = orgConnections
): OrgConnection[] {
  return connections
    .filter((c) => c.status === "offline" || c.status === "warning")
    .sort((a, b) => {
      const rank = (s: ConnectionStatus) =>
        s === "offline" ? 0 : s === "warning" ? 1 : 2;
      return rank(a.status) - rank(b.status) || b.lastSyncMinutes - a.lastSyncMinutes;
    });
}

/** Graph orbit nodes — aggregated systems around THE MACHINE */
export interface GraphNode {
  id: string;
  label: string;
  status: ConnectionStatus;
  angle: number;
}

export function getConnectionGraphNodes(
  connections: OrgConnection[] = orgConnections
): GraphNode[] {
  const groups: { id: string; label: string; match: (c: OrgConnection) => boolean }[] = [
    {
      id: "erp",
      label: "ERP",
      match: (c) =>
        ["sap", "oracle-erp", "dynamics", "sepidar"].includes(c.id),
    },
    {
      id: "primavera",
      label: "Primavera",
      match: (c) => c.id === "primavera",
    },
    {
      id: "pm",
      label: "مدیریت پروژه",
      match: (c) =>
        ["ms-project", "acc", "procore"].includes(c.id),
    },
    {
      id: "finance",
      label: "مالی",
      match: (c) => c.category === "finance",
    },
    {
      id: "hr",
      label: "منابع انسانی",
      match: (c) => ["attendance", "hr"].includes(c.id),
    },
    {
      id: "warehouse",
      label: "انبار",
      match: (c) => ["wms", "procurement", "supplier", "asset"].includes(c.id),
    },
    {
      id: "iot",
      label: "IoT",
      match: (c) => ["iot-equip", "fleet-gps"].includes(c.id),
    },
    {
      id: "email",
      label: "ایمیل",
      match: (c) => c.id === "email",
    },
    {
      id: "sharepoint",
      label: "SharePoint",
      match: (c) => c.id === "sharepoint",
    },
    {
      id: "gdrive",
      label: "Google Drive",
      match: (c) => c.id === "gdrive",
    },
    {
      id: "powerbi",
      label: "Power BI",
      match: (c) => c.id === "powerbi",
    },
    {
      id: "api",
      label: "API",
      match: (c) => ["rest-apis", "ai-agents", "custom-data"].includes(c.id),
    },
  ];

  return groups.map((g, i) => {
    const members = connections.filter(g.match);
    const worst: ConnectionStatus = members.some((m) => m.status === "offline")
      ? "offline"
      : members.some((m) => m.status === "warning")
        ? "warning"
        : "online";
    return {
      id: g.id,
      label: g.label,
      status: worst,
      angle: (i / groups.length) * Math.PI * 2 - Math.PI / 2,
    };
  });
}
