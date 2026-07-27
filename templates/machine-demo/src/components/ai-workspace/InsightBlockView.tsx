"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Briefcase,
  Wallet,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
  Building2,
  Users,
  ScrollText,
  Truck,
} from "lucide-react";
import type { InsightBlock, RiskLevel } from "@/types/ai";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const kindConfig: Record<
  InsightBlock["kind"],
  { Icon: typeof FileText; accent: string }
> = {
  summary: { Icon: FileText, accent: "border-primary/30 bg-primary-soft" },
  "root-cause": { Icon: Search, accent: "border-accent/30 bg-accent-soft" },
  "business-impact": {
    Icon: Briefcase,
    accent: "border-warning/30 bg-warning-soft",
  },
  "financial-impact": {
    Icon: Wallet,
    accent: "border-primary/40 bg-primary-soft",
  },
  "operational-impact": {
    Icon: Wrench,
    accent: "border-accent/25 bg-accent-soft",
  },
  risk: { Icon: AlertTriangle, accent: "border-danger/35 bg-danger-soft" },
  decision: {
    Icon: CheckCircle2,
    accent: "border-primary/45 bg-primary-soft",
  },
  outcome: { Icon: Target, accent: "border-success/30 bg-success-soft" },
  opportunity: {
    Icon: Sparkles,
    accent: "border-success/35 bg-success-soft",
  },
  "related-projects": {
    Icon: Building2,
    accent: "border-etch bg-slab",
  },
  "related-contractors": {
    Icon: Users,
    accent: "border-etch bg-slab",
  },
  "related-contracts": {
    Icon: ScrollText,
    accent: "border-etch bg-slab",
  },
  "related-equipment": {
    Icon: Truck,
    accent: "border-etch bg-slab",
  },
};

const toneText: Record<RiskLevel, string> = {
  critical: "text-danger",
  high: "text-warning",
  medium: "text-accent",
  low: "text-success",
  healthy: "text-success",
};

export function InsightBlockView({
  block,
  index,
}: {
  block: InsightBlock;
  index: number;
}) {
  const cfg = kindConfig[block.kind];
  const Icon = cfg.Icon;
  const isRelated = block.kind.startsWith("related-");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.08 * index, ...spring.soft }}
      className={cn(
        "rounded-[14px] border px-5 py-4 backdrop-blur-sm",
        cfg.accent,
        block.kind === "decision" && "shadow-[0_0_24px_var(--glow-primary)]",
        block.kind === "financial-impact" && "md:col-span-2"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={15} strokeWidth={1.6} className="text-text-secondary" />
          <h3 className="text-[13px] font-medium text-text-tertiary">
            {block.title}
          </h3>
        </div>
        {block.meta && (
          <span
            className={cn(
              "text-[14px] font-semibold tabular-nums shrink-0",
              block.tone ? toneText[block.tone] : "text-primary"
            )}
          >
            {block.meta}
          </span>
        )}
      </div>

      {block.body ? (
        <p
          className={cn(
            "mt-3 leading-relaxed",
            block.kind === "summary" || block.kind === "decision"
              ? "text-[16px] text-text-primary"
              : "text-[14px] text-text-secondary"
          )}
        >
          {block.body}
        </p>
      ) : null}

      {isRelated && block.items && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {block.items.map((item) => (
            <li
              key={item}
              className="rounded-[8px] border border-etch bg-void/40 px-3 py-1.5 text-[12px] text-text-secondary"
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {!isRelated && block.items && (
        <ul className="mt-3 space-y-1.5">
          {block.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[13px] text-text-secondary"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}
