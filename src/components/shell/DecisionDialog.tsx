"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDecisionStore } from "@/store/decision-store";
import { spring, timing } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const consequences: Record<
  string,
  { approve: string; defer: string; reject?: string }
> = {
  "approve-collection": {
    approve:
      "اولویت وصول آریا ثبت شد. تیم مالی پیگیری کارفرما را از فردا صبح آغاز می‌کند — اثر هدف: آزادی ۱۲.۱ میلیارد در ۷ روز.",
    defer: "وصول آریا به فردا موکول شد. فشار نقد هفته همچنان پابرجاست.",
  },
  "recovery-meeting": {
    approve:
      "جلسه بازیابی در تقویم امروز ثبت شد. برنامه‌ریز و پیمانکار سازه مطلع می‌شوند.",
    defer: "جلسه بازیابی به تعویق افتاد. شناوری مسیر بحرانی همچنان صفر است.",
  },
  "vo-14": {
    approve:
      "دستور تغییر ۱۴ با قید سقف ۲.۸ میلیارد تأیید شد. حاشیه پروژه به‌روز می‌شود.",
    defer: "دستور تغییر ۱۴ در صف بازبینی ماند.",
    reject:
      "دستور تغییر ۱۴ رد شد. تعهد جدید ثبت نمی‌شود؛ اثر حاشیه خنثی ماند.",
  },
  "priority-ar": {
    approve: "اولویت وصول در صف مالی ثبت شد.",
    defer: "اولویت وصول به تعویق افتاد.",
  },
  "conditional-pay": {
    approve: "پرداخت مشروط به پیمانکار فعال شد تا امتیاز عملکرد زیر آستانه بماند.",
    defer: "پرداخت مشروط فعلاً اعمال نشد.",
  },
  "approve-recovery": {
    approve: "برنامه بازیابی تأیید و به عملیات ابلاغ شد.",
    defer: "برنامه بازیابی در انتظار ماند.",
  },
};

export function DecisionDialog({
  actionId,
  open,
  onClose,
}: {
  actionId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const decide = useDecisionStore((s) => s.decide);
  const decisions = useDecisionStore((s) => s.decisions);
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  const decision =
    decisions.find((d) => d.id === actionId) ??
    (actionId
      ? {
          id: actionId,
          title: "اقدام اجرایی",
          detail: "ثبت تصمیم در دفتر اجرایی سازمان",
          moneyAtStake: "—",
          status: "open" as const,
        }
      : null);

  const pack = actionId ? consequences[actionId] : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!decision) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-overlay backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: timing.panel * 0.4 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-title"
            className="fixed z-[82] left-1/2 top-[18%] w-[min(480px,92vw)] -translate-x-1/2 rounded-[18px] border border-etch-strong bg-slab p-6 shadow-[var(--shadow-md)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={spring.panel}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-text-tertiary">ثبت تصمیم اجرایی</p>
                <h2
                  id="decision-title"
                  className="mt-1 text-[18px] font-semibold text-text-primary"
                >
                  {decision.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-text-tertiary cursor-pointer"
                aria-label="بستن"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
              {decision.detail}
            </p>
            <p className="mt-3 text-[14px] text-primary tabular-nums">
              در معرض ریسک: {decision.moneyAtStake}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  decide(
                    decision.id,
                    "approved",
                    pack?.approve ?? `«${decision.title}» تأیید و ثبت شد.`
                  );
                  onClose();
                }}
                className="rounded-[10px] bg-primary px-4 py-3 text-[14px] font-medium text-text-inverse cursor-pointer"
              >
                تأیید و ثبت
              </button>
              {pack?.reject && (
                <button
                  type="button"
                  onClick={() => {
                    decide(decision.id, "rejected", pack.reject!);
                    onClose();
                  }}
                  className="rounded-[10px] border border-danger/40 bg-danger-soft px-4 py-3 text-[14px] text-danger cursor-pointer"
                >
                  رد
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  decide(
                    decision.id,
                    "deferred",
                    pack?.defer ?? `«${decision.title}» به تعویق افتاد.`
                  );
                  onClose();
                }}
                className={cn(
                  "rounded-[10px] border border-etch px-4 py-3 text-[14px] text-text-secondary cursor-pointer"
                )}
              >
                بعداً
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
