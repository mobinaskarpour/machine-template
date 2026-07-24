"use client";

import { ExecutiveDomainPage } from "./ExecutiveDomainPage";
import { projects, insights } from "@/mock/command-center";
import { toPersianDigits } from "@/lib/persian";

export function PortfolioModule() {
  return (
    <ExecutiveDomainPage
      title="پورتفویو"
      eyebrow="دید پورتفویو"
      headline="کدام پروژه‌ها امروز توجه مدیرعامل را می‌طلبند؟"
      summary="تمرکز روی سلامت، شناوری و فشار مالی — نه فهرست کامل پروژه‌ها. هر مورد مسیر مستقیم به جلسه اجرایی دارد."
      primaryAction={{
        label: "تحلیل ریسک پورتفویو با هوش مصنوعی",
        query: "کدام پروژه بیشترین ریسک را دارد؟",
      }}
      sections={[
        {
          title: "پروژه‌های نیازمند تصمیم",
          items: projects.slice(0, 4).map((p) => ({
            id: p.id,
            title: p.name,
            detail: `${p.client} · ${p.riskLabel} · پیشرفت ${toPersianDigits(p.progress)}٪`,
            meta: p.financial,
            tone:
              p.risk === "critical" || p.risk === "high"
                ? p.risk
                : p.risk === "healthy"
                  ? "healthy"
                  : "medium",
            query: `وضعیت اجرایی و ریسک پروژه ${p.name} را خلاصه کن و یک اقدام پیشنهادی بده.`,
          })),
        },
        {
          title: "سیگنال‌های پورتفویو",
          items: insights.slice(0, 3).map((ins) => ({
            id: ins.id,
            title: ins.title,
            detail: ins.story,
            meta: ins.value,
            tone: ins.tone === "low" ? "healthy" : ins.tone,
            query: `درباره «${ins.title}» توضیح بده و اثر تصمیم را مشخص کن.`,
          })),
        },
      ]}
    />
  );
}
