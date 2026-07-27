"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, Command } from "lucide-react";
import { spring, timing } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { railItems } from "@/config/labels";
import { cn } from "@/lib/utils";

const executiveQueries = [
  "کدام پروژه بیشترین ریسک را دارد؟",
  "وضعیت نقدینگی این هفته چگونه است؟",
  "اگر برج آریا یک هفته تأخیر بخورد چه می‌شود؟",
  "سه تصمیم مهم امروز چیست؟",
  "وضعیت پیمانکار سازه آریا چگونه است؟",
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const goChat = useCallback(
    (q: string) => {
      onClose();
      router.push(`/chat?q=${encodeURIComponent(q)}`);
    },
    [onClose, router]
  );

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const filteredQueries = executiveQueries.filter((q) =>
    !query.trim() ? true : q.includes(query.trim())
  );
  const filteredRail = railItems.filter((r) =>
    !query.trim() ? true : r.label.includes(query.trim())
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-overlay backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: timing.panel * 0.45 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="جستجوی اجرایی"
            className="fixed z-[95] top-[12%] left-1/2 w-[min(560px,92vw)] -translate-x-1/2 rounded-[18px] border border-etch-strong bg-slab shadow-[var(--shadow-md)] overflow-hidden"
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, y: 12, filter: "blur(6px)" }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={{ opacity: 0, y: 8 }}
            transition={spring.panel}
          >
            <div className="flex items-center gap-3 border-b border-etch px-4 py-3">
              <Search size={16} className="text-text-tertiary shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    goChat(query.trim());
                  }
                }}
                placeholder="سؤال اجرایی یا مسیر…"
                className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-tertiary outline-none"
                aria-label="جستجوی اجرایی"
              />
              <kbd className="hidden sm:inline-flex rounded-[6px] border border-etch px-1.5 py-0.5 text-[11px] text-text-tertiary">
                خروج
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filteredQueries.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[11px] text-text-tertiary flex items-center gap-1.5">
                    <Sparkles size={12} className="text-accent" />
                    سؤالات اجرایی
                  </p>
                  {filteredQueries.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => goChat(q)}
                      className="w-full text-right rounded-[10px] px-3 py-2.5 text-[14px] text-text-secondary hover:bg-hover hover:text-text-primary cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {filteredRail.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[11px] text-text-tertiary flex items-center gap-1.5">
                    <Command size={12} />
                    مسیرها
                  </p>
                  {filteredRail.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => go(r.href)}
                      className={cn(
                        "w-full text-right rounded-[10px] px-3 py-2.5 text-[14px] cursor-pointer",
                        "text-text-secondary hover:bg-hover hover:text-text-primary"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
