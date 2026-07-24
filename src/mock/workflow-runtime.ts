import type { ConcernDomain } from "@/types/intelligence";

export type WorkflowRunStatus =
  | "running"
  | "idle"
  | "attention"
  | "completed"
  | "failed";

export interface WorkflowRuntimeMeta {
  id: string;
  category: string;
  owner: string;
  runStatus: WorkflowRunStatus;
  lastRunLabel: string;
  runsToday: number;
  avgDuration: string;
  successRate: number;
  stepsCount: number;
  timeline: { at: string; event: string; tone: "ok" | "warn" | "info" }[];
  logs: { at: string; level: "info" | "warn" | "error"; message: string }[];
  kpis: { label: string; value: string }[];
}

const categoryByDomain: Partial<Record<ConcernDomain, string>> = {
  delay: "زمان‌بندی",
  cashflow: "مالی",
  collection: "مالی",
  contractor: "عملیات",
  procurement: "تدارکات",
  equipment: "عملیات",
  margin: "مالی",
  "risk-portfolio": "ریسک",
  hse: "ایمنی",
  quality: "کیفیت",
  budget: "مالی",
  workforce: "منابع انسانی",
  reporting: "گزارش‌دهی",
  "contract-approval": "قرارداد",
};

export const workflowRuntime: Record<string, WorkflowRuntimeMeta> = {
  "wf-delay": {
    id: "wf-delay",
    category: "زمان‌بندی",
    owner: "دفتر مدیریت پروژه",
    runStatus: "attention",
    lastRunLabel: "۴۵ دقیقه پیش",
    runsToday: 3,
    avgDuration: "۱۸ دقیقه",
    successRate: 86,
    stepsCount: 6,
    timeline: [
      { at: "۰۸:۱۰", event: "شروع بازیابی مسیر بحرانی آریا", tone: "info" },
      { at: "۰۸:۴۰", event: "اعلان به پیمانکار سازه", tone: "ok" },
      { at: "۰۹:۱۵", event: "تأخیر پاسخ تأمین فولاد", tone: "warn" },
      { at: "۱۰:۰۲", event: "در انتظار تأیید مدیرعامل", tone: "warn" },
    ],
    logs: [
      { at: "۱۰:۰۲", level: "warn", message: "گام تصمیم مدیریتی باز مانده است" },
      { at: "۰۹:۱۵", level: "warn", message: "API تأمین‌کننده با تأخیر پاسخ داد" },
      { at: "۰۸:۴۰", level: "info", message: "اعلان SMS به پیمانکار ارسال شد" },
      { at: "۰۸:۱۰", level: "info", message: "اجرای گردش‌کار آغاز شد" },
    ],
    kpis: [
      { label: "شناوری بازیابی‌شده", value: "۱.۵ روز" },
      { label: "نرخ اتمام", value: "۸۶٪" },
      { label: "میانگین زمان", value: "۱۸ دقیقه" },
    ],
  },
  "wf-cash": {
    id: "wf-cash",
    category: "مالی",
    owner: "مدیر مالی",
    runStatus: "running",
    lastRunLabel: "۱۲ دقیقه پیش",
    runsToday: 5,
    avgDuration: "۲۲ دقیقه",
    successRate: 91,
    stepsCount: 5,
    timeline: [
      { at: "۰۹:۴۰", event: "پایش موقعیت نقد ۱۴روزه", tone: "info" },
      { at: "۰۹:۵۵", event: "اولویت‌بندی تعهدات پرداخت", tone: "ok" },
      { at: "۱۰:۱۰", event: "همگام‌سازی SAP در جریان", tone: "warn" },
    ],
    logs: [
      { at: "۱۰:۱۰", level: "warn", message: "اتصال SAP ERP قطع موقت" },
      { at: "۰۹:۵۵", level: "info", message: "رتبه‌بندی پرداخت‌ها به‌روز شد" },
    ],
    kpis: [
      { label: "آزادی سرمایه هدف", value: "۱۲.۱ میلیارد" },
      { label: "نرخ موفقیت", value: "۹۱٪" },
      { label: "اجرای امروز", value: "۵" },
    ],
  },
};

export function getWorkflowRuntime(
  id: string,
  domain?: ConcernDomain,
  name?: string
): WorkflowRuntimeMeta {
  if (workflowRuntime[id]) return workflowRuntime[id];
  const category =
    (domain && categoryByDomain[domain]) || "عملیات";
  return {
    id,
    category,
    owner: "مدیر عملیات",
    runStatus: "idle",
    lastRunLabel: "دیروز",
    runsToday: 1,
    avgDuration: "۱۵ دقیقه",
    successRate: 88,
    stepsCount: 5,
    timeline: [
      { at: "دیروز", event: `آخرین اجرای «${name ?? id}»`, tone: "info" },
      { at: "دیروز", event: "اتمام بدون خطا", tone: "ok" },
    ],
    logs: [
      { at: "دیروز", level: "info", message: "اجرای برنامه‌ریزی‌شده تکمیل شد" },
    ],
    kpis: [
      { label: "نرخ موفقیت", value: "۸۸٪" },
      { label: "اجرای هفته", value: "۴" },
      { label: "میانگین زمان", value: "۱۵ دقیقه" },
    ],
  };
}

export const workflowCategories = [
  "همه",
  "زمان‌بندی",
  "مالی",
  "عملیات",
  "تدارکات",
  "ریسک",
  "ایمنی",
  "کیفیت",
];

export const runStatusLabel: Record<WorkflowRunStatus, string> = {
  running: "در حال اجرا",
  idle: "آماده",
  attention: "نیاز به توجه",
  completed: "تکمیل‌شده",
  failed: "ناموفق",
};
