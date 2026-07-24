import type {
  Conversation,
  ExecutiveReport,
  ExecutiveRole,
  HistoryCategory,
} from "@/types/ai";

export const historyCategories: { id: HistoryCategory; label: string }[] = [
  { id: "portfolio", label: "پورتفویو" },
  { id: "capital", label: "پول و قرارداد" },
  { id: "operations", label: "اجرا" },
  { id: "risk", label: "ریسک" },
  { id: "sessions", label: "جلسات" },
];

export const roleLabels: Record<ExecutiveRole, string> = {
  ceo: "مدیرعامل",
  cfo: "مدیر مالی",
  project: "مدیر پروژه",
  operations: "مدیر عملیات",
};

/** Contextual quick questions — morning vs afternoon, by role */
export function getContextualQuestions(
  role: ExecutiveRole,
  hour: number
): string[] {
  const isMorning = hour < 12;

  const byRole: Record<ExecutiveRole, { morning: string[]; afternoon: string[] }> = {
    ceo: {
      morning: [
        "امروز سه تصمیمی که باید بگیرم چیست؟",
        "کدام پروژه بیشترین ریسک را دارد؟",
        "وضعیت نقدینگی این هفته چگونه است؟",
        "از دیروز چه چیزی تغییر کرده؟",
        "کدام پیمانکار نیاز به توجه دارد؟",
        "آیا چیزی هست که امروز نادیده بگیرم؟",
      ],
      afternoon: [
        "تصمیم‌های باز تا پایان روز کدام‌اند؟",
        "اگر برج آریا یک هفته تأخیر بخورد چه می‌شود؟",
        "چقدر سرمایه در گردش گیر کرده است؟",
        "خلاصه برای هیئت‌مدیره فردا چیست؟",
        "کدام تأیید را باید امروز ببندم؟",
        "ریسک جریمه قراردادهای جاری چقدر است؟",
      ],
    },
    cfo: {
      morning: [
        "وضعیت نقدینگی این هفته چگونه است؟",
        "چقدر سرمایه در گردش گیر کرده است؟",
        "کدام صورت‌وضعیت‌ها اولویت وصول دارند؟",
        "حاشیه پورتفویو نسبت به ماه قبل چه تغییری کرده؟",
        "پرداخت‌های این هفته چه فشاری دارند؟",
        "درآمد در معرض ریسک چقدر است؟",
      ],
      afternoon: [
        "آیا می‌توانیم پرداخت پیمانکار آریا را مشروط کنیم؟",
        "اثر دستور تغییر ۱۴ بر حاشیه چیست؟",
        "پیش‌بینی نقدینگی ۳۰ روز آینده چیست؟",
        "حسن‌انجام چقدر نقدینگی را قفل کرده؟",
        "مقایسه وصول این فصل با فصل قبل",
        "کدام پروژه حاشیه را بیشتر می‌خورد؟",
      ],
    },
    project: {
      morning: [
        "کدام پروژه بیشترین ریسک را دارد؟",
        "مسیر بحرانی برج آریا کجاست؟",
        "اگر برج آریا یک هفته تأخیر بخورد چه می‌شود؟",
        "وضعیت پیمانکار سازه آریا چگونه است؟",
        "اقلام تدارکاتی تهدیدکننده مسیر کدام‌اند؟",
        "آیا برنامه بازیابی معتبر است؟",
      ],
      afternoon: [
        "پیشرفت واقعی در برابر گزارش امروز چیست؟",
        "کدام نقطه عطف قراردادی در خطر است؟",
        "ریشه تأخیر سازه چیست؟",
        "آیا باید جلسه کارفرما را پیشنهاد کنم؟",
        "وضعیت کیفیت و عدم‌انطباق‌های باز",
        "تخصیص تجهیزات بین آریا و پارس",
      ],
    },
    operations: {
      morning: [
        "کدام جبهه کار امروز خوابیده است؟",
        "بهره‌برداری تجهیزات حیاتی چگونه است؟",
        "کمبود مصالح کجا تولید را تهدید می‌کند؟",
        "کدام پیمانکار نیاز به توجه دارد؟",
        "وضعیت ایمنی سایت‌های پرریسک",
        "اجاره تجهیزات کجا از حد گذشته؟",
      ],
      afternoon: [
        "آیا بازتخصیص جرثقیل از خط ۷ منطقی است؟",
        "خواب بچینگ پارس چه هزینه‌ای دارد؟",
        "اولویت تدارکات فردا چیست؟",
        "ظرفیت پیمانکاران برای هفته آینده",
        "کجا دوباره‌کاری هزینه می‌سازد؟",
        "آمادگی سایت برای بتن‌ریزی آریا",
      ],
    },
  };

  return isMorning ? byRole[role].morning : byRole[role].afternoon;
}

export const welcomeFollowUps = [
  "کدام پروژه بیشترین ریسک را دارد؟",
  "وضعیت نقدینگی این هفته چگونه است؟",
  "امروز سه تصمیمی که باید بگیرم چیست؟",
];

export const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "ریسک برج آریا",
    category: "risk",
    preview: "مسیر بحرانی و اثر نقدینگی",
    updatedAt: "دیروز",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "چرا برج آریا قرمز شده؟",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "برج آریا به‌خاطر شکستن مسیر بحرانی و قفل شدن صورت‌وضعیت فاز ۲ وارد وضعیت قرمز شده است.",
      },
    ],
  },
  {
    id: "conv-2",
    title: "نقدینگی هفته",
    category: "capital",
    preview: "۱۸.۴ میلیارد در معرض ریسک",
    updatedAt: "۲ روز پیش",
    messages: [
      {
        id: "m3",
        role: "user",
        content: "وضعیت نقدینگی این هفته چگونه است؟",
      },
    ],
  },
  {
    id: "conv-3",
    title: "عملکرد پیمانکاران",
    category: "operations",
    preview: "پیمانکار سازه زیر آستانه",
    updatedAt: "هفته گذشته",
    messages: [],
  },
];

export function getCategoryLabel(category: HistoryCategory): string {
  return historyCategories.find((c) => c.id === category)?.label ?? category;
}

/** Shared block builders used by engine */
export function baseReport(
  partial: Omit<ExecutiveReport, "thinkingSteps"> & {
    thinkingSteps?: string[];
  }
): ExecutiveReport {
  return {
    thinkingSteps: partial.thinkingSteps ?? [
      "در حال تحلیل پورتفویو…",
      "تطبیق داده مالی با برنامه…",
      "برآورد اثر کسب‌وکار…",
      "آماده‌سازی توصیه قابل تصمیم…",
    ],
    ...partial,
  };
}
