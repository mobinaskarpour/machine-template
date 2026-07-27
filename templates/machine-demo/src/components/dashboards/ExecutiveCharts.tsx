"use client";

import { motion } from "framer-motion";
import { chartForm } from "@/lib/motion";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import type { WidgetKind } from "@/types/intelligence";

const kpiSamples = [
  { label: "شاخص اصلی", value: "۱۸.۴ میلیارد", tone: "warn" as const },
  { label: "روند هفته", value: "۳۸٪", tone: "danger" as const },
  { label: "فرصت آزادی", value: "۱۲.۱ میلیارد", tone: "ok" as const },
  { label: "اقدام باز", value: "۷ مورد", tone: "neutral" as const },
];

export function ExecutiveChart({
  kind,
  seed = 0,
}: {
  kind: WidgetKind;
  seed?: number;
}) {
  switch (kind) {
    case "kpi-row":
    case "metric":
      return <KpiRow seed={seed} />;
    case "line":
      return <LineChart seed={seed} />;
    case "bar":
      return <BarChart seed={seed} />;
    case "area":
    case "river":
      return <AreaChart seed={seed} />;
    case "donut":
      return <DonutChart seed={seed} />;
    case "gauge":
    case "rings":
      return <GaugeChart seed={seed} />;
    case "heatmap":
    case "matrix":
      return <HeatmapChart seed={seed} />;
    case "waterfall":
      return <WaterfallChart seed={seed} />;
    case "treemap":
      return <TreemapChart seed={seed} />;
    case "timeline":
      return <TimelineChart seed={seed} />;
    case "list":
      return <PriorityList seed={seed} />;
    default:
      return <LineChart seed={seed} />;
  }
}

function KpiRow({ seed }: { seed: number }) {
  const items = [...kpiSamples];
  if (seed % 2) items.reverse();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={chartForm(0.05 * i)}
          className="rounded-[10px] border border-etch bg-void/35 px-3 py-3"
        >
          <p className="text-[11px] text-text-tertiary">{k.label}</p>
          <p
            className={cn(
              "mt-1.5 text-[18px] font-semibold tabular-nums",
              k.tone === "danger" && "text-danger",
              k.tone === "warn" && "text-warning",
              k.tone === "ok" && "text-accent",
              k.tone === "neutral" && "text-text-primary"
            )}
          >
            {k.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function LineChart({ seed }: { seed: number }) {
  const pts = [42, 48, 45, 52, 47, 58, 54, 61, 55, 49, 44, 38].map(
    (v, i) => v + ((seed + i) % 5) - 2
  );
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const w = 320;
  const h = 110;
  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 12) - 6;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]" preserveAspectRatio="none">
      <motion.path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function AreaChart({ seed }: { seed: number }) {
  const pts = [30, 38, 35, 48, 42, 55, 50, 62, 58, 70, 65, 72].map(
    (v, i) => v + ((seed + i) % 4)
  );
  const w = 320;
  const h = 110;
  const max = Math.max(...pts);
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / max) * (h - 10) - 4;
    return [x, y] as const;
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]" preserveAspectRatio="none">
      <motion.path
        d={area}
        fill="url(#areaFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" />
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BarChart({ seed }: { seed: number }) {
  const labels = ["آریا", "خط ۷", "پارس", "سپهر", "نیلوفر"];
  const vals = [82, 64, 71, 45, 58].map((v, i) => Math.min(95, v + seed + i));
  return (
    <div className="space-y-2.5">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[11px] text-text-tertiary">{label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-void/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-primary to-accent/70"
              initial={{ width: 0 }}
              animate={{ width: `${vals[i]}%` }}
              transition={chartForm(0.06 * i)}
            />
          </div>
          <span className="w-8 text-left text-[11px] tabular-nums text-text-secondary">
            {toPersianDigits(vals[i])}٪
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ seed }: { seed: number }) {
  const slices = [
    { v: 42 + seed, color: "var(--danger)" },
    { v: 28, color: "var(--warning)" },
    { v: 18, color: "var(--accent)" },
    { v: 12, color: "var(--primary)" },
  ];
  const total = slices.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  const r = 36;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-5">
      <svg width="96" height="96" className="-rotate-90">
        {slices.map((s, i) => {
          const len = (s.v / total) * c;
          const offset = acc;
          acc += len;
          return (
            <motion.circle
              key={i}
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={chartForm(0.08 * i)}
            />
          );
        })}
      </svg>
      <ul className="space-y-1.5 text-[12px] text-text-secondary">
        <li>مطالبات قفل · {toPersianDigits(slices[0].v)}٪</li>
        <li>حسن‌انجام · {toPersianDigits(slices[1].v)}٪</li>
        <li>کار در جریان · {toPersianDigits(slices[2].v)}٪</li>
        <li>سایر · {toPersianDigits(slices[3].v)}٪</li>
      </ul>
    </div>
  );
}

function GaugeChart({ seed }: { seed: number }) {
  const v = Math.min(92, 38 + seed * 3);
  const r = 40;
  const c = Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path
          d="M 20 70 A 50 50 0 0 1 120 70"
          fill="none"
          stroke="var(--etch-strong)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d="M 20 70 A 50 50 0 0 1 120 70"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <p className="text-[28px] font-semibold tabular-nums text-text-primary -mt-2">
        {toPersianDigits(v)}٪
      </p>
      <p className="text-[11px] text-text-tertiary">نسبت به هدف اجرایی</p>
    </div>
  );
}

function HeatmapChart({ seed }: { seed: number }) {
  const cells = Array.from({ length: 16 }, (_, i) => ((i * 17 + seed * 3) % 100));
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cells.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={chartForm(0.03 * i)}
          className="aspect-square rounded-[6px]"
          style={{
            background:
              v > 70
                ? "color-mix(in oklab, var(--danger) 55%, transparent)"
                : v > 40
                  ? "color-mix(in oklab, var(--warning) 45%, transparent)"
                  : "color-mix(in oklab, var(--accent) 30%, transparent)",
          }}
          title={toPersianDigits(v)}
        />
      ))}
    </div>
  );
}

function WaterfallChart({ seed }: { seed: number }) {
  const steps = [
    { label: "درآمد", h: 88, pos: true },
    { label: "معوق", h: 28 + seed, pos: false },
    { label: "حسن‌انجام", h: 14, pos: false },
    { label: "آزاد", h: 46, pos: true },
  ];
  return (
    <div className="flex items-end gap-3 h-28">
      {steps.map((s, i) => (
        <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div
            className={cn(
              "w-full rounded-t-[6px]",
              s.pos ? "bg-accent/50" : "bg-danger/45"
            )}
            style={{ height: `${s.h}%` }}
            initial={{ scaleY: 0.3, opacity: 0.4 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={chartForm(0.07 * i)}
          />
          <span className="text-[10px] text-text-tertiary">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function TreemapChart({ seed }: { seed: number }) {
  const blocks = [
    { label: "آریا", flex: 5 + (seed % 2), tone: "danger" },
    { label: "خط ۷", flex: 3, tone: "warn" },
    { label: "پارس", flex: 2, tone: "ok" },
    { label: "سایر", flex: 2, tone: "neutral" },
  ];
  return (
    <div className="flex h-28 gap-1.5">
      {blocks.map((b, i) => (
        <motion.div
          key={b.label}
          style={{ flex: b.flex }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={chartForm(0.06 * i)}
          className={cn(
            "rounded-[8px] flex items-end p-2 text-[11px] font-medium",
            b.tone === "danger" && "bg-danger-soft text-danger",
            b.tone === "warn" && "bg-warning-soft text-warning",
            b.tone === "ok" && "bg-accent/20 text-accent",
            b.tone === "neutral" && "bg-void/50 text-text-tertiary"
          )}
        >
          {b.label}
        </motion.div>
      ))}
    </div>
  );
}

function TimelineChart({ seed }: { seed: number }) {
  const events = [
    "امروز — تأیید اولویت",
    "فردا — تماس کارفرما",
    "۴۸س — بازیابی پیمانکار",
    "۷روز — بازبینی اثر",
  ].map((e, i) => (i === seed % 4 ? `● ${e}` : e));
  return (
    <ol className="relative space-y-3 pr-4 border-r border-etch mr-2">
      {events.map((e, i) => (
        <motion.li
          key={e}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={chartForm(0.06 * i)}
          className="relative text-[12px] text-text-secondary leading-relaxed"
        >
          <span className="absolute -right-[21px] top-1.5 h-2 w-2 rounded-full bg-accent" />
          {e.replace(/^● /, "")}
        </motion.li>
      ))}
    </ol>
  );
}

function PriorityList({ seed }: { seed: number }) {
  const items = [
    "اولویت بحرانی — اقدام امروز",
    "اولویت بالا — پیگیری ۴۸ساعته",
    "پایدار — پایش هفتگی",
  ];
  if (seed % 2) items.reverse();
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li
          key={t}
          className="rounded-[8px] border border-etch px-3 py-2.5 text-[13px] text-text-secondary flex items-center gap-2"
        >
          <span className="text-[11px] text-text-tertiary tabular-nums">
            {toPersianDigits(i + 1)}
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}
