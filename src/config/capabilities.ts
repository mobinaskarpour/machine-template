import type { ConcernDomain } from "@/types/intelligence";
import {
  getDashboardBlueprint,
  getWorkflowBlueprint,
} from "@/lib/intelligence/blueprints";

export type CapabilityStatus = "active" | "attention" | "proposed";

export interface OrgDashboard {
  id: string;
  domain: ConcernDomain;
  name: string;
  summary: string;
  question: string;
  status: CapabilityStatus;
  relatedWorkflowId: string;
}

export interface OrgWorkflow {
  id: string;
  domain: ConcernDomain;
  name: string;
  summary: string;
  status: CapabilityStatus;
  relatedDashboardId: string;
  actors: string[];
}

/** Stable organization capabilities — independent of AI recommendations */
export const orgDashboards: OrgDashboard[] = [
  {
    id: "db-risk",
    domain: "risk-portfolio",
    name: "داشبورد ریسک پورتفویو",
    summary: "کدام پروژه امروز پورتفویو را تهدید می‌کند؟",
    question: "بیشترین ریسک کجاست؟",
    status: "attention",
    relatedWorkflowId: "wf-risk",
  },
  {
    id: "db-cash",
    domain: "cashflow",
    name: "داشبورد جریان نقد اجرایی",
    summary: "نقد تا چند هفته دوام دارد و کجا گیر کرده؟",
    question: "موقعیت نقد هفته",
    status: "attention",
    relatedWorkflowId: "wf-cash",
  },
  {
    id: "db-ar",
    domain: "collection",
    name: "داشبورد وصول مطالبات",
    summary: "کدام صورت‌وضعیت اولویت آزادی سرمایه است؟",
    question: "اولویت وصول",
    status: "active",
    relatedWorkflowId: "wf-ar",
  },
  {
    id: "db-delay",
    domain: "delay",
    name: "داشبورد اطمینان برنامه",
    summary: "شناوری مسیر بحرانی و نقاط عطف در خطر",
    question: "اطمینان برنامه",
    status: "attention",
    relatedWorkflowId: "wf-delay",
  },
  {
    id: "db-margin",
    domain: "margin",
    name: "داشبورد حاشیه اجرایی",
    summary: "کدام پروژه حاشیه فصل را می‌خورد؟",
    question: "حاشیه پورتفویو",
    status: "active",
    relatedWorkflowId: "wf-margin",
  },
  {
    id: "db-equip",
    domain: "equipment",
    name: "داشبورد سلامت تجهیزات",
    summary: "خواب ناوگان و هزینه اجاره غیرضروری",
    question: "بهره‌برداری ناوگان",
    status: "active",
    relatedWorkflowId: "wf-equip",
  },
  {
    id: "db-sub",
    domain: "contractor",
    name: "داشبورد عملکرد پیمانکاران",
    summary: "پیمانکار پرریسک و اهرم پرداخت مشروط",
    question: "رتبه پیمانکاران",
    status: "active",
    relatedWorkflowId: "wf-sub",
  },
  {
    id: "db-proc",
    domain: "procurement",
    name: "داشبورد تدارکات بحرانی",
    summary: "اقلام مسیر بحرانی قبل از توقف جبهه",
    question: "اقلام در خطر",
    status: "proposed",
    relatedWorkflowId: "wf-proc",
  },
];

export const orgWorkflows: OrgWorkflow[] = [
  {
    id: "wf-delay",
    domain: "delay",
    name: "بازیابی برنامه پروژه",
    summary: "واکنش استاندارد به شکستن مسیر بحرانی",
    status: "attention",
    relatedDashboardId: "db-delay",
    actors: ["مدیر پروژه", "برنامه‌ریز", "تدارکات"],
  },
  {
    id: "wf-ar",
    domain: "collection",
    name: "وصول مطالبات",
    summary: "آزادی سرمایه قفل‌شده در صورت‌وضعیت‌های معوق",
    status: "active",
    relatedDashboardId: "db-ar",
    actors: ["مالی", "مدیر پروژه"],
  },
  {
    id: "wf-cash",
    domain: "cashflow",
    name: "کنترل جریان نقد اجرایی",
    summary: "اولویت پرداخت و وصول بر اساس اثر عملیاتی",
    status: "active",
    relatedDashboardId: "db-cash",
    actors: ["مدیر مالی", "مدیرعامل"],
  },
  {
    id: "wf-risk",
    domain: "risk-portfolio",
    name: "تشدید ریسک پورتفویو",
    summary: "ارتقای ریسک قرمز به صف تصمیم مدیرعامل",
    status: "attention",
    relatedDashboardId: "db-risk",
    actors: ["دفتر مدیریت پروژه", "مدیرعامل"],
  },
  {
    id: "wf-sub",
    domain: "contractor",
    name: "ارزیابی پیمانکار فرعی",
    summary: "رتبه‌بندی ماهانه و پرداخت مشروط",
    status: "active",
    relatedDashboardId: "db-sub",
    actors: ["عملیات", "مالی"],
  },
  {
    id: "wf-equip",
    domain: "equipment",
    name: "نگهداری و بهره‌برداری تجهیزات",
    summary: "کاهش خواب و اجاره اضطراری",
    status: "active",
    relatedDashboardId: "db-equip",
    actors: ["عملیات", "نگهداری"],
  },
  {
    id: "wf-proc",
    domain: "procurement",
    name: "کنترل تدارکات بحرانی",
    summary: "حذف توقف ناشی از اقلام بلندمدت",
    status: "proposed",
    relatedDashboardId: "db-proc",
    actors: ["تدارکات", "برنامه‌ریز"],
  },
  {
    id: "wf-margin",
    domain: "margin",
    name: "حفاظت از حاشیه سود",
    summary: "بستن نشتی حاشیه قبل از تثبیت زیان فصل",
    status: "active",
    relatedDashboardId: "db-margin",
    actors: ["مدیرعامل", "مالی"],
  },
];

/** Map overview KPI / twin / insight signals → specialized dashboard */
export const overviewEntryMap: Record<string, string> = {
  risk: "db-risk",
  cash: "db-cash",
  schedule: "db-delay",
  portfolio: "db-risk",
  ops: "db-equip",
  collection: "db-ar",
  margin: "db-margin",
  contractor: "db-sub",
  procurement: "db-proc",
  // insight cards
  ins1: "db-cash",
  ins2: "db-delay",
  ins3: "db-sub",
  ins4: "db-ar",
  ins5: "db-proc",
  ins6: "db-equip",
  // charts
  "viz-cash": "db-cash",
  "viz-health": "db-risk",
  "viz-risk": "db-risk",
};

export function dashboardEntryFor(signal: string): string {
  return overviewEntryMap[signal] ?? "db-risk";
}

export function getOrgDashboard(id: string): OrgDashboard | undefined {
  return orgDashboards.find((d) => d.id === id);
}

export function getOrgWorkflow(id: string): OrgWorkflow | undefined {
  return orgWorkflows.find((w) => w.id === id);
}

export function resolveDashboardBlueprint(id: string) {
  const org = getOrgDashboard(id);
  if (!org) return null;
  return getDashboardBlueprint(org.domain);
}

export function resolveWorkflowBlueprint(id: string) {
  const org = getOrgWorkflow(id);
  if (!org) return null;
  return getWorkflowBlueprint(org.domain);
}

export const statusLabel: Record<CapabilityStatus, string> = {
  active: "فعال",
  attention: "نیاز به توجه",
  proposed: "پیشنهادی",
};
