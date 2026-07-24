"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, GitBranch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import {
  getOrgDashboard,
  resolveDashboardBlueprint,
} from "@/config/capabilities";
import { pageLabels, uiLabels } from "@/config/labels";
import { spring, stagger, chartForm } from "@/lib/motion";
import { useSessionStore } from "@/store/session-store";
import { cn } from "@/lib/utils";
import type { DashboardWidget } from "@/types/intelligence";

export function OrgDashboardView({ dashboardId }: { dashboardId: string }) {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const org = getOrgDashboard(dashboardId);
  const blueprint = resolveDashboardBlueprint(dashboardId);

  if (!org || !blueprint) {
    return (
      <AppShell pageTitle={pageLabels.dashboards}>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-[15px] text-text-secondary">داشبورد یافت نشد</p>
          <button
            type="button"
            onClick={() => router.push("/dashboards")}
            className="rounded-[10px] bg-accent px-4 py-2.5 text-[13px] text-void cursor-pointer"
          >
            بازگشت به فهرست داشبوردها
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={org.name}>
      <div className="px-5 py-8 md:px-10 max-w-[1100px] mx-auto pb-28">
        <button
          type="button"
          onClick={() => router.push("/dashboards")}
          className="inline-flex items-center gap-2 text-[13px] text-text-tertiary hover:text-text-secondary cursor-pointer mb-6"
        >
          <ArrowLeft size={14} className="rotate-180" />
          همه داشبوردها
        </button>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-8"
        >
          <p className="text-[12px] text-text-tertiary">
            داشبورد تخصصی · {session.asOfLabel}
          </p>
          <h1 className="mt-2 text-[30px] font-semibold text-text-primary">
            {org.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {blueprint.whyMonitor}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-text-tertiary">
            <span>سؤال محوری: {org.question}</span>
            <span>·</span>
            <span>به‌روزرسانی: {blueprint.updateFrequency}</span>
          </div>
        </motion.header>

        <div className="mb-6 rounded-[12px] border border-etch bg-void/30 px-4 py-3">
          <p className="text-[12px] text-text-tertiary mb-2">سؤالاتی که پاسخ می‌دهد</p>
          <ul className="flex flex-wrap gap-2">
            {blueprint.questionsAnswered.map((q) => (
              <li
                key={q}
                className="rounded-[8px] border border-etch px-3 py-1.5 text-[12px] text-text-secondary"
              >
                {q}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {blueprint.widgets.map((w, i) => (
            <WidgetBlock key={w.id} widget={w} index={i} />
          ))}
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/workflows/${org.relatedWorkflowId}`)
            }
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[14px] font-medium text-text-inverse cursor-pointer"
          >
            <GitBranch size={15} strokeWidth={1.6} />
            {uiLabels.openWorkflow} مرتبط
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/chat?q=${encodeURIComponent(org.question)}`
              )
            }
            className="inline-flex items-center gap-2 rounded-[10px] border border-etch px-5 py-3 text-[14px] text-text-secondary cursor-pointer hover:border-border-hover"
          >
            <Sparkles size={15} className="text-accent" strokeWidth={1.6} />
            جلسه روی این موضوع
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-[10px] border border-etch px-5 py-3 text-[14px] text-text-tertiary cursor-pointer"
          >
            بازگشت به {pageLabels.home}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function WidgetBlock({
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
        "rounded-[16px] border border-etch bg-slab/80 p-5",
        widget.span === 2 && "md:col-span-2"
      )}
    >
      <h3 className="text-[15px] font-semibold text-text-primary">
        {widget.title}
      </h3>
      <p className="mt-1 text-[12px] text-accent leading-relaxed">
        {widget.why}
      </p>
      <div className="mt-4">
        <MiniPreview kind={widget.kind} index={index} />
      </div>
    </motion.article>
  );
}

function MiniPreview({
  kind,
  index,
}: {
  kind: DashboardWidget["kind"];
  index: number;
}) {
  if (kind === "metric") {
    const samples = ["۱۸.۴ میلیارد", "۴۲٪", "۲۱ روز"];
    return (
      <p className="text-[32px] font-semibold tabular-nums text-text-primary">
        {samples[index % samples.length]}
      </p>
    );
  }
  if (kind === "river") {
    const bars = [40, 55, 48, 62, 45, 70, 58];
    return (
      <div className="flex items-end gap-1.5 h-20">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-[4px] bg-gradient-to-t from-primary/40 to-accent/30 origin-bottom"
            style={{ height: `${h}%` }}
            initial={{ scaleY: 0.4, opacity: 0.5 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={chartForm(0.05 * i)}
          />
        ))}
      </div>
    );
  }
  if (kind === "list") {
    return (
      <ul className="space-y-2">
        {["اولویت اول — بحرانی", "اولویت دوم — متوسط", "پایدار"].map((t) => (
          <li
            key={t}
            className="rounded-[8px] border border-etch px-3 py-2 text-[13px] text-text-secondary"
          >
            {t}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="h-20 rounded-[10px] border border-etch bg-void/40 flex items-center justify-center text-[12px] text-text-tertiary">
      نمای {kind === "rings" ? "حلقه سلامت" : kind === "matrix" ? "ماتریس" : "زمان"}
    </div>
  );
}
