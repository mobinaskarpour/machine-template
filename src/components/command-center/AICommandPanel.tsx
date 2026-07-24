"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  LayoutDashboard,
} from "lucide-react";
import { spring, stagger, cardHover } from "@/lib/motion";
import { commandItems, type CommandItem } from "@/mock/command-center";
import { uiLabels } from "@/config/labels";
import { useCommandCenter } from "./CommandCenterContext";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  CommandItem["kind"],
  { label: string; Icon: typeof Sparkles; section: string }
> = {
  recommendation: {
    label: "پیشنهاد",
    Icon: Sparkles,
    section: uiLabels.recommendations,
  },
  investigation: {
    label: "بررسی",
    Icon: Search,
    section: uiLabels.investigations,
  },
  approval: {
    label: "تأیید",
    Icon: CheckCircle2,
    section: uiLabels.openApprovals,
  },
  risk: {
    label: "ریسک",
    Icon: AlertTriangle,
    section: uiLabels.detectedRisks,
  },
  workflow: {
    label: "گردش‌کار",
    Icon: GitBranch,
    section: uiLabels.pendingWorkflows,
  },
  dashboard: {
    label: "داشبورد",
    Icon: LayoutDashboard,
    section: uiLabels.pendingDashboards,
  },
};

const sections: CommandItem["kind"][] = [
  "recommendation",
  "investigation",
  "approval",
  "risk",
  "workflow",
  "dashboard",
];

export function AICommandPanel() {
  const router = useRouter();
  const { triggerPulse } = useCommandCenter();
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.35, ...spring.soft }}
      className="rounded-[18px] border border-etch bg-panel backdrop-blur-md p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-accent/30 bg-accent-soft">
          <Sparkles size={18} strokeWidth={1.6} className="text-accent" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">
            پنل فرمان اجرایی
          </h2>
          <p className="text-[13px] text-text-tertiary">
            سطح تصمیم — نه گفتگوی معمولی
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sections.map((kind) => {
          const items = commandItems.filter((i) => i.kind === kind);
          if (!items.length) return null;
          const meta = kindMeta[kind];

          return (
            <motion.div
              key={kind}
              variants={stagger.container}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <p className="text-[12px] font-medium text-text-tertiary flex items-center gap-2">
                <meta.Icon size={13} strokeWidth={1.6} className="text-accent" />
                {meta.section}
              </p>
              {items.map((item) => (
                <CommandRow
                  key={item.id}
                  item={item}
                  reduced={reduced}
                  onHover={() => {
                    if (item.kind === "risk" || item.kind === "approval")
                      triggerPulse("risk");
                    else if (
                      item.kind === "recommendation" &&
                      item.title.includes("وصول")
                    )
                      triggerPulse("cash");
                    else if (item.kind === "dashboard")
                      triggerPulse("cash");
                    else triggerPulse("portfolio");
                  }}
                  onActivate={() => {
                    if (item.kind === "risk" || item.kind === "approval")
                      triggerPulse("risk");
                    else if (
                      item.kind === "recommendation" &&
                      item.title.includes("وصول")
                    )
                      triggerPulse("cash");
                    else if (item.kind === "dashboard")
                      triggerPulse("cash");
                    else triggerPulse("portfolio");
                    router.push(
                      `/chat?q=${encodeURIComponent(item.title)}`
                    );
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function CommandRow({
  item,
  reduced,
  onActivate,
  onHover,
}: {
  item: CommandItem;
  reduced: boolean;
  onActivate: () => void;
  onHover: () => void;
}) {
  const meta = kindMeta[item.kind];

  return (
    <motion.button
      type="button"
      variants={stagger.item}
      whileHover={reduced ? undefined : cardHover}
      onClick={onActivate}
      onMouseEnter={onHover}
      className={cn(
        "w-full text-right rounded-[12px] border border-etch bg-slab/80 px-4 py-3.5 cursor-pointer",
        "transition-colors duration-[120ms] hover:border-border-hover hover:bg-slab-raised",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
        item.priority === "urgent" && "border-danger/30 bg-danger-soft/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "shrink-0 rounded-[6px] px-2 py-0.5 text-[10px] font-medium",
            item.priority === "urgent"
              ? "bg-danger/15 text-danger"
              : item.priority === "high"
                ? "bg-warning/15 text-warning"
                : "bg-hover text-text-tertiary"
          )}
        >
          {meta.label}
        </span>
        {item.impact && (
          <span className="text-[11px] text-primary tabular-nums">
            {item.impact}
          </span>
        )}
      </div>
      <p className="mt-2 text-[14px] font-medium text-text-primary leading-snug">
        {item.title}
      </p>
      <p className="mt-1 text-[12px] text-text-tertiary leading-relaxed">
        {item.detail}
      </p>
    </motion.button>
  );
}
