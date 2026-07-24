"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { stagger, cardHover, chartForm } from "@/lib/motion";
import { projects, type ProjectCard } from "@/mock/command-center";
import { useCommandCenter } from "./CommandCenterContext";
import { useReducedMotion } from "@/components/motion";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const riskTone = {
  critical: "text-danger bg-danger-soft",
  high: "text-warning bg-warning-soft",
  medium: "text-accent bg-accent-soft",
  low: "text-success bg-success-soft",
  healthy: "text-success bg-success-soft",
};

export function ProjectPortfolio({ compact }: { compact?: boolean }) {
  const { twinFocus, triggerPulse } = useCommandCenter();
  const reduced = useReducedMotion();
  const list = compact ? projects.slice(0, 3) : projects;

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-text-tertiary">پورتفویو اجرایی</p>
          <h2 className="mt-1 text-[22px] font-semibold text-text-primary">
            {compact ? "پروژه‌های تحت فشار" : "سلامت پروژه‌ها بدون جدول"}
          </h2>
        </div>
        <p className="text-[13px] text-text-tertiary hidden sm:block">
          {toPersianDigits(list.length)} مورد
        </p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className={cn(
          "grid gap-4",
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        )}
      >
        {list.map((project, i) => (
          <ProjectTile
            key={project.id}
            project={project}
            index={i}
            reduced={reduced}
            active={twinFocus === project.twinNode}
            dimmed={twinFocus !== null && twinFocus !== project.twinNode}
            onHover={() => triggerPulse(project.twinNode)}
          />
        ))}
      </motion.div>
    </section>
  );
}

function ProjectTile({
  project,
  index,
  reduced,
  active,
  dimmed,
  onHover,
}: {
  project: ProjectCard;
  index: number;
  reduced: boolean;
  active: boolean;
  dimmed: boolean;
  onHover: () => void;
}) {
  const router = useRouter();
  const slug =
    project.id === "p1" || project.name.includes("آریا")
      ? "aria"
      : project.id;

  return (
    <motion.button
      type="button"
      variants={stagger.item}
      whileHover={reduced ? undefined : cardHover}
      onMouseEnter={onHover}
      onClick={() => router.push(`/projects/${slug}`)}
      className={cn(
        "w-full text-right rounded-[16px] border bg-slab/80 p-5 backdrop-blur-sm cursor-pointer transition-all duration-[180ms]",
        active
          ? "border-primary/40 shadow-[0_0_28px_var(--glow-primary)]"
          : "border-etch hover:border-etch-strong",
        dimmed && "opacity-40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-semibold text-text-primary">
            {project.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-text-tertiary">
            {project.client}
          </p>
        </div>
        <span
          className={cn(
            "rounded-[6px] px-2 py-0.5 text-[11px] font-medium",
            riskTone[project.risk]
          )}
        >
          {project.riskLabel}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <HealthRing value={project.health} delay={0.15 + index * 0.04} />
        <div className="flex-1 space-y-3 min-w-0">
          <MetricRow label="اطمینان برنامه" value={project.scheduleConfidence} />
          <MetricRow label="پیشرفت" value={project.progress} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-etch pt-4">
        <div>
          <p className="text-[11px] text-text-tertiary">وضعیت مالی</p>
          <p
            className={cn(
              "mt-1 text-[13px] leading-snug",
              project.financialTone === "negative"
                ? "text-danger"
                : project.financialTone === "positive"
                  ? "text-success"
                  : "text-text-secondary"
            )}
          >
            {project.financial}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-tertiary">نقدینگی</p>
          <p className="mt-1 text-[13px] text-text-secondary leading-snug">
            {project.cashflow}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function HealthRing({ value, delay }: { value: number; delay: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color =
    value < 50
      ? "var(--danger)"
      : value < 70
        ? "var(--warning)"
        : "var(--success)";

  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg width="72" height="72" className="-rotate-90" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--etch-strong)"
          strokeWidth="5"
        />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={chartForm(delay)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-semibold tabular-nums text-text-primary">
          {toPersianDigits(value)}
        </span>
        <span className="text-[9px] text-text-tertiary">سلامت</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-text-tertiary">{label}</span>
        <span className="tabular-nums text-text-secondary">
          {toPersianDigits(value)}٪
        </span>
      </div>
      <div className="h-1 rounded-full bg-etch-strong overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary/70 origin-right"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: value / 100 }}
          transition={chartForm(0.3)}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
