"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Inbox, X } from "lucide-react";
import { spring } from "@/lib/motion";
import { pageLabels, uiLabels } from "@/config/labels";
import { CommandPalette } from "./CommandPalette";
import { useReducedMotion } from "@/components/motion";
import { useIntelligenceStore } from "@/store/intelligence-store";
import { useSessionStore } from "@/store/session-store";
import { cn } from "@/lib/utils";

export function Topbar({ pageTitle }: { pageTitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const session = useSessionStore((s) => s.session);
  const leave = useSessionStore((s) => s.leave);
  const pendingCount = useIntelligenceStore(
    (s) =>
      s.recommendations.filter(
        (r) =>
          r.status === "proposed" ||
          r.status === "reviewing" ||
          r.status === "deferred"
      ).length
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <motion.header
        initial={reduced ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.1, ...spring.soft }}
        className="flex items-center justify-between gap-3 md:gap-4 px-4 md:px-6 py-3.5 md:py-4 border-b border-etch shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hidden sm:inline text-[12px] tracking-[0.14em] text-text-tertiary">
            {pageLabels.brand}
          </span>
          <span className="hidden sm:inline text-text-tertiary/40">/</span>
          <span className="text-[15px] font-medium text-text-primary truncate">
            {pageTitle ?? pageLabels.home}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex flex-1 max-w-md items-center gap-3 rounded-[10px] border border-etch bg-slab/60 px-3 md:px-4 py-2.5 text-right transition-colors duration-[120ms] hover:border-border-hover cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          aria-label={uiLabels.searchExecutive}
        >
          <Search
            size={16}
            strokeWidth={1.6}
            className="text-text-tertiary shrink-0"
          />
          <span className="flex-1 text-[14px] md:text-[15px] text-text-tertiary truncate">
            {uiLabels.searchExecutive}
          </span>
          <kbd className="hidden sm:inline-flex rounded-[6px] border border-etch px-1.5 py-0.5 text-[11px] text-text-tertiary">
            میانبر
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Link
            href="/chat"
            aria-label={uiLabels.aiWorkspace}
            aria-current={pathname === "/chat" ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[10px] border border-etch bg-slab text-accent",
              "hover:border-accent/40 transition-colors duration-[120ms]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            )}
          >
            <Sparkles size={17} strokeWidth={1.6} />
          </Link>

          <Link
            href="/inbox"
            aria-label={uiLabels.notifications}
            aria-current={pathname === "/inbox" ? "page" : undefined}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-etch bg-slab text-text-secondary",
              "hover:border-border-hover transition-colors duration-[120ms]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            )}
          >
            <Inbox size={17} strokeWidth={1.6} />
            {pendingCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger"
                aria-hidden
              />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-etch bg-slab px-2.5 md:px-3 cursor-pointer hover:border-border-hover transition-colors duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            aria-label={uiLabels.profile}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-primary/15 text-[13px] font-medium text-primary">
              {session.initials}
            </span>
            <span className="hidden lg:block text-[13px] text-text-secondary">
              {session.userName}
            </span>
          </button>
        </div>
      </motion.header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[88] bg-overlay/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="تنظیمات جلسه"
              className="fixed z-[90] top-16 left-4 md:left-8 w-[min(340px,92vw)] rounded-[16px] border border-etch-strong bg-slab p-5 shadow-[var(--shadow-md)]"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring.soft}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    {session.userName}
                  </p>
                  <p className="text-[13px] text-text-tertiary">
                    {session.role} · {session.orgName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="text-text-tertiary cursor-pointer"
                  aria-label="بستن"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 rounded-[10px] border border-etch px-3 py-2.5 text-[12px] text-text-secondary space-y-1">
                <p>{session.asOfLabel}</p>
                {session.demoMode && (
                  <p className="text-primary">محیط نمایش سازمانی</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/inbox");
                }}
                className="mt-3 w-full rounded-[10px] border border-etch px-3 py-2.5 text-[13px] text-text-secondary cursor-pointer hover:border-border-hover"
              >
                صندوق اجرایی
              </button>
              <button
                type="button"
                onClick={() => {
                  leave();
                  setProfileOpen(false);
                }}
                className="mt-2 w-full rounded-[10px] px-3 py-2.5 text-[13px] text-danger cursor-pointer hover:bg-danger-soft"
              >
                خروج از جلسه نمایش
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
