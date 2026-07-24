"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, ArrowLeft, Search } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { pageLabels, uiLabels } from "@/config/labels";
import {
  orgWorkflows,
  statusLabel,
  type CapabilityStatus,
} from "@/config/capabilities";
import {
  getWorkflowRuntime,
  runStatusLabel,
  workflowCategories,
} from "@/mock/workflow-runtime";
import { spring, stagger } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";
import { useIntelligenceStore } from "@/store/intelligence-store";

const statusTone: Record<CapabilityStatus, string> = {
  active: "border-success/25 text-success bg-success-soft/40",
  attention: "border-warning/30 text-warning bg-warning-soft/40",
  proposed: "border-accent/25 text-accent bg-accent-soft/40",
};

const runTone = {
  running: "text-accent",
  idle: "text-text-tertiary",
  attention: "text-warning",
  completed: "text-success",
  failed: "text-danger",
};

export function WorkflowsLibraryPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("همه");
  const [statusFilter, setStatusFilter] = useState<"all" | CapabilityStatus>(
    "all"
  );

  const recommendations = useIntelligenceStore((s) => s.recommendations);
  const proposed = useMemo(() => {
    const list = recommendations.filter(
      (r) =>
        r.kind === "workflow" &&
        (r.status === "proposed" ||
          r.status === "reviewing" ||
          r.status === "deferred")
    );
    return list.slice(0, 1);
  }, [recommendations]);

  const filtered = useMemo(() => {
    return orgWorkflows.filter((wf) => {
      const runtime = getWorkflowRuntime(wf.id, wf.domain, wf.name);
      const q = query.trim();
      const matchQ =
        !q ||
        wf.name.includes(q) ||
        wf.summary.includes(q) ||
        runtime.owner.includes(q);
      const matchCat = category === "همه" || runtime.category === category;
      const matchStatus =
        statusFilter === "all" || wf.status === statusFilter;
      return matchQ && matchCat && matchStatus;
    });
  }, [query, category, statusFilter]);

  return (
    <AppShell pageTitle={pageLabels.workflows}>
      <div className="px-5 py-8 md:px-10 max-w-[1100px] mx-auto pb-28">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-8"
        >
          <p className="text-[13px] text-text-tertiary">عملیات کسب‌وکار</p>
          <h1 className="mt-2 text-[clamp(26px,3.5vw,34px)] font-semibold text-text-primary">
            گردش‌کارهای سازمان
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            فهرست، وضعیت اجرا، مالک، گام‌ها و تاریخچه — سپس نقشه فرآیند و ویرایشگر
            گره.
          </p>
        </motion.header>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی گردش‌کار، مالک یا هدف…"
              className="w-full rounded-[10px] border border-etch bg-slab/70 py-2.5 pr-9 pl-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-hover"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "active", "attention", "proposed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-[8px] border px-2.5 py-1.5 text-[11px] cursor-pointer",
                  statusFilter === s
                    ? "border-primary/40 text-primary bg-primary-soft"
                    : "border-etch text-text-tertiary hover:border-border-hover"
                )}
              >
                {s === "all" ? "همه وضعیت‌ها" : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          {workflowCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-[8px] border px-3 py-1.5 text-[12px] cursor-pointer",
                category === c
                  ? "border-accent/40 text-accent bg-accent-soft"
                  : "border-etch text-text-tertiary hover:border-border-hover"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {proposed.length > 0 && (
          <section className="mb-8 rounded-[14px] border border-primary/25 bg-primary-soft/40 px-5 py-4">
            <p className="text-[13px] font-medium text-primary mb-2">
              پیشنهاد هوشمند — بهترین گردش‌کار
            </p>
            {proposed.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => router.push("/chat")}
                className="text-[14px] text-text-secondary hover:text-text-primary cursor-pointer text-right"
              >
                {r.title} — از فضای کار ایجاد کنید
              </button>
            ))}
          </section>
        )}

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filtered.map((wf) => {
            const runtime = getWorkflowRuntime(wf.id, wf.domain, wf.name);
            return (
              <motion.button
                key={wf.id}
                type="button"
                variants={stagger.item}
                onClick={() => router.push(`/workflows/${wf.id}`)}
                className={cn(
                  "w-full text-right rounded-[14px] border border-etch bg-slab/80 px-5 py-5 cursor-pointer",
                  "hover:border-border-hover transition-colors duration-[120ms]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary-soft text-primary">
                      <GitBranch size={16} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-semibold text-text-primary truncate">
                        {wf.name}
                      </h2>
                      <p className="mt-0.5 text-[12px] text-text-tertiary">
                        {runtime.category} · {runtime.owner}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-[8px] border px-2 py-0.5 text-[11px]",
                      statusTone[wf.status]
                    )}
                  >
                    {statusLabel[wf.status]}
                  </span>
                </div>
                <p className="mt-3 text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                  {wf.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-text-tertiary">
                  <span className={runTone[runtime.runStatus]}>
                    {runStatusLabel[runtime.runStatus]}
                  </span>
                  <span>{toPersianDigits(runtime.stepsCount)} گام</span>
                  <span>آخرین اجرا: {runtime.lastRunLabel}</span>
                  <span>
                    موفقیت {toPersianDigits(runtime.successRate)}٪
                  </span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-primary">
                  {uiLabels.openWorkflow}
                  <ArrowLeft size={13} className="rotate-180" />
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {!filtered.length && (
          <p className="mt-8 text-[14px] text-text-tertiary text-center">
            گردش‌کاری با این فیلتر یافت نشد.
          </p>
        )}

        <p className="mt-8 text-[13px] text-text-tertiary">
          برای نمای کلی سازمان به{" "}
          <Link href="/" className="text-primary hover:underline">
            {pageLabels.home}
          </Link>{" "}
          بازگردید.
        </p>
      </div>
    </AppShell>
  );
}
