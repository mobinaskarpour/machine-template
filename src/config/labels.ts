export const APP_NAME = "THE MACHINE";

export const pageLabels = {
  home: "دید مدیریتی",
  chat: "فضای کار هوش مصنوعی",
  dashboards: "داشبوردها",
  workflows: "گردش‌کارها",
  evidence: "شواهد پروژه",
  connections: "اتصالات",
  portfolio: "پورتفویو",
  capital: "پول و قرارداد",
  operations: "اجرا و تأمین",
  inbox: "صندوق اجرایی",
  brand: "THE MACHINE",
} as const;

export const uiLabels = {
  searchExecutive: "جستجوی اجرایی…",
  aiWorkspace: "فضای کار هوش مصنوعی",
  notifications: "صندوق اجرایی",
  profile: "پروفایل",
  fromYesterday: "از دیروز",
  recommendedAction: "اقدام پیشنهادی",
  businessImpact: "اثر کسب‌وکار",
  financialImpact: "اثر مالی",
  riskLevel: "سطح ریسک",
  openApprovals: "تأییدهای باز",
  detectedRisks: "ریسک‌های شناسایی‌شده",
  pendingWorkflows: "گردش‌کارهای پیشنهادی",
  pendingDashboards: "داشبوردهای پیشنهادی",
  recommendations: "پیشنهادهای اجرایی",
  investigations: "بررسی‌های پیشنهادی",
  portfolioHealth: "سلامت پورتفویو",
  digitalTwin: "دوقلوی دیجیتال کسب‌وکار",
  quickQuestions: "سؤالات اجرایی",
  ignoreHint: "قابل نادیده گرفتن امروز",
  openDashboard: "ورود به داشبورد",
  openWorkflow: "ورود به گردش‌کار",
  entryHint: "جزئیات در داشبورد تخصصی",
} as const;

/** Six-item rail — Overview · AI · Evidence · Dashboards · Workflows · Connections */
export const railItems = [
  { id: "home", label: pageLabels.home, href: "/", icon: "command" },
  { id: "chat", label: pageLabels.chat, href: "/chat", icon: "sparkles" },
  { id: "evidence", label: pageLabels.evidence, href: "/evidence", icon: "camera" },
  { id: "dashboards", label: pageLabels.dashboards, href: "/dashboards", icon: "layout" },
  { id: "workflows", label: pageLabels.workflows, href: "/workflows", icon: "branch" },
  { id: "connections", label: pageLabels.connections, href: "/connections", icon: "network" },
] as const;
