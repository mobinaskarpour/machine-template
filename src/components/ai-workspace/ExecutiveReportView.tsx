"use client";

import { motion } from "framer-motion";
import type { ExecutiveReport } from "@/types/ai";
import { InsightBlockView } from "./InsightBlockView";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ExecutiveReportView({
  report,
  onFollowUp,
}: {
  report: ExecutiveReport;
  onFollowUp: (q: string) => void;
}) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.blocks.map((block, i) => (
          <InsightBlockView key={block.id} block={block} index={i} />
        ))}
      </div>

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
