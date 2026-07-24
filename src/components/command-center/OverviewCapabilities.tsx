"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, GitBranch } from "lucide-react";
import { useIntelligenceStore } from "@/store/intelligence-store";
import { orgDashboards, orgWorkflows } from "@/config/capabilities";
import { pageLabels } from "@/config/labels";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function OverviewCapabilities() {
  const router = useRouter();
  const recommendations = useIntelligenceStore((s) => s.recommendations);
  const recs = useMemo(
    () =>
      recommendations.filter(
        (r) =>
          r.status === "proposed" ||
          r.status === "reviewing" ||
          r.status === "deferred"
      ),
    [recommendations]
  );

  const attentionDash = orgDashboards
    .filter((d) => d.status === "attention")
    .slice(0, 2);
  const attentionWf = orgWorkflows
    .filter((w) => w.status === "attention")
    .slice(0, 2);

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">
            پیشنهادها و قابلیت‌های سازمان
          </h2>
          <p className="mt-1 text-[13px] text-text-tertiary">
            ورود سریع — جزئیات داخل داشبورد یا گردش‌کار است.
          </p>
        </div>
        <div className="flex gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => router.push("/dashboards")}
            className="text-accent hover:underline cursor-pointer"
          >
            {pageLabels.dashboards}
          </button>
          <button
            type="button"
            onClick={() => router.push("/workflows")}
            className="text-primary hover:underline cursor-pointer"
          >
            {pageLabels.workflows}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {attentionDash.map((d) => (
          <motion.button
            key={d.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.soft}
            onClick={() => router.push(`/dashboards/${d.id}`)}
            className={cn(
              "flex items-start gap-3 rounded-[14px] border border-accent/30 bg-accent-soft/40 px-4 py-4 text-right cursor-pointer",
              "hover:border-accent/50"
            )}
          >
            <LayoutDashboard size={16} className="mt-0.5 text-accent shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                {d.name}
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">{d.summary}</p>
            </div>
          </motion.button>
        ))}
        {attentionWf.map((w) => (
          <motion.button
            key={w.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.soft}
            onClick={() => router.push(`/workflows/${w.id}`)}
            className={cn(
              "flex items-start gap-3 rounded-[14px] border border-primary/30 bg-primary-soft px-4 py-4 text-right cursor-pointer",
              "hover:border-primary/50"
            )}
          >
            <GitBranch size={16} className="mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                {w.name}
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">{w.summary}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {recs.length > 0 && (
        <p className="mt-4 text-[13px] text-text-tertiary">
          {recs.length} پیشنهاد هوشمند جدید در فضای کار منتظر بازبینی است.
        </p>
      )}
    </section>
  );
}
