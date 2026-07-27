"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, LayoutDashboard } from "lucide-react";
import type { DiscoveryCard, ExecutiveReport } from "@/types/ai";
import { InsightBlockView } from "./InsightBlockView";
import { VisualExperienceGrid } from "./VisualExperienceCard";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { orgDashboards, orgWorkflows } from "@/config/capabilities";

export function ExecutiveReportView({
  report,
  onFollowUp,
}: {
  report: ExecutiveReport;
  onFollowUp: (q: string) => void;
}) {
  const discoveries = report.discoveries ?? [];

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={spring.soft}
      className="space-y-6"
    >
      {report.memoryNote && (
        <motion.p
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, ...spring.gentle }}
          className="rounded-[12px] border border-accent/20 bg-accent-soft/50 px-4 py-3 text-[13px] text-accent leading-relaxed"
        >
          {report.memoryNote}
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.08, ...spring.soft }}
        className="text-[20px] md:text-[24px] font-semibold leading-relaxed text-text-primary max-w-3xl"
      >
        {report.content}
      </motion.p>

      {report.visuals && report.visuals.length > 0 && (
        <VisualExperienceGrid visuals={report.visuals} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.blocks.slice(0, 6).map((block, i) => (
          <InsightBlockView key={block.id} block={block} index={i} />
        ))}
      </div>

      {discoveries.length > 0 && (
        <DiscoveryStrip discoveries={discoveries} />
      )}

      {report.followUps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ...spring.soft }}
          className="pt-2"
        >
          <p className="mb-3 text-[12px] font-medium text-text-tertiary">
            ادامه جلسه
          </p>
          <div className="flex flex-col gap-2">
            {report.followUps.map((q, i) => (
              <motion.button
                key={q}
                type="button"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06, ...spring.gentle }}
                whileHover={{ x: -3, transition: spring.gentle }}
                onClick={() => onFollowUp(q)}
                className={cn(
                  "text-right rounded-[10px] border border-etch bg-slab/60 px-4 py-3",
                  "text-[14px] text-text-secondary cursor-pointer",
                  "hover:border-border-hover hover:text-text-primary hover:bg-slab-raised transition-colors duration-[120ms]"
                )}
              >
                {q}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

function DiscoveryStrip({ discoveries }: { discoveries: DiscoveryCard[] }) {
  const router = useRouter();
  const dash = discoveries.find((d) => d.type === "dashboard");
  const wf = discoveries.find((d) => d.type === "workflow");
  const pair = [dash, wf].filter(Boolean) as DiscoveryCard[];

  if (!pair.length) return null;

  return (
    <div className="rounded-[14px] border border-accent/25 bg-accent-soft/20 p-4">
      <p className="text-[11px] font-medium text-accent mb-3">
        پیشنهاد هوشمند — فقط بهترین داشبورد و گردش‌کار
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pair.map((d) => {
          const isDash = d.type === "dashboard";
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                if (isDash) {
                  const id =
                    orgDashboards.find((x) => x.name.includes("ریسک"))?.id ??
                    "db-risk";
                  router.push(`/dashboards/${id}`);
                } else {
                  const id =
                    orgWorkflows.find((x) => x.domain === "delay")?.id ??
                    "wf-delay";
                  router.push(`/workflows/${id}`);
                }
              }}
              className={cn(
                "text-right rounded-[10px] border px-3 py-2.5 cursor-pointer hover:opacity-95",
                isDash
                  ? "border-accent/30 bg-slab/80"
                  : "border-primary/30 bg-slab/80"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {isDash ? (
                  <LayoutDashboard size={12} className="text-accent" />
                ) : (
                  <GitBranch size={12} className="text-primary" />
                )}
                <span className="text-[12px] font-semibold text-text-primary truncate">
                  {d.title}
                </span>
              </div>
              <p className="text-[10px] text-text-tertiary line-clamp-1">
                {d.reason}
              </p>
              <p className="mt-1 text-[10px] text-text-secondary line-clamp-1">
                {d.businessValue}
              </p>
              <span
                className={cn(
                  "mt-2 inline-block text-[10px] font-medium",
                  isDash ? "text-accent" : "text-primary"
                )}
              >
                {d.cta || "ایجاد"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
