"use client";

import { ExecutiveDomainPage } from "./ExecutiveDomainPage";
import { commandItems, projects } from "@/mock/command-center";
import { toPersianDigits } from "@/lib/persian";

export function OperationsModule() {
  const ops = commandItems.filter(
    (i) =>
      i.kind === "investigation" ||
      i.kind === "risk" ||
      i.title.includes("تجهیز") ||
      i.title.includes("پیمانکار") ||
      i.title.includes("تدارک")
  );

  return (
    <ExecutiveDomainPage
      title="اجرا و تأمین"
      eyebrow="عملیات میدانی"
      headline="چه چیزی اجرای امروز را کند یا پرریسک کرده است؟"
      summary="تمرکز روی پیمانکار، تدارکات مسیر بحرانی، و بهره‌برداری تجهیزات — مسائلی که بدون مداخله مدیریتی تأخیر می‌سازند."
      primaryAction={{
        label: "بررسی ظرفیت پیمانکار آریا",
        query: "وضعیت پیمانکار سازه آریا چگونه است؟",
      }}
      sections={[
        {
          title: "گلوگاه‌های اجرا",
          items: (ops.length ? ops : commandItems.slice(0, 4)).map((item) => ({
            id: item.id,
            title: item.title,
            detail: item.detail,
            meta: item.impact,
            tone:
              item.priority === "urgent"
                ? "critical"
                : item.priority === "high"
                  ? "high"
                  : "medium",
            query: item.title,
          })),
        },
        {
          title: "پروژه‌های تحت فشار اجرا",
          items: projects
            .filter((p) => p.risk === "critical" || p.risk === "high" || p.scheduleConfidence < 50)
            .slice(0, 3)
            .map((p) => ({
              id: `op-${p.id}`,
              title: p.name,
              detail: `اطمینان برنامه ${toPersianDigits(p.scheduleConfidence)}٪ · ${p.cashflow}`,
              meta: p.riskLabel,
              tone: p.risk === "critical" || p.risk === "high" ? p.risk : "medium",
              query: `گلوگاه‌های اجرایی پروژه ${p.name} را فهرست کن.`,
            })),
        },
      ]}
    />
  );
}
