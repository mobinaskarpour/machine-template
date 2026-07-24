"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { ExecutiveChart } from "@/components/dashboards/ExecutiveCharts";
import { useIntelligenceStore } from "@/store/intelligence-store";
import { spring, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DashboardWidget, WidgetKind } from "@/types/intelligence";

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
          className="mb-8"
        >
          <p className="text-[13px] text-text-tertiary">سازنده داشبورد اجرایی</p>
          <h1 className="mt-2 text-[32px] font-semibold text-text-primary">
            {dashboard.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {dashboard.aiBrief ?? dashboard.whyMonitor}
          </p>
        </motion.header>

        <div className="mb-6 rounded-[14px] border border-accent/25 bg-accent-soft/50 px-5 py-4 flex gap-3">
          <Sparkles
            size={16}
            className="text-accent shrink-0 mt-0.5"
            strokeWidth={1.6}
          />
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {dashboard.recommendedAction ?? dashboard.strategicImpact}
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
        "rounded-[14px] border border-etch bg-slab/80 p-5",
        widget.span === 2 && "md:col-span-2"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            {widget.title}
          </h3>
          <p className="mt-1 text-[12px] text-accent leading-relaxed">
            {widget.why}
          </p>
        </div>
        <span className="rounded-[6px] border border-etch px-2 py-0.5 text-[10px] text-text-tertiary">
          {widgetLabel(widget.kind)}
        </span>
      </div>
      <ExecutiveChart kind={widget.kind} seed={index} />
    </motion.article>
  );
}

function widgetLabel(kind: WidgetKind) {
  const map: Record<WidgetKind, string> = {
    metric: "شاخص",
    "kpi-row": "KPI",
    line: "روند",
    bar: "مقایسه",
    area: "ترکیبی",
    donut: "سهم",
    gauge: "گیج",
    heatmap: "گرما",
    waterfall: "آبشار",
    treemap: "درخت",
    timeline: "زمان",
    list: "اولویت",
    river: "رودخانه",
    rings: "حلقه",
    matrix: "ماتریس",
  };
  return map[kind];
}
