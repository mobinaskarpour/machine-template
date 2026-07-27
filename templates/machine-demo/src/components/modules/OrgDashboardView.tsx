"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Coins,
  GitBranch,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ExecutiveChart } from "@/components/dashboards/ExecutiveCharts";
import {
  getOrgDashboard,
  resolveDashboardBlueprint,
} from "@/config/capabilities";
import { pageLabels, uiLabels } from "@/config/labels";
import { spring, stagger } from "@/lib/motion";
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

  const rootCause = blueprint.rootCause ?? [];
  const risks = blueprint.relatedRisks ?? [];

  return (
    <AppShell pageTitle={org.name}>
      <div className="px-5 py-7 md:px-10 max-w-[1180px] mx-auto pb-28">
        <button
          type="button"
          onClick={() => router.push("/dashboards")}
          className="inline-flex items-center gap-2 text-[13px] text-text-tertiary hover:text-text-secondary cursor-pointer mb-5"
        >
          <ArrowLeft size={14} className="rotate-180" />
          همه داشبوردها
        </button>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-6"
        >
          <p className="text-[12px] text-text-tertiary">
            فضای تحلیل اجرایی · {session.asOfLabel}
          </p>
          <h1 className="mt-1.5 text-[28px] md:text-[32px] font-semibold text-text-primary tracking-tight">
            {org.name}
          </h1>
          <p className="mt-2 text-[13px] text-text-tertiary">
            {org.question} · به‌روزرسانی {blueprint.updateFrequency}
          </p>
        </motion.header>

        {/* AI Executive Brief */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-6 rounded-[14px] border border-accent/30 bg-gradient-to-l from-accent-soft/40 to-slab/80 p-5 md:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-accent/30 bg-void/40 text-accent">
              <Sparkles size={15} strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-accent mb-1.5">
                خلاصه اجرایی هوش مصنوعی
              </p>
              <p className="text-[15px] text-text-primary leading-relaxed">
                {blueprint.aiBrief ?? blueprint.whyMonitor}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Charts grid */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          {blueprint.widgets.map((w, i) => (
            <WidgetBlock key={w.id} widget={w} index={i} />
          ))}
        </motion.div>

        {/* Historical trend */}
        <section className="mb-6 rounded-[14px] border border-etch bg-slab/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-text-tertiary" />
            <h2 className="text-[13px] font-medium text-text-tertiary">
              روندهای تاریخی
            </h2>
          </div>
          <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
            {blueprint.historicalTrend}
          </p>
          <ExecutiveChart kind="area" seed={3} />
        </section>

        {/* Decision intelligence panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InsightCard
            icon={<Target size={14} />}
            title="تحلیل ریشه"
            items={rootCause}
          />
          <InsightCard
            icon={<AlertTriangle size={14} />}
            title="ریسک‌های مرتبط"
            items={risks}
          />
          <ImpactCard
            icon={<Coins size={14} />}
            title="اثر مالی"
            body={blueprint.financialImpact ?? ""}
          />
          <ImpactCard
            icon={<GitBranch size={14} />}
            title="اثر عملیاتی"
            body={blueprint.operationalImpact ?? ""}
          />
        </div>

        {/* Recommended action + related workflow */}
        <section className="rounded-[14px] border border-primary/35 bg-primary-soft/30 p-5 md:p-6 mb-8">
          <p className="text-[11px] font-medium text-primary mb-2">
            اقدام اجرایی پیشنهادی
          </p>
          <p className="text-[15px] text-text-primary leading-relaxed mb-5">
            {blueprint.recommendedAction}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/workflows/${org.relatedWorkflowId}`)
              }
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-medium text-text-inverse cursor-pointer"
            >
              <GitBranch size={14} strokeWidth={1.6} />
              {uiLabels.openWorkflow} مرتبط
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/chat?q=${encodeURIComponent(org.question)}`
                )
              }
              className="inline-flex items-center gap-2 rounded-[10px] border border-etch px-5 py-2.5 text-[13px] text-text-secondary cursor-pointer hover:border-border-hover"
            >
              <Sparkles size={14} className="text-accent" strokeWidth={1.6} />
              جلسه روی این موضوع
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-[10px] border border-etch px-5 py-2.5 text-[13px] text-text-tertiary cursor-pointer"
            >
              بازگشت به {pageLabels.home}
            </button>
          </div>
        </section>
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
        "rounded-[14px] border border-etch bg-slab/80 p-4 md:p-5",
        widget.span === 2 && "md:col-span-2"
      )}
    >
      <h3 className="text-[14px] font-semibold text-text-primary">
        {widget.title}
      </h3>
      <p className="mt-1 text-[11px] text-accent leading-relaxed">
        {widget.why}
      </p>
      <div className="mt-4">
        <ExecutiveChart kind={widget.kind} seed={index} />
      </div>
    </motion.article>
  );
}

function InsightCard({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
      <div className="flex items-center gap-2 mb-3 text-text-tertiary">
        {icon}
        <h2 className="text-[13px] font-medium">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-[13px] text-text-secondary leading-relaxed before:content-['·'] before:ml-2 before:text-accent"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImpactCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
      <div className="flex items-center gap-2 mb-3 text-text-tertiary">
        {icon}
        <h2 className="text-[13px] font-medium">{title}</h2>
      </div>
      <p className="text-[13px] text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}
