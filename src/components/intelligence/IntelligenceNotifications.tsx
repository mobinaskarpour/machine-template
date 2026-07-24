"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, LayoutDashboard, X } from "lucide-react";
import type { IntelligenceRecommendation } from "@/types/intelligence";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Max 1 Workflow + 1 Dashboard — ~40% smaller premium toast cards */
export function IntelligenceNotifications({
  items,
  onCreate,
  onDismiss,
}: {
  items: IntelligenceRecommendation[];
  onCreate: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const workflow = items.find((i) => i.kind === "workflow");
  const dashboard = items.find((i) => i.kind === "dashboard");
  const visible = [dashboard, workflow].filter(
    Boolean
  ) as IntelligenceRecommendation[];

  if (!visible.length) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-1.5 max-w-[220px] w-full pointer-events-none md:left-24">
      <AnimatePresence mode="popLayout">
        {visible.map((item) => (
          <SuggestionCard
            key={item.id}
            item={item}
            onCreate={onCreate}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SuggestionCard({
  item,
  onCreate,
  onDismiss,
}: {
  item: IntelligenceRecommendation;
  onCreate: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const isDash = item.kind === "dashboard";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.99 }}
      transition={spring.panel}
      className={cn(
        "pointer-events-auto rounded-[10px] border backdrop-blur-xl px-2.5 py-2 shadow-[var(--shadow-sm)]",
        isDash ? "border-accent/30 bg-panel/95" : "border-primary/30 bg-panel/95"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border",
            isDash
              ? "border-accent/30 bg-accent-soft text-accent"
              : "border-primary/30 bg-primary-soft text-primary"
          )}
        >
          {isDash ? (
            <LayoutDashboard size={10} strokeWidth={1.6} />
          ) : (
            <GitBranch size={10} strokeWidth={1.6} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-[11px] font-semibold text-text-primary leading-snug line-clamp-1">
              {item.title}
            </h3>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="shrink-0 text-text-tertiary hover:text-text-secondary cursor-pointer"
              aria-label="بستن"
            >
              <X size={10} strokeWidth={1.6} />
            </button>
          </div>

          <p className="mt-0.5 text-[9px] text-text-tertiary leading-snug line-clamp-1">
            {item.explanation}
          </p>
          <p className="mt-0.5 text-[9px] text-text-secondary leading-snug line-clamp-1">
            {item.businessImpact}
          </p>

          <button
            type="button"
            onClick={() => onCreate(item.id)}
            className={cn(
              "mt-1.5 w-full rounded-[6px] px-2 py-1 text-[10px] font-medium cursor-pointer transition-opacity hover:opacity-90",
              isDash
                ? "bg-accent text-void"
                : "bg-primary text-text-inverse"
            )}
          >
            ایجاد
          </button>
        </div>
      </div>
    </motion.article>
  );
}
