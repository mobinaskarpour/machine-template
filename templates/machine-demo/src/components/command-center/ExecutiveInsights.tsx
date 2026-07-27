"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { spring, stagger, cardHover, chartForm } from "@/lib/motion";
import {
  insights,
  cashflowRiver,
  portfolioHealthTimeline,
  riskMatrix,
} from "@/mock/command-center";
import { useCommandCenter } from "./CommandCenterContext";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { dashboardEntryFor } from "@/config/capabilities";
import { uiLabels } from "@/config/labels";

const toneBorder = {
  critical: "border-danger/30",
  high: "border-warning/30",
  medium: "border-accent/25",
  low: "border-success/25",
  healthy: "border-success/25",
};

export function ExecutiveInsights() {
  const router = useRouter();
  const { twinFocus, triggerPulse } = useCommandCenter();
  const reduced = useReducedMotion();

  const openDash = (signal: string) => {
    router.push(`/dashboards/${dashboardEntryFor(signal)}`);
  };

  return (
    <section className="space-y-10">
      <div>
        <p className="text-[13px] text-text-tertiary">شاخص‌های کلان</p>
        <h2 className="mt-1 text-[22px] font-semibold text-text-primary">
          KPIهای مدیریتی — فقط نقطه ورود
        </h2>
        <p className="mt-2 text-[13px] text-text-tertiary">
          {uiLabels.entryHint}. با کلیک وارد داشبورد تخصصی شوید.
        </p>
      </div>

      <motion.div
        variants={stagger.fast}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {insights.map((ins) => (
          <motion.button
            key={ins.id}
            type="button"
            variants={stagger.item}
            whileHover={reduced ? undefined : cardHover}
            onMouseEnter={() => triggerPulse(ins.twinNode)}
            onClick={() => openDash(ins.id)}
            className={cn(
              "text-right rounded-[14px] border bg-slab/70 px-5 py-4 cursor-pointer backdrop-blur-sm",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
              toneBorder[ins.tone],
              twinFocus && twinFocus !== ins.twinNode && "opacity-45"
            )}
          >
            <p className="text-[12px] text-text-tertiary">{ins.title}</p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums text-text-primary leading-none">
              {ins.value}
            </p>
            <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
              {ins.story}
            </p>
            <p className="mt-3 text-[12px] text-accent">{uiLabels.openDashboard} ←</p>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <CashflowRiverViz onOpen={() => openDash("viz-cash")} />
        <PortfolioHealthViz onOpen={() => openDash("viz-health")} />
        <RiskMatrixViz onOpen={() => openDash("viz-risk")} />
      </div>
    </section>
  );
}

function CashflowRiverViz({ onOpen }: { onOpen: () => void }) {
  const { triggerPulse } = useCommandCenter();
  const max = Math.max(...cashflowRiver);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-[16px] border border-etch bg-slab/70 p-5 backdrop-blur-sm text-right cursor-pointer hover:border-border-hover w-full"
      onMouseEnter={() => triggerPulse("cash")}
    >
      <p className="text-[13px] font-medium text-text-tertiary mb-1">
        رودخانه نقدینگی
      </p>
      <p className="text-[12px] text-text-tertiary mb-6">
        نمای کلان · جزئیات در داشبورد نقد
      </p>
      <div className="flex items-end gap-1.5 h-28">
        {cashflowRiver.map((v, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-[6px] bg-gradient-to-t from-primary/50 to-accent/30 origin-bottom"
            style={{ height: `${(v / max) * 100}%`, minHeight: 6 }}
            initial={{ scaleY: 0.4, opacity: 0.4 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={chartForm(0.1 + i * 0.04)}
          />
        ))}
      </div>
    </button>
  );
}

function PortfolioHealthViz({ onOpen }: { onOpen: () => void }) {
  const { triggerPulse } = useCommandCenter();
  const points = portfolioHealthTimeline;
  const w = 280;
  const h = 100;
  const max = 100;
  const min = 40;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p.value - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-[16px] border border-etch bg-slab/70 p-5 backdrop-blur-sm text-right cursor-pointer hover:border-border-hover w-full"
      onMouseEnter={() => triggerPulse("portfolio")}
    >
      <p className="text-[13px] font-medium text-text-tertiary mb-1">
        منحنی سلامت پورتفویو
      </p>
      <p className="text-[12px] text-text-tertiary mb-4">
        نمای کلان · جزئیات در داشبورد ریسک
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
        <motion.path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ...spring.soft }}
        />
      </svg>
    </button>
  );
}

function RiskMatrixViz({ onOpen }: { onOpen: () => void }) {
  const { triggerPulse } = useCommandCenter();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-[16px] border border-etch bg-slab/70 p-5 backdrop-blur-sm text-right cursor-pointer hover:border-border-hover w-full"
      onMouseEnter={() => triggerPulse("risk")}
    >
      <p className="text-[13px] font-medium text-text-tertiary mb-1">
        ماتریس ریسک
      </p>
      <p className="text-[12px] text-text-tertiary mb-4">
        نمای کلان · ورود به داشبورد ریسک پورتفویو
      </p>
      <div className="relative h-36 rounded-[10px] border border-etch bg-void/40 overflow-hidden pointer-events-none">
        {riskMatrix.map((r, i) => (
          <motion.span
            key={r.id}
            className="absolute rounded-full border border-danger/40 bg-danger/20"
            style={{
              width: r.size,
              height: r.size,
              left: `${r.x}%`,
              bottom: `${r.y}%`,
              transform: "translate(-50%, 50%)",
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.06, ...spring.soft }}
          />
        ))}
      </div>
    </button>
  );
}
