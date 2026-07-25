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

import data from "@demo/mock-data/workflows/runtime.json";

export const workflowRuntime = data.workflowRuntime as Record<string, WorkflowRuntimeMeta>;

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

export const workflowCategories = data.workflowCategories;
export const runStatusLabel = data.runStatusLabel as Record<WorkflowRunStatus, string>;
