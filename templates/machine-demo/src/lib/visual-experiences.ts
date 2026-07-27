import type { VisualExperience, VisualExperienceKind } from "@/types/ai";

export interface BusinessAction {
  id: string;
  label: string;
  /** Injected as user intent — also drives visual selection */
  query: string;
  kind: VisualExperienceKind;
}

/** Interactive business actions — open rich experiences, not plain chat */
export const businessActions: BusinessAction[] = [
  {
    id: "images",
    label: "تصاویر پروژه",
    query: "تصاویر پروژه برج آریا را نشان بده",
    kind: "project-images",
  },
  {
    id: "videos",
    label: "ویدئوهای پروژه",
    query: "ویدئوهای بازرسی برج آریا را باز کن",
    kind: "project-videos",
  },
  {
    id: "map",
    label: "نقشه پروژه",
    query: "نقشه تعاملی کارگاه آریا را نشان بده",
    kind: "site-map",
  },
  {
    id: "twin",
    label: "دوقلوی دیجیتال",
    query: "دوقلوی دیجیتال پروژه آریا را باز کن",
    kind: "digital-twin",
  },
  {
    id: "docs",
    label: "اسناد پروژه",
    query: "اسناد کلیدی برج آریا را نشان بده",
    kind: "documents",
  },
  {
    id: "finance",
    label: "داشبورد مالی",
    query: "داشبورد مالی و نقدینگی آریا را باز کن",
    kind: "financial-breakdown",
  },
  {
    id: "risks",
    label: "ریسک‌های پروژه",
    query: "ریسک‌های فعال برج آریا چیست؟",
    kind: "risks",
  },
  {
    id: "equip",
    label: "ماشین‌آلات",
    query: "وضعیت ماشین‌آلات و تجهیزات آریا",
    kind: "equipment",
  },
  {
    id: "schedule",
    label: "برنامه زمان‌بندی",
    query: "برنامه زمان‌بندی و نقاط عطف آریا",
    kind: "timeline",
  },
  {
    id: "progress",
    label: "درصد پیشرفت",
    query: "درصد پیشرفت واقعی در برابر برنامه آریا",
    kind: "vision-analysis",
  },
  {
    id: "cams",
    label: "دوربین‌های کارگاه",
    query: "دوربین‌های زنده کارگاه آریا را نشان بده",
    kind: "project-cameras",
  },
  {
    id: "ai-vision",
    label: "تحلیل هوش مصنوعی",
    query: "تحلیل تصویری پیشرفت و مسائل کارگاه آریا",
    kind: "vision-analysis",
  },
];

function v(
  kind: VisualExperienceKind,
  title: string,
  subtitle?: string,
  href?: string
): VisualExperience {
  return {
    id: `viz-${kind}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    title,
    subtitle,
    href,
  };
}

/** Pick 1–3 interactive visuals from the executive question */
export function pickVisualsForQuery(query: string): VisualExperience[] {
  const q = query.trim();

  const rules: { patterns: string[]; visuals: VisualExperience[] }[] = [
    {
      patterns: ["دوربین", "زنده"],
      visuals: [
        v("project-cameras", "دوربین‌های کارگاه آریا", "۴ فید فعال"),
        v("site-map", "موقعیت دوربین‌ها روی نقشه"),
      ],
    },
    {
      patterns: ["تصویر", "عکس", "گالری"],
      visuals: [
        v("project-images", "گالری هوشمند پروژه", "قبل / بعد · هفته جاری"),
        v("vision-analysis", "تحلیل پیشرفت از تصویر", "اطمینان ۷۸٪"),
      ],
    },
    {
      patterns: ["ویدئو", "بازرسی هوایی"],
      visuals: [
        v("project-videos", "ویدئوی بازرسی", "آخرین پرواز پهپاد"),
        v("vision-analysis", "کشف مسائل از ویدئو"),
      ],
    },
    {
      patterns: ["نقشه", "سایت", "کارگاه"],
      visuals: [
        v("site-map", "نقشه تعاملی کارگاه", "مناطق مسدود مشخص شده"),
        v("digital-twin", "وضعیت گره‌های عملیاتی"),
      ],
    },
    {
      patterns: ["دوقلو", "Digital Twin", "دیجیتال"],
      visuals: [
        v("digital-twin", "دوقلوی دیجیتال پروژه"),
        v("risks", "گره‌های پرریسک"),
        v("dashboard-card", "ورود به داشبورد ریسک", undefined, "/dashboards/db-risk"),
      ],
    },
    {
      patterns: ["سند", "اسناد", "نقشه سازه", "صورت‌وضعیت"],
      visuals: [
        v("documents", "مرکز اسناد پروژه", "نسخه‌بندی فعال"),
        v(
          "dashboard-card",
          "داشبورد وصول مرتبط",
          undefined,
          "/dashboards/db-ar"
        ),
      ],
    },
    {
      patterns: ["مالی", "نقد", "حاشیه", "نقدینگی", "پول"],
      visuals: [
        v("financial-breakdown", "شکست اثر مالی", "از درآمد تا نقد آزاد"),
        v("cashflow", "رودخانه نقد ۱۲ هفته"),
        v("forecast", "پیش‌بینی دوام نقد"),
      ],
    },
    {
      patterns: ["ماشین", "تجهیز", "بچینگ", "ناوگان"],
      visuals: [
        v("equipment", "وضعیت ماشین‌آلات", "خواب و بهره‌برداری"),
        v("timeline", "محور نگهداری ۷روزه"),
      ],
    },
    {
      patterns: ["زمان", "برنامه", "نقطه عطف", "زمان‌بندی", "پیشرفت"],
      visuals: [
        v("timeline", "محور زمان‌بندی اجرایی"),
        v("vision-analysis", "پیشرفت واقعی در برابر برنامه"),
        v("forecast", "پیش‌بینی تکمیل"),
      ],
    },
    {
      patterns: ["ریسک", "قرمز", "آریا", "تهدید"],
      visuals: [
        v("risks", "ریسک‌های فعال امروز"),
        v("executive-chart", "مقایسه اطمینان برنامه پروژه‌ها"),
        v(
          "workflow-card",
          "گردش‌کار پیشنهادی بازیابی",
          undefined,
          "/workflows/wf-delay"
        ),
      ],
    },
    {
      patterns: ["تحلیل", "هوش مصنوعی", "بینایی"],
      visuals: [
        v("vision-analysis", "تحلیل بینایی پروژه", "تأخیر · ایمنی · کیفیت"),
        v("project-images", "شواهد تصویری"),
        v("site-map", "مناطق کم‌اطمینان"),
      ],
    },
  ];

  for (const rule of rules) {
    if (rule.patterns.some((p) => q.includes(p))) {
      return rule.visuals.slice(0, 3);
    }
  }

  // Default executive package — never text-only
  return [
    v("executive-chart", "نمای اجرایی مرتبط"),
    v("risks", "ریسک‌های وابسته"),
    v("dashboard-card", "داشبورد پیشنهادی", undefined, "/dashboards/db-risk"),
  ];
}

/** Cap discoveries to exactly one dashboard + one workflow (best of each) */
export function capDiscoveries<
  T extends { type: "dashboard" | "workflow" },
>(list: T[] | undefined): T[] {
  if (!list?.length) return [];
  const db = list.find((d) => d.type === "dashboard");
  const wf = list.find((d) => d.type === "workflow");
  return [db, wf].filter(Boolean) as T[];
}
