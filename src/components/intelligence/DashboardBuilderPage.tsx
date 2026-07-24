"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/shell/AppShell";
import { useIntelligenceStore } from "@/store/intelligence-store";
import { spring, stagger, chartForm } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DashboardWidget } from "@/types/intelligence";
import { Sparkles } from "lucide-react";

export function DashboardBuilderPage({
  recommendationId,
}: {
  recommendationId: string;
}) {
  const router = useRouter();
  const rec = useIntelligenceStore((s) => s.getById(recommendationId));
  const dashboard = rec?.dashboard;

  if (!dashboard || rec?.status !== "approved") {
    return (
      <AppShell pageTitle="سازنده داشبورد اجرایی">
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-[15px] text-text-secondary">
            داشبورد تأییدشده‌ای برای نمایش نیست
          </p>
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="rounded-[10px] bg-accent px-4 py-2.5 text-[13px] text-void cursor-pointer"
          >
            بازگشت به فضای کار
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={dashboard.name}>
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1200px] mx-auto pb-24">
        <motion.header
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={spring.soft}
          className="mb-10"
        >
          <p className="text-[13px] text-text-tertiary">سازنده داشبورد اجرایی</p>
          <h1 className="mt-2 text-[32px] font-semibold text-text-primary">
            {dashboard.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {dashboard.whyMonitor}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-text-tertiary">
            <span>به‌روزرسانی: {dashboard.updateFrequency}</span>
            <span>·</span>
            <span>واحدها: {dashboard.departments.join("، ")}</span>
          </div>
        </motion.header>

        <div className="mb-8 rounded-[14px] border border-accent/25 bg-accent-soft/50 px-5 py-4 flex gap-3">
          <Sparkles size={16} className="text-accent shrink-0 mt-0.5" strokeWidth={1.6} />
          <p className="text-[13px] text-text-secondary leading-relaxed">
            ویجت‌ها از الگوی گفتگوهای شما پیشنهاد شده‌اند. هر بلوک دلیل کسب‌وکاری
            دارد — بوم خالی وجود ندارد.
          </p>
        </div>

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {dashboard.widgets.map((widget, i) => (
            <WidgetCard key={widget.id} widget={widget} index={i} />
          ))}
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
            <p className="text-[12px] text-text-tertiary mb-3">
              سؤالاتی که پاسخ می‌دهد
            </p>
            <ul className="space-y-2">
              {dashboard.questionsAnswered.map((q) => (
                <li key={q} className="text-[13px] text-text-secondary">
                  · {q}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
            <p className="text-[12px] text-text-tertiary mb-3">شاخص‌های کلیدی</p>
            <div className="flex flex-wrap gap-2">
              {dashboard.keyKpis.map((k) => (
                <span
                  key={k}
                  className="rounded-[8px] border border-primary/25 bg-primary-soft px-3 py-1.5 text-[12px] text-primary"
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-text-secondary leading-relaxed">
              {dashboard.strategicImpact}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="mt-8 rounded-[10px] border border-etch px-4 py-3 text-[13px] text-text-secondary cursor-pointer hover:border-border-hover"
        >
          بازگشت به جلسه اجرایی
        </button>
      </div>
    </AppShell>
  );
}

function WidgetCard({
  widget,
  index,
}: {
  widget: DashboardWidget;
  index: number;
}) {
  return (
    <motion.article
      variants={stagger.item}
      className={cn(
        "rounded-[16px] border border-etch bg-slab/80 p-5 backdrop-blur-sm",
        widget.span === 2 && "md:col-span-2"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            {widget.title}
          </h3>
          <p className="mt-1 text-[12px] text-accent leading-relaxed">
            دلیل این نما: {widget.why}
          </p>
        </div>
        <span className="rounded-[6px] border border-etch px-2 py-0.5 text-[10px] text-text-tertiary">
          {widgetLabel(widget.kind)}
        </span>
      </div>
      <WidgetPreview kind={widget.kind} index={index} />
    </motion.article>
  );
}

function widgetLabel(kind: DashboardWidget["kind"]) {
  const map = {
    metric: "شاخص",
    river: "رودخانه",
    rings: "حلقه سلامت",
    matrix: "ماتریس",
    timeline: "محور زمان",
    list: "فهرست اولویت",
  };
  return map[kind];
}

function WidgetPreview({
  kind,
  index,
}: {
  kind: DashboardWidget["kind"];
  index: number;
}) {
  if (kind === "metric") {
    const samples = ["۱۸.۴ میلیارد", "۴۲٪", "۲۱ روز"];
    return (
      <motion.p
        className="text-[36px] font-semibold tabular-nums text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={chartForm(0.1 + index * 0.05)}
      >
        {samples[index % samples.length]}
      </motion.p>
    );
  }

  if (kind === "river") {
    const bars = [40, 55, 48, 62, 45, 70, 58, 64];
    return (
      <div className="flex items-end gap-1.5 h-24">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-[4px] bg-gradient-to-t from-primary/40 to-accent/30 origin-bottom"
            style={{ height: `${h}%` }}
            initial={{ scaleY: 0.4, opacity: 0.4 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={chartForm(0.08 + i * 0.04)}
          />
        ))}
      </div>
    );
  }

  if (kind === "rings") {
    return (
      <div className="flex gap-4">
        {[72, 48, 86].map((v, i) => (
          <div key={i} className="relative h-16 w-16">
            <svg width="64" height="64" className="-rotate-90">
              <circle
                cx="32"
                cy="32"
                r="24"
                fill="none"
                stroke="var(--etch-strong)"
                strokeWidth="4"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 24 * (1 - v / 100),
                }}
                transition={chartForm(0.15 + i * 0.08)}
              />
            </svg>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "matrix") {
    return (
      <div className="relative h-28 rounded-[10px] border border-etch bg-void/40">
        {[
          { x: 70, y: 65, s: 18 },
          { x: 40, y: 45, s: 14 },
          { x: 25, y: 20, s: 10 },
        ].map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-danger/40 bg-danger/20"
            style={{
              width: p.s,
              height: p.s,
              left: `${p.x}%`,
              bottom: `${p.y}%`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={chartForm(0.2 + i * 0.08)}
          />
        ))}
      </div>
    );
  }

  if (kind === "timeline") {
    return (
      <div className="space-y-2">
        {["شکستن شناوری", "تأخیر تأمین", "ظرفیت پیمانکار"].map((t, i) => (
          <motion.div
            key={t}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07, ...spring.gentle }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12px] text-text-tertiary w-28 shrink-0 truncate">
              {t}
            </span>
            <div className="h-2 flex-1 rounded-full bg-etch-strong overflow-hidden">
              <div
                className="h-full bg-accent/50 rounded-full"
                style={{ width: `${70 - i * 14}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {["برج آریا — بحرانی", "پارس — متوسط", "خط ۷ — پایدار"].map((t, i) => (
        <motion.li
          key={t}
          className="rounded-[8px] border border-etch px-3 py-2 text-[13px] text-text-secondary"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05, ...spring.gentle }}
        >
          {t}
        </motion.li>
      ))}
    </ul>
  );
}
