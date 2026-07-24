"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { spring, stagger } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";

export interface DomainItem {
  id: string;
  title: string;
  detail: string;
  meta?: string;
  tone?: "critical" | "high" | "medium" | "healthy" | "neutral";
  query?: string;
}

export interface DomainSection {
  title: string;
  items: DomainItem[];
}

const toneClass = {
  critical: "border-danger/30 bg-danger-soft/40",
  high: "border-warning/30 bg-warning-soft/40",
  medium: "border-accent/25 bg-accent-soft/30",
  healthy: "border-success/25 bg-success-soft/30",
  neutral: "border-etch bg-slab/70",
};

export function ExecutiveDomainPage({
  title,
  eyebrow,
  headline,
  summary,
  sections,
  primaryAction,
}: {
  title: string;
  eyebrow: string;
  headline: string;
  summary: string;
  sections: DomainSection[];
  primaryAction?: { label: string; query: string };
}) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const ask = (query: string) => {
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <AppShell pageTitle={title}>
      <div className="px-5 py-8 md:px-10 md:py-10 max-w-[1100px] mx-auto pb-28 md:pb-16">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-10"
        >
          <p className="text-[13px] text-text-tertiary">{eyebrow}</p>
          <h1 className="mt-2 text-[clamp(26px,3.5vw,36px)] font-semibold text-text-primary leading-snug max-w-3xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {summary}
          </p>
          {primaryAction && (
            <button
              type="button"
              onClick={() => ask(primaryAction.query)}
              className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[14px] font-medium text-text-inverse cursor-pointer shadow-[var(--shadow-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            >
              {primaryAction.label}
              <ArrowLeft size={14} className="rotate-180" strokeWidth={1.6} />
            </button>
          )}
        </motion.header>

        <div className="space-y-10">
          {sections.map((section, si) => (
            <motion.section
              key={section.title}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.soft, delay: reduced ? 0 : 0.06 * si }}
            >
              <h2 className="mb-4 text-[13px] font-medium text-text-tertiary">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item, i) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    variants={stagger.item}
                    initial={reduced ? false : "initial"}
                    animate="animate"
                    transition={{ delay: reduced ? 0 : i * 0.04 }}
                    onClick={() =>
                      ask(
                        item.query ??
                          `درباره «${item.title}» توضیح اجرایی بده و اقدام پیشنهادی را مشخص کن.`
                      )
                    }
                    className={cn(
                      "w-full text-right rounded-[14px] border px-5 py-4 cursor-pointer transition-colors duration-[120ms]",
                      "hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
                      toneClass[item.tone ?? "neutral"]
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] font-semibold text-text-primary leading-snug">
                        {item.title}
                      </p>
                      {item.meta && (
                        <span className="shrink-0 text-[12px] text-primary tabular-nums">
                          {toPersianDigits(item.meta)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
                      {item.detail}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export type { LucideIcon };
