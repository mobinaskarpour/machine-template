"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Image as ImageIcon,
  Video,
  Map,
  Box,
  Clock,
  FileText,
  AlertTriangle,
  GitBranch,
  LayoutDashboard,
  Truck,
  Coins,
  Waves,
  TrendingUp,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { VisualExperience, VisualExperienceKind } from "@/types/ai";
import { ExecutiveChart } from "@/components/dashboards/ExecutiveCharts";
import { spring } from "@/lib/motion";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  VisualExperienceKind,
  { icon: LucideIcon; accent: string }
> = {
  "executive-chart": { icon: TrendingUp, accent: "text-accent" },
  "project-cameras": { icon: Camera, accent: "text-primary" },
  "project-images": { icon: ImageIcon, accent: "text-accent" },
  "project-videos": { icon: Video, accent: "text-primary" },
  "site-map": { icon: Map, accent: "text-accent" },
  "digital-twin": { icon: Box, accent: "text-primary" },
  timeline: { icon: Clock, accent: "text-accent" },
  documents: { icon: FileText, accent: "text-primary" },
  risks: { icon: AlertTriangle, accent: "text-danger" },
  "workflow-card": { icon: GitBranch, accent: "text-primary" },
  "dashboard-card": { icon: LayoutDashboard, accent: "text-accent" },
  equipment: { icon: Truck, accent: "text-warning" },
  "financial-breakdown": { icon: Coins, accent: "text-primary" },
  cashflow: { icon: Waves, accent: "text-accent" },
  forecast: { icon: TrendingUp, accent: "text-success" },
  "vision-analysis": { icon: Eye, accent: "text-accent" },
};

export function VisualExperienceGrid({
  visuals,
}: {
  visuals: VisualExperience[];
}) {
  if (!visuals.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {visuals.slice(0, 3).map((v, i) => (
        <VisualExperienceCard key={v.id} visual={v} index={i} />
      ))}
    </div>
  );
}

function VisualExperienceCard({
  visual,
  index,
}: {
  visual: VisualExperience;
  index: number;
}) {
  const router = useRouter();
  const meta = kindMeta[visual.kind];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.06, ...spring.soft }}
      className={cn(
        "rounded-[14px] border border-etch bg-slab/80 overflow-hidden",
        visual.kind === "executive-chart" || visual.kind === "cashflow"
          ? "md:col-span-2"
          : ""
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} className={meta.accent} strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {visual.title}
            </p>
            {visual.subtitle && (
              <p className="text-[11px] text-text-tertiary truncate">
                {visual.subtitle}
              </p>
            )}
          </div>
        </div>
        {visual.href && (
          <button
            type="button"
            onClick={() => router.push(visual.href!)}
            className="shrink-0 text-[11px] text-accent cursor-pointer hover:opacity-80"
          >
            باز کردن
          </button>
        )}
      </div>
      <div className="px-4 pb-4">
        <VisualBody kind={visual.kind} seed={index} />
      </div>
    </motion.div>
  );
}

function VisualBody({
  kind,
  seed,
}: {
  kind: VisualExperienceKind;
  seed: number;
}) {
  switch (kind) {
    case "executive-chart":
    case "cashflow":
    case "forecast":
      return (
        <ExecutiveChart
          kind={kind === "cashflow" ? "area" : kind === "forecast" ? "line" : "bar"}
          seed={seed}
        />
      );
    case "financial-breakdown":
      return <ExecutiveChart kind="waterfall" seed={seed} />;
    case "project-cameras":
      return <CameraGrid />;
    case "project-images":
      return <ImageStrip />;
    case "project-videos":
      return <VideoStrip />;
    case "site-map":
      return <SiteMapPreview />;
    case "digital-twin":
      return <MiniTwin />;
    case "timeline":
      return <ExecutiveChart kind="timeline" seed={seed} />;
    case "documents":
      return <DocList />;
    case "risks":
      return <RiskChips />;
    case "workflow-card":
      return <Linkish label="گردش‌کار بازیابی تأخیر · آماده اجرا" tone="primary" />;
    case "dashboard-card":
      return <Linkish label="داشبورد ریسک پورتفویو · داده زنده" tone="accent" />;
    case "equipment":
      return <EquipmentStatus />;
    case "vision-analysis":
      return <VisionMetrics />;
    default:
      return <ExecutiveChart kind="line" seed={seed} />;
  }
}

function CameraGrid() {
  const cams = ["شمال", "جنوب", "جبهه سازه", "انبار"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cams.map((c, i) => (
        <div
          key={c}
          className="aspect-video rounded-[8px] border border-etch bg-void/50 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(${120 + i * 40}deg, var(--slab), var(--accent-soft))`,
            }}
          />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
          <span className="absolute bottom-1.5 right-1.5 text-[10px] text-text-secondary">
            دوربین {c}
          </span>
        </div>
      ))}
    </div>
  );
}

function ImageStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["قبل", "هفته قبل", "امروز", "جزئیات"].map((l, i) => (
        <div
          key={l}
          className="h-20 w-28 shrink-0 rounded-[8px] border border-etch relative overflow-hidden"
          style={{
            background: `linear-gradient(${90 + i * 30}deg, #1a1f28, #2a3340)`,
          }}
        >
          <span className="absolute bottom-1 right-1.5 text-[9px] text-text-tertiary">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function VideoStrip() {
  return (
    <div className="rounded-[10px] border border-etch bg-void/40 aspect-video flex items-center justify-center relative">
      <div className="h-10 w-10 rounded-full border border-etch-strong bg-slab/80 flex items-center justify-center">
        <Video size={16} className="text-primary" />
      </div>
      <span className="absolute bottom-2 right-3 text-[11px] text-text-tertiary">
        بازرسی هوایی · ۰۲:۱۴
      </span>
    </div>
  );
}

function SiteMapPreview() {
  return (
    <div className="relative h-36 rounded-[10px] border border-etch bg-void/40 overflow-hidden">
      <svg viewBox="0 0 280 140" className="w-full h-full opacity-80">
        <rect x="20" y="30" width="90" height="70" rx="6" fill="var(--slab)" stroke="var(--etch-strong)" />
        <rect x="130" y="20" width="60" height="50" rx="6" fill="color-mix(in oklab, var(--danger) 20%, transparent)" stroke="var(--danger)" />
        <rect x="200" y="55" width="55" height="55" rx="6" fill="color-mix(in oklab, var(--success) 18%, transparent)" stroke="var(--success)" />
        <circle cx="160" cy="100" r="8" fill="var(--accent)" opacity="0.7" />
        <text x="35" y="70" fill="var(--text-tertiary)" fontSize="9">
          بلوک A
        </text>
        <text x="140" y="48" fill="var(--danger)" fontSize="8">
          مسدود
        </text>
      </svg>
    </div>
  );
}

function MiniTwin() {
  return (
    <div className="relative h-32 flex items-center justify-center">
      <div className="absolute h-24 w-24 rounded-full border border-etch" />
      <div className="absolute h-14 w-14 rounded-full border border-dashed border-etch-strong" />
      <div className="relative z-10 h-10 w-10 rounded-full border border-primary bg-primary-soft flex items-center justify-center text-[9px] font-semibold text-primary">
        ۵۲
      </div>
      {["نقد", "ریسک", "زمان"].map((l, i) => {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        return (
          <span
            key={l}
            className="absolute text-[9px] text-text-tertiary"
            style={{
              left: `calc(50% + ${Math.cos(a) * 52}px)`,
              top: `calc(50% + ${Math.sin(a) * 42}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {l}
          </span>
        );
      })}
    </div>
  );
}

function DocList() {
  const docs = [
    "نقشه سازه · Rev ۱۲",
    "صورت‌وضعیت فاز ۲",
    "گزارش روزانه کارگاه",
  ];
  return (
    <ul className="space-y-1.5">
      {docs.map((d) => (
        <li
          key={d}
          className="rounded-[8px] border border-etch px-3 py-2 text-[12px] text-text-secondary flex items-center gap-2"
        >
          <FileText size={12} className="text-text-tertiary" />
          {d}
        </li>
      ))}
    </ul>
  );
}

function RiskChips() {
  const items = [
    { t: "تأخیر مسیر بحرانی", c: "text-danger border-danger/30" },
    { t: "قفل مطالبات", c: "text-warning border-warning/30" },
    { t: "ظرفیت پیمانکار", c: "text-warning border-warning/30" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i.t}
          className={cn("rounded-[7px] border px-2.5 py-1 text-[11px]", i.c)}
        >
          {i.t}
        </span>
      ))}
    </div>
  );
}

function Linkish({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-3 py-3 text-[12px]",
        tone === "primary"
          ? "border-primary/30 bg-primary-soft/40 text-primary"
          : "border-accent/30 bg-accent-soft/40 text-accent"
      )}
    >
      {label}
    </div>
  );
}

function EquipmentStatus() {
  const rows = [
    { n: "بچینگ پارس", v: 41 },
    { n: "جرثقیل برجی", v: 72 },
    { n: "لودر کوماتسو", v: 58 },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.n} className="flex items-center gap-2 text-[11px]">
          <span className="w-24 text-text-tertiary truncate">{r.n}</span>
          <div className="flex-1 h-1.5 rounded-full bg-void/50 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                r.v < 50 ? "bg-danger/70" : "bg-accent/70"
              )}
              style={{ width: `${r.v}%` }}
            />
          </div>
          <span className="tabular-nums text-text-secondary w-8">
            {toPersianDigits(r.v)}٪
          </span>
        </div>
      ))}
    </div>
  );
}

function VisionMetrics() {
  const metrics = [
    { l: "پیشرفت واقعی", v: "۶۱٪" },
    { l: "برنامه‌ای", v: "۷۴٪" },
    { l: "تأخیر", v: "۱۳ روز" },
    { l: "اطمینان", v: "۷۸٪" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <div
          key={m.l}
          className="rounded-[8px] border border-etch bg-void/30 px-2.5 py-2"
        >
          <p className="text-[10px] text-text-tertiary">{m.l}</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums text-text-primary">
            {m.v}
          </p>
        </div>
      ))}
    </div>
  );
}
