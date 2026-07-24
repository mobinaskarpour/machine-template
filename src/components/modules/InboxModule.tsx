"use client";

import { ExecutiveDomainPage } from "./ExecutiveDomainPage";
import { commandItems, changedSinceYesterday } from "@/mock/command-center";
import { useIntelligenceStore } from "@/store/intelligence-store";

export function InboxModule() {
  const recommendations = useIntelligenceStore((s) => s.recommendations);
  const pendingIntel = recommendations.filter(
    (r) =>
      r.status === "proposed" ||
      r.status === "reviewing" ||
      r.status === "deferred"
  );

  const decisions = commandItems.filter(
    (i) =>
      i.kind === "approval" ||
      i.kind === "recommendation" ||
      i.kind === "risk"
  );

  return (
    <ExecutiveDomainPage
      title="صندوق اجرایی"
      eyebrow="کار مدیرعامل"
      headline="تصمیم‌ها، ریسک‌ها و پیشنهادهایی که منتظر شما هستند."
      summary="این صندوق اعلان نیست — صف کار اجرایی است. هر مورد یا نیاز به تأیید دارد، یا باید امروز نادیده گرفته شود."
      primaryAction={{
        label: "خلاصه تصمیم‌های امروز",
        query: "سه تصمیم مهم امروز چیست؟",
      }}
      sections={[
        {
          title: "صف تصمیم",
          items: decisions.slice(0, 5).map((item) => ({
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
          })),
        },
        {
          title: "تغییر از دیروز",
          items: changedSinceYesterday.map((c) => ({
            id: c.id,
            title: c.title,
            detail: c.detail,
            tone:
              c.tone === "critical" || c.tone === "high"
                ? c.tone
                : c.tone === "healthy"
                  ? "healthy"
                  : "medium",
            query: `درباره «${c.title}» توضیح بده و بگو آیا امروز اقدام لازم است.`,
          })),
        },
        ...(pendingIntel.length
          ? [
              {
                title: "پیشنهادهای هوشمند سازمان",
                items: pendingIntel.slice(0, 4).map((r) => ({
                  id: r.id,
                  title: r.title,
                  detail: r.explanation,
                  meta: r.kind === "workflow" ? "گردش‌کار" : "داشبورد",
                  tone: "medium" as const,
                  query: `پیشنهاد «${r.title}» را از منظر ارزش کسب‌وکار توضیح بده.`,
                })),
              },
            ]
          : []),
      ]}
    />
  );
}
