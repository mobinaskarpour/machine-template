"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, LayoutDashboard, X } from "lucide-react";
import type { IntelligenceRecommendation } from "@/types/intelligence";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";

export function IntelligenceNotifications({
  items,
  onReview,
  onDefer,
  onDismiss,
}: {
  items: IntelligenceRecommendation[];
  onReview: (id: string) => void;
  onDefer: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const workflows = items.filter((i) => i.kind === "workflow");
  const dashboards = items.filter((i) => i.kind === "dashboard");

  if (!items.length) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3 max-w-[360px] w-full pointer-events-none md:left-24">
      <AnimatePresence mode="popLayout">
        {/* Dashboards and workflows rendered as independent stacks */}
        {dashboards.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            onReview={onReview}
            onDefer={onDefer}
            onDismiss={onDismiss}
          />
        ))}
        {workflows.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            onReview={onReview}
            onDefer={onDefer}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function RecommendationCard({
  item,
  onReview,
  onDefer,
  onDismiss,
}: {
  item: IntelligenceRecommendation;
  onReview: (id: string) => void;
  onDefer: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const isDash = item.kind === "dashboard";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.99 }}
      transition={spring.panel}
      className={cn(
        "pointer-events-auto rounded-[16px] border backdrop-blur-xl p-5 shadow-[var(--shadow-md)]",
        isDash ? "border-accent/40 bg-panel" : "border-primary/40 bg-panel",
        item.status === "deferred" && "opacity-85 border-etch"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[10px] border",
              isDash
                ? "border-accent/30 bg-accent-soft text-accent"
                : "border-primary/30 bg-primary-soft text-primary"
            )}
          >
            {isDash ? (
              <LayoutDashboard size={16} strokeWidth={1.6} />
            ) : (
              <GitBranch size={16} strokeWidth={1.6} />
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium text-text-tertiary">
              {item.status === "deferred"
                ? "یادآوری هوشمند"
                : isDash
                  ? "پیشنهاد داشبورد اجرایی"
                  : "پیشنهاد گردش‌کار کسب‌وکار"}
            </p>
            <p className="text-[10px] text-text-tertiary/80 mt-0.5">
              بر اساس {toPersianDigits(item.concernCount)} گفتگوی مرتبط
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="text-text-tertiary hover:text-text-secondary cursor-pointer"
          aria-label="بستن"
        >
          <X size={14} strokeWidth={1.6} />
        </button>
      </div>

      <h3 className="mt-3 text-[16px] font-semibold text-text-primary leading-snug">
        {item.title}
      </h3>
      <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
        {item.explanation}
      </p>
      <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
        <span className="text-text-tertiary">اثر کسب‌وکار: </span>
        {item.businessImpact}
      </p>
      <p className="mt-1 text-[13px] text-primary leading-relaxed">
        <span className="text-text-tertiary">ارزش مورد انتظار: </span>
        {item.expectedValue}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onReview(item.id)}
          className={cn(
            "flex-1 rounded-[10px] px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-colors",
            isDash
              ? "bg-accent text-void hover:opacity-90"
              : "bg-primary text-text-inverse hover:opacity-90"
          )}
        >
          {item.primaryCta}
        </button>
        <button
          type="button"
          onClick={() => onDefer(item.id)}
          className="rounded-[10px] border border-etch px-3 py-2.5 text-[13px] text-text-tertiary cursor-pointer hover:border-etch-strong"
        >
          {item.secondaryCta}
        </button>
      </div>
    </motion.article>
  );
}
