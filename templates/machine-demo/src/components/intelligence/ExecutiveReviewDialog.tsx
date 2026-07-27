"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, LayoutDashboard, X } from "lucide-react";
import type { IntelligenceRecommendation } from "@/types/intelligence";
import { spring, timing } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";
import { useReducedMotion } from "@/components/motion";

export function ExecutiveReviewDialog({
  recommendation,
  open,
  onClose,
  onApprove,
  onDefer,
}: {
  recommendation: IntelligenceRecommendation | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDefer: (id: string) => void;
}) {
  const rec = recommendation;
  const isDash = rec?.kind === "dashboard";
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button:last-of-type, button")
        ?.focus();
      // Prefer primary approve in footer
      const approve = panelRef.current?.querySelector<HTMLElement>(
        "[data-approve]"
      );
      approve?.focus();
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && rec && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-overlay backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: timing.panel * 0.5 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="fixed inset-4 md:inset-auto md:top-[8%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-[75] max-h-[84vh] overflow-y-auto rounded-[18px] border border-etch-strong bg-slab shadow-[var(--shadow-md)]"
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={spring.panel}
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-etch bg-slab/95 backdrop-blur-md px-6 py-5">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 items-center justify-center rounded-[10px] border",
                    isDash
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-primary/30 bg-primary-soft text-primary"
                  )}
                >
                  {isDash ? (
                    <LayoutDashboard size={18} strokeWidth={1.6} />
                  ) : (
                    <GitBranch size={18} strokeWidth={1.6} />
                  )}
                </div>
                <div>
                  <p className="text-[12px] text-text-tertiary">
                    {isDash ? "بازبینی داشبورد اجرایی" : "بازبینی گردش‌کار کسب‌وکار"}
                  </p>
                  <h2
                    id="review-title"
                    className="mt-1 text-[20px] font-semibold text-text-primary"
                  >
                    {rec.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-text-tertiary hover:text-text-secondary cursor-pointer"
                aria-label="بستن"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </header>

            <div className="px-6 py-6 space-y-6">
              {!isDash && rec.workflow && (
                <WorkflowReviewBody workflow={rec.workflow} />
              )}
              {isDash && rec.dashboard && (
                <DashboardReviewBody dashboard={rec.dashboard} />
              )}
            </div>

            <footer className="sticky bottom-0 flex flex-col sm:flex-row gap-2 border-t border-etch bg-slab/95 backdrop-blur-md px-6 py-4">
              <button
                type="button"
                data-approve
                onClick={() => onApprove(rec.id)}
                className={cn(
                  "flex-1 rounded-[10px] px-4 py-3 text-[14px] font-medium cursor-pointer",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
                  isDash
                    ? "bg-accent text-void"
                    : "bg-primary text-text-inverse shadow-[0_0_20px_var(--glow-primary)]"
                )}
              >
                {isDash ? "تأیید و گشودن سازنده داشبورد" : "تأیید و گشودن نقشه فرآیند"}
              </button>
              <button
                type="button"
                onClick={() => onDefer(rec.id)}
                className="rounded-[10px] border border-etch px-4 py-3 text-[14px] text-text-secondary cursor-pointer hover:border-etch-strong"
              >
                بعداً یادآوری کن
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function WorkflowReviewBody({
  workflow,
}: {
  workflow: NonNullable<IntelligenceRecommendation["workflow"]>;
}) {
  return (
    <>
      <Section title="هدف کسب‌وکار" body={workflow.objective} />
      <Section title="چرا اهمیت دارد" body={workflow.whyMatters} />
      <Section title="ارزش برای سازمان" body={workflow.businessValue} />
      <Section title="بازده مورد انتظار" body={workflow.expectedRoi} highlight />

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          بهبود شاخص‌ها
        </h3>
        <ul className="space-y-2">
          {workflow.kpiImprovements.map((k) => (
            <li
              key={k}
              className="rounded-[10px] border border-etch bg-void/40 px-4 py-2.5 text-[13px] text-text-secondary"
            >
              {k}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          ذی‌نفعان اصلی
        </h3>
        <div className="flex flex-wrap gap-2">
          {workflow.actors.map((a) => (
            <span
              key={a}
              className="rounded-[8px] border border-etch bg-slab-raised px-3 py-1.5 text-[12px] text-text-secondary"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          خلاصه فرآیند
        </h3>
        <ol className="space-y-2">
          {workflow.processSteps.map((s, i) => (
            <li
              key={s.id}
              className="flex gap-3 text-[13px] text-text-secondary"
            >
              <span className="text-primary tabular-nums w-5">
                {toPersianDigits(i + 1)}.
              </span>
              <span>
                {s.label}
                {s.owner ? (
                  <span className="text-text-tertiary"> — {s.owner}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          فرصت‌های هوشمندسازی
        </h3>
        <ul className="space-y-1.5">
          {workflow.automationOpportunities.map((a) => (
            <li key={a} className="text-[13px] text-text-secondary">
              · {a}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function DashboardReviewBody({
  dashboard,
}: {
  dashboard: NonNullable<IntelligenceRecommendation["dashboard"]>;
}) {
  return (
    <>
      <Section title="چرا پایش لازم است" body={dashboard.whyMonitor} />
      <Section title="ارزش اجرایی" body={dashboard.executiveValue} />
      <Section title="اثر راهبردی" body={dashboard.strategicImpact} highlight />

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          سؤالات اجرایی که پاسخ می‌دهد
        </h3>
        <ul className="space-y-2">
          {dashboard.questionsAnswered.map((q) => (
            <li
              key={q}
              className="rounded-[10px] border border-etch bg-void/40 px-4 py-2.5 text-[13px] text-text-secondary"
            >
              {q}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          شاخص‌های کلیدی
        </h3>
        <div className="flex flex-wrap gap-2">
          {dashboard.keyKpis.map((k) => (
            <span
              key={k}
              className="rounded-[8px] border border-accent/25 bg-accent-soft px-3 py-1.5 text-[12px] text-accent"
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-tertiary mb-2">
          نماهای پیشنهادی
        </h3>
        <div className="space-y-2">
          {dashboard.widgets.map((w) => (
            <div
              key={w.id}
              className="rounded-[10px] border border-etch px-4 py-3"
            >
              <p className="text-[14px] font-medium text-text-primary">
                {w.title}
              </p>
              <p className="mt-1 text-[12px] text-text-tertiary">{w.why}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-etch px-4 py-3">
          <p className="text-[11px] text-text-tertiary">تناوب به‌روزرسانی</p>
          <p className="mt-1 text-[14px] text-text-primary">
            {dashboard.updateFrequency}
          </p>
        </div>
        <div className="rounded-[10px] border border-etch px-4 py-3">
          <p className="text-[11px] text-text-tertiary">واحدها</p>
          <p className="mt-1 text-[14px] text-text-primary">
            {dashboard.departments.join(" · ")}
          </p>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  body,
  highlight,
}: {
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-4 py-3.5",
        highlight
          ? "border-primary/30 bg-primary-soft"
          : "border-etch bg-void/30"
      )}
    >
      <h3 className="text-[12px] font-medium text-text-tertiary">{title}</h3>
      <p className="mt-1.5 text-[14px] text-text-primary leading-relaxed">
        {body}
      </p>
    </div>
  );
}
