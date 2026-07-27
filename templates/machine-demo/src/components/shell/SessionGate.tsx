"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSessionStore } from "@/store/session-store";
import { spring } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { pageLabels } from "@/config/labels";
import { company } from "@/lib/demo/config";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const entered = useSessionStore((s) => s.entered);
  const session = useSessionStore((s) => s.session);
  const enter = useSessionStore((s) => s.enter);
  const reduced = useReducedMotion();
  const gateTitle = company.gate.title;
  const demoDisclaimer = company.gate.demoDisclaimer;
  const footerNote = company.gate.footerNote;

  return (
    <>
      {entered ? children : null}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void bg-void-depth px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={spring.panel}
              className="w-full max-w-md rounded-[18px] border border-etch-strong bg-slab/95 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl"
              role="dialog"
              aria-labelledby="gate-title"
            >
              <p className="text-[12px] tracking-[0.16em] text-text-tertiary">
                {pageLabels.brand}
              </p>
              <h1
                id="gate-title"
                className="mt-3 text-[28px] font-semibold text-text-primary leading-snug"
              >
                {gateTitle}
              </h1>
              <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
                {session.orgName} · {session.role}
              </p>

              <div className="mt-6 rounded-[12px] border border-etch bg-void/40 px-4 py-3 space-y-2">
                <p className="text-[12px] text-text-tertiary">وضعیت داده</p>
                <p className="text-[14px] text-text-primary">{session.asOfLabel}</p>
                <p className="text-[12px] text-text-tertiary leading-relaxed">
                  منابع متصل: {session.sources.slice(0, 2).join(" · ")}
                  {session.sources.length > 2 ? " و بیشتر" : ""}
                </p>
                {session.demoMode && (
                  <p className="text-[12px] text-primary pt-1">
                    {demoDisclaimer}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={enter}
                className="mt-7 w-full rounded-[10px] bg-primary px-4 py-3.5 text-[15px] font-medium text-text-inverse cursor-pointer shadow-[0_0_24px_var(--glow-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              >
                ادامه به‌عنوان {session.userName}
              </button>
              <p className="mt-4 text-center text-[12px] text-text-tertiary leading-relaxed">
                {footerNote}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
