"use client";

import { ExecutiveDomainPage } from "./ExecutiveDomainPage";
import { commandItems, insights } from "@/mock/command-center";

export function CapitalModule() {
  const moneyItems = commandItems.filter(
    (i) =>
      i.title.includes("وصول") ||
      i.title.includes("نقد") ||
      i.kind === "approval" ||
      (i.impact && i.impact.includes("میلیارد"))
  );

  return (
    <ExecutiveDomainPage
      title="پول و قرارداد"
      eyebrow="سرمایه و تعهدات"
      headline="نقد کجاست، مطالبات کجا گیر کرده، کدام تعهد حاشیه را می‌خورد؟"
      summary="این صفحه برای تصمیم مالی امروز است: اولویت وصول، فشار نقد، و تأییدهایی که بدون دید حاشیه خطرناک‌اند."
      primaryAction={{
        label: "بررسی نقدینگی این هفته",
        query: "وضعیت نقدینگی این هفته چگونه است؟",
      }}
      sections={[
        {
          title: "اولویت‌های مالی",
          items: (moneyItems.length ? moneyItems : commandItems.slice(0, 4)).map(
            (item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail,
              meta: item.impact,
              tone:
                item.priority === "urgent"
                  ? "critical"
                  : item.priority === "high"
                    ? "high"
                    : "neutral",
              query: item.title,
            })
          ),
        },
        {
          title: "شاخص‌های تصمیم",
          items: insights
            .filter((i) => i.twinNode === "cash" || i.title.includes("حاشیه"))
            .concat(insights.filter((i) => i.twinNode !== "cash").slice(0, 1))
            .slice(0, 3)
            .map((ins) => ({
              id: `c-${ins.id}`,
              title: ins.title,
              detail: ins.story,
              meta: ins.value,
              tone: ins.tone === "low" ? "healthy" : ins.tone,
              query: `اثر مالی «${ins.title}» را توضیح بده.`,
            })),
        },
      ]}
    />
  );
}
