"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { spring, stagger } from "@/lib/motion";
import { executiveBrief } from "@/mock/command-center";
import { uiLabels } from "@/config/labels";
import { useCommandCenter } from "./CommandCenterContext";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion";
import { useSessionStore } from "@/store/session-store";
import { DecisionDialog } from "@/components/shell/DecisionDialog";

const riskStyles = {
  critical: "bg-danger-soft text-danger border-danger/25",
  high: "bg-warning-soft text-warning border-warning/25",
  medium: "bg-accent-soft text-accent border-accent/20",
  low: "bg-success-soft text-success border-success/20",
  healthy: "bg-success-soft text-success border-success/20",
};

export function ExecutiveBrief() {
  const router = useRouter();
  const { triggerPulse } = useCommandCenter();
  const reduced = useReducedMotion();
  const session = useSessionStore((s) => s.session);
  const brief = executiveBrief;
  const [decideOpen, setDecideOpen] = useState(false);

  return (
    <motion.section
      variants={stagger.hero}
      initial="initial"
      animate="animate"
      className="relative"
      onMouseEnter={() => triggerPulse("risk")}
    >
      <motion.div
        variants={stagger.item}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-tertiary"
      >
        <span>{brief.greeting}</span>
        <span className="text-text-tertiary/40">·</span>
        <span>{session.asOfLabel}</span>
        <span className="text-text-tertiary/40">·</span>
        <span className="text-primary/80">{session.orgName}</span>
      </motion.div>

      <motion.h1
        variants={stagger.item}
        className="mt-4 max-w-4xl text-[clamp(28px,4vw,44px)] font-semibold leading-[1.25] text-text-primary"
      >
        {brief.headline}
      </motion.h1>

      <motion.p
        variants={stagger.item}
        className="mt-4 max-w-2xl text-[16px] leading-relaxed text-text-secondary"
      >
        {brief.summary}
      </motion.p>

      <motion.div
        variants={stagger.item}
        className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl"
      >
        <BriefStat
          label={uiLabels.businessImpact}
          value={brief.businessImpact}
        />
        <BriefStat
          label={uiLabels.financialImpact}
          value={brief.financialAmount}
          emphasis
          onFocus={() => triggerPulse("cash")}
        />
        <div
          className={cn(
            "rounded-[14px] border px-5 py-4",
            riskStyles[brief.riskLevel]
          )}
        >
          <p className="text-[12px] opacity-80">{uiLabels.riskLevel}</p>
          <p className="mt-2 text-[20px] font-semibold">{brief.riskLabel}</p>
        </div>
      </motion.div>

      <motion.p
        variants={stagger.item}
        className="mt-5 text-[13px] text-text-tertiary max-w-2xl"
      >
        اقدام پیشنهادی:{" "}
        <span className="text-text-secondary">{brief.recommendedAction}</span>
      </motion.p>

      <motion.div
        variants={stagger.item}
        className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 max-w-3xl"
      >
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { y: -2, transition: spring.gentle }}
          whileTap={reduced ? undefined : { scale: 0.98 }}
          onClick={() => {
            triggerPulse("cash");
            setDecideOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[15px] font-medium text-text-inverse cursor-pointer shadow-[0_0_24px_var(--glow-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
        >
          <CheckCircle2 size={16} strokeWidth={1.6} />
          ثبت اولویت وصول
        </motion.button>
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { y: -2, transition: spring.gentle }}
          onClick={() => {
            triggerPulse("risk");
            router.push(
              `/chat?q=${encodeURIComponent("کدام پروژه بیشترین ریسک را دارد؟")}`
            );
          }}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-etch px-5 py-3 text-[15px] text-text-secondary cursor-pointer hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
        >
          <Sparkles size={16} strokeWidth={1.6} className="text-accent" />
          باز کردن جلسه روی آریا
          <ArrowLeft size={14} className="rotate-180" strokeWidth={1.6} />
        </motion.button>
        <button
          type="button"
          onClick={() => router.push("/projects/aria")}
          className="text-[13px] text-text-tertiary hover:text-text-secondary cursor-pointer underline-offset-4 hover:underline"
        >
          پرونده پروژه
        </button>
      </motion.div>

      <motion.p
        variants={stagger.item}
        className="mt-6 text-[13px] text-text-tertiary/80 max-w-2xl border-r-2 border-etch-strong pr-4"
      >
        <span className="text-text-secondary">{uiLabels.ignoreHint}: </span>
        {brief.ignoreHint}
      </motion.p>

      <p className="mt-4 text-[11px] text-text-tertiary/70">
        منابع: {session.sources.slice(0, 3).join(" · ")}
      </p>

      <DecisionDialog
        actionId="approve-collection"
        open={decideOpen}
        onClose={() => setDecideOpen(false)}
      />
    </motion.section>
  );
}

function BriefStat({
  label,
  value,
  emphasis,
  onFocus,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-etch bg-slab/70 px-5 py-4 backdrop-blur-sm",
        emphasis && "border-primary/30 bg-primary-soft"
      )}
      onMouseEnter={onFocus}
    >
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <p
        className={cn(
          "mt-2 text-[15px] leading-relaxed",
          emphasis
            ? "text-[22px] font-semibold text-primary tabular-nums"
            : "text-text-secondary"
        )}
      >
        {value}
      </p>
    </div>
  );
}
