"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { pageLabels, uiLabels } from "@/config/labels";
import {
  orgDashboards,
  statusLabel,
  type CapabilityStatus,
} from "@/config/capabilities";
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

export function DashboardsLibraryPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const recommendations = useIntelligenceStore((s) => s.recommendations);
  const proposed = useMemo(
    () =>
      recommendations.filter(
        (r) =>
          r.kind === "dashboard" &&
          (r.status === "proposed" ||
            r.status === "reviewing" ||
            r.status === "deferred")
      ),
    [recommendations]
  );

  return (
    <AppShell pageTitle={pageLabels.dashboards}>
      <div className="px-5 py-8 md:px-10 max-w-[1100px] mx-auto pb-28">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-10"
        >
          <p className="text-[13px] text-text-tertiary">پایش پیوسته</p>
          <h1 className="mt-2 text-[clamp(26px,3.5vw,34px)] font-semibold text-text-primary">
            داشبوردهای سازمان
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            هر داشبورد به یک سؤال اجرایی تکراری پاسخ می‌دهد. جزئیات اینجا نیست —
            برای عمق، وارد داشبورد تخصصی شوید.
          </p>
          <p className="mt-2 text-[13px] text-text-tertiary">
            {toPersianDigits(orgDashboards.length)} داشبورد فعال در سازمان
          </p>
        </motion.header>

        {proposed.length > 0 && (
          <section className="mb-10 rounded-[14px] border border-accent/25 bg-accent-soft/30 px-5 py-4">
            <p className="text-[13px] font-medium text-accent mb-2">
              پیشنهادهای هوشمند جدید
            </p>
            <ul className="space-y-2">
              {proposed.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => router.push("/chat")}
                    className="text-[14px] text-text-secondary hover:text-text-primary cursor-pointer text-right"
                  >
                    {r.title} — از فضای کار بررسی کنید
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {orgDashboards.map((db) => (
            <motion.button
              key={db.id}
              type="button"
              variants={stagger.item}
              onClick={() => router.push(`/dashboards/${db.id}`)}
              className={cn(
                "w-full text-right rounded-[14px] border border-etch bg-slab/80 px-5 py-5 cursor-pointer",
                "hover:border-border-hover transition-colors duration-[120ms]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-accent/30 bg-accent-soft text-accent">
                    <LayoutDashboard size={16} strokeWidth={1.6} />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-text-primary">
                      {db.name}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">
                      {db.question}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-[8px] border px-2 py-0.5 text-[11px]",
                    statusTone[db.status]
                  )}
                >
                  {statusLabel[db.status]}
                </span>
              </div>
              <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
                {db.summary}
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent">
                {uiLabels.openDashboard}
                <ArrowLeft size={13} className="rotate-180" />
              </p>
            </motion.button>
          ))}
        </motion.div>

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
