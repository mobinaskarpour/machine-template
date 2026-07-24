"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDecisionStore } from "@/store/decision-store";
import { spring } from "@/lib/motion";
import { CheckCircle2, X } from "lucide-react";

export function ToastStack() {
  const toasts = useDecisionStore((s) => s.toasts);
  const dismiss = useDecisionStore((s) => s.dismissToast);

  return (
    <div className="fixed top-20 left-1/2 z-[85] flex w-[min(420px,92vw)] -translate-x-1/2 flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.soft}
            className="pointer-events-auto flex items-start gap-3 rounded-[12px] border border-primary/30 bg-slab/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-xl"
            role="status"
          >
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-primary"
              strokeWidth={1.6}
            />
            <p className="flex-1 text-[13px] text-text-primary leading-relaxed">
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-text-tertiary hover:text-text-secondary cursor-pointer"
              aria-label="بستن"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
