"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Activity, Zap, Database, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { pageLabels } from "@/config/labels";
import {
  connectionCategories,
  getConnectionGraphNodes,
  getEcosystemOverview,
  getPriorityAdvisories,
  orgConnections,
  statusLabel,
  type ConnectionStatus,
  type OrgConnection,
} from "@/config/connections";
import { spring, stagger } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { formatPersianNumber, toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

export function ConnectionsHubPage() {
  const reduced = useReducedMotion();
  const overview = useMemo(() => getEcosystemOverview(), []);
  const advisories = useMemo(() => getPriorityAdvisories(), []);
  const [selected, setSelected] = useState<OrgConnection | null>(null);

  return (
    <AppShell pageTitle={pageLabels.connections}>
      <div className="px-5 py-7 md:px-10 max-w-[1200px] mx-auto pb-28">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-7"
        >
          <p className="text-[12px] text-accent">هاب یکپارچه‌سازی سازمانی</p>
          <h1 className="mt-1.5 text-[clamp(26px,3.5vw,34px)] font-semibold text-text-primary tracking-tight">
            اتصالات
          </h1>
          <p className="mt-2.5 max-w-2xl text-[14px] text-text-secondary leading-relaxed">
            THE MACHINE مغز متفکر سازمان است — این صفحه جریان داده از تمام
            سیستم‌های متصل را در یک نگاه نشان می‌دهد.
          </p>
        </motion.header>

        <ExecutiveOverview overview={overview} reduced={reduced} />
        <AIConnectionAdvisor items={advisories} onOpen={setSelected} />

        <div className="space-y-10 mt-10">
          {connectionCategories.map((cat) => {
            const items = orgConnections.filter((c) => c.category === cat.id);
            const Icon = cat.icon;
            return (
              <section key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-etch bg-slab text-primary">
                    <Icon size={16} strokeWidth={1.6} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-text-primary">
                      {cat.title}
                    </h2>
                    <p className="text-[12px] text-text-tertiary">{cat.subtitle}</p>
                  </div>
                </div>
                <motion.div
                  variants={stagger.container}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
                >
                  {items.map((conn) => (
                    <ConnectionCard
                      key={conn.id}
                      connection={conn}
                      onDetails={() => setSelected(conn)}
                    />
                  ))}
                </motion.div>
              </section>
            );
          })}
        </div>

        <ConnectionGraph />

        <AnimatePresence>
          {selected && (
            <ConnectionDetail
              connection={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function ExecutiveOverview({
  overview,
  reduced,
}: {
  overview: ReturnType<typeof getEcosystemOverview>;
  reduced: boolean;
}) {
  const tiles = [
    { label: "کل اتصال‌ها", value: overview.total, tone: "neutral" as const },
    { label: "سالم", value: overview.online, tone: "ok" as const },
    { label: "هشدار", value: overview.warning, tone: "warn" as const },
    { label: "قطع‌شده", value: overview.offline, tone: "danger" as const },
  ];

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.soft}
      className="rounded-[16px] border border-etch bg-slab/80 p-5 md:p-6 mb-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] text-text-tertiary mb-1">نمای اجرایی اکوسیستم</p>
          <p className="text-[13px] text-text-secondary">
            آخرین همگام‌سازی:{" "}
            <span className="text-text-primary">{overview.lastSyncLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HealthRing value={overview.healthScore} size={56} />
          <div>
            <p className="text-[11px] text-text-tertiary">سلامت اکوسیستم</p>
            <p className="text-[22px] font-semibold tabular-nums text-text-primary">
              {toPersianDigits(overview.healthScore)}٪
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[12px] border border-etch bg-void/35 px-4 py-3"
          >
            <p className="text-[11px] text-text-tertiary">{t.label}</p>
            <p
              className={cn(
                "mt-1.5 text-[24px] font-semibold tabular-nums",
                t.tone === "ok" && "text-success",
                t.tone === "warn" && "text-warning",
                t.tone === "danger" && "text-danger",
                t.tone === "neutral" && "text-text-primary"
              )}
            >
              {toPersianDigits(t.value)}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function AIConnectionAdvisor({
  items,
  onOpen,
}: {
  items: OrgConnection[];
  onOpen: (c: OrgConnection) => void;
}) {
  if (!items.length) {
    return (
      <section className="rounded-[14px] border border-accent/25 bg-accent-soft/30 px-5 py-4 mb-2 flex gap-3">
        <Sparkles size={16} className="text-accent shrink-0 mt-0.5" strokeWidth={1.6} />
        <p className="text-[13px] text-text-secondary leading-relaxed">
          همه اتصال‌های حیاتی پایدارند. اکوسیستم داده برای تصمیم‌های اجرایی آماده است.
        </p>
      </section>
    );
  }

  const primary = items[0];

  return (
    <section className="rounded-[14px] border border-accent/30 bg-gradient-to-l from-accent-soft/40 to-slab/80 p-5 mb-2">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-accent/30 bg-void/40 text-accent">
          <Sparkles size={15} strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-accent mb-1.5">
            مشاور اتصال هوش مصنوعی
          </p>
          <p className="text-[14px] text-text-primary leading-relaxed">
            {primary.businessImpact}
          </p>
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
            <span className="text-text-tertiary">اقدام پیشنهادی: </span>
            {primary.recommendedAction}
          </p>
          {items.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {items.slice(1).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpen(c)}
                  className="rounded-[8px] border border-etch px-2.5 py-1 text-[11px] text-text-tertiary hover:border-border-hover hover:text-text-secondary cursor-pointer"
                >
                  {c.name} · {statusLabel[c.status]}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpen(primary)}
            className="mt-3 text-[12px] text-accent hover:opacity-80 cursor-pointer"
          >
            مشاهده جزئیات {primary.name}
          </button>
        </div>
      </div>
    </section>
  );
}

function ConnectionCard({
  connection,
  onDetails,
}: {
  connection: OrgConnection;
  onDetails: () => void;
}) {
  const Icon = connection.icon;

  return (
    <motion.article
      variants={stagger.item}
      whileHover={{ y: -3, transition: spring.gentle }}
      className={cn(
        "group relative rounded-[14px] border bg-slab/85 p-4 backdrop-blur-sm",
        "transition-[border-color,box-shadow] duration-[120ms]",
        connection.status === "online" && "border-etch hover:border-success/35",
        connection.status === "warning" && "border-warning/35 hover:border-warning/55",
        connection.status === "offline" && "border-danger/40 hover:border-danger/60",
        "hover:shadow-[var(--shadow-md)]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[11px] border",
              connection.status === "online" && "border-success/25 bg-success-soft text-success",
              connection.status === "warning" && "border-warning/30 bg-warning-soft text-warning",
              connection.status === "offline" && "border-danger/30 bg-danger-soft text-danger"
            )}
          >
            <Icon size={15} strokeWidth={1.6} />
            <span className="text-[8px] font-semibold leading-none mt-0.5 opacity-80">
              {connection.monogram}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-text-primary truncate">
              {connection.name}
            </h3>
            <StatusPill status={connection.status} />
          </div>
        </div>
        <HealthRing value={connection.health} size={40} status={connection.status} />
      </div>

      <dl className="space-y-1.5 text-[11px] mb-3">
        <div className="flex justify-between gap-2">
          <dt className="text-text-tertiary">آخرین همگام‌سازی</dt>
          <dd className="text-text-secondary tabular-nums">{connection.lastSyncLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-tertiary">زمان پاسخ</dt>
          <dd className="text-text-secondary tabular-nums">
            {connection.status === "offline"
              ? "—"
              : `${toPersianDigits(connection.latencyMs)} میلی‌ثانیه`}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-tertiary">کیفیت داده</dt>
          <dd className="text-text-secondary tabular-nums">
            {toPersianDigits(connection.dataQuality)}٪
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onDetails}
        className="w-full rounded-[9px] border border-etch bg-void/30 px-3 py-2 text-[12px] text-text-secondary cursor-pointer transition-colors group-hover:border-border-hover group-hover:text-text-primary"
      >
        مشاهده جزئیات
      </button>
    </motion.article>
  );
}

function StatusPill({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center gap-1.5 text-[10px] font-medium",
        status === "online" && "text-success",
        status === "warning" && "text-warning",
        status === "offline" && "text-danger"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "online" && "bg-success shadow-[0_0_8px_var(--success)]",
          status === "warning" && "bg-warning shadow-[0_0_8px_var(--warning)]",
          status === "offline" && "bg-danger shadow-[0_0_8px_var(--danger)]"
        )}
      />
      {statusLabel[status]}
    </span>
  );
}

function HealthRing({
  value,
  size = 44,
  status,
}: {
  value: number;
  size?: number;
  status?: ConnectionStatus;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color =
    status === "offline"
      ? "var(--danger)"
      : status === "warning"
        ? "var(--warning)"
        : value >= 90
          ? "var(--success)"
          : value >= 70
            ? "var(--warning)"
            : "var(--danger)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--etch-strong)"
          strokeWidth="3"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums text-text-secondary">
        {toPersianDigits(value)}
      </span>
    </div>
  );
}

function ConnectionGraph() {
  const nodes = useMemo(() => getConnectionGraphNodes(), []);
  const cx = 280;
  const cy = 220;
  const radius = 150;

  return (
    <section className="mt-12 mb-4">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-text-primary">
          گراف اتصالات
        </h2>
        <p className="mt-1 text-[13px] text-text-tertiary">
          THE MACHINE در مرکز — سیستم‌های سازمان در مدار داده
        </p>
      </div>

      <div className="rounded-[16px] border border-etch bg-slab/70 overflow-hidden relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--glow-ai) 0%, transparent 55%)",
          }}
        />
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox="0 0 560 440"
            className="w-full min-w-[480px] h-auto max-h-[440px] mx-auto"
            role="img"
            aria-label="گراف تعاملی اتصالات سازمانی"
          >
            {/* orbit rings */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--etch-strong)"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius * 0.55}
              fill="none"
              stroke="var(--etch)"
              strokeWidth="1"
              opacity="0.6"
            />

            {nodes.map((node) => {
              const x = cx + Math.cos(node.angle) * radius;
              const y = cy + Math.sin(node.angle) * radius;
              const stroke =
                node.status === "offline"
                  ? "var(--danger)"
                  : node.status === "warning"
                    ? "var(--warning)"
                    : "var(--success)";
              return (
                <g key={node.id}>
                  <motion.line
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke={stroke}
                    strokeWidth="1.5"
                    strokeOpacity="0.55"
                    strokeDasharray="5 7"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill={stroke}
                    animate={{
                      opacity: [0.35, 1, 0.35],
                    }}
                    transition={{
                      duration: node.status === "offline" ? 1.2 : 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      offsetPath: undefined,
                    }}
                  />
                  {/* pulse along line via second moving dot */}
                  <motion.circle
                    r="2.5"
                    fill={stroke}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "linear",
                      delay: Math.abs(node.angle),
                    }}
                  >
                    <animate
                      attributeName="cx"
                      values={`${cx};${x}`}
                      dur={node.status === "offline" ? "0s" : "2.8s"}
                      repeatCount={node.status === "offline" ? 0 : "indefinite"}
                    />
                    <animate
                      attributeName="cy"
                      values={`${cy};${y}`}
                      dur={node.status === "offline" ? "0s" : "2.8s"}
                      repeatCount={node.status === "offline" ? 0 : "indefinite"}
                    />
                  </motion.circle>

                  <motion.g
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring.soft}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="var(--slab)"
                      stroke={stroke}
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill={
                        node.status === "offline"
                          ? "color-mix(in oklab, var(--danger) 18%, transparent)"
                          : node.status === "warning"
                            ? "color-mix(in oklab, var(--warning) 16%, transparent)"
                            : "color-mix(in oklab, var(--success) 12%, transparent)"
                      }
                    />
                    <text
                      x={x}
                      y={y + 3}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {node.label.length > 10
                        ? node.label.slice(0, 9) + "…"
                        : node.label}
                    </text>
                  </motion.g>
                </g>
              );
            })}

            {/* Center — THE MACHINE */}
            <motion.g
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.hero}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <circle
                cx={cx}
                cy={cy}
                r="42"
                fill="var(--deck)"
                stroke="var(--primary)"
                strokeWidth="2"
                filter="url(#machineGlow)"
              />
              <circle
                cx={cx}
                cy={cy}
                r="42"
                fill="color-mix(in oklab, var(--primary) 12%, transparent)"
              />
              <circle cx={cx} cy={cy - 8} r="4" fill="var(--primary)" />
              <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="700"
              >
                THE MACHINE
              </text>
            </motion.g>

            <defs>
              <filter id="machineGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        <div className="flex flex-wrap justify-center gap-4 px-4 py-3 border-t border-etch text-[11px] text-text-tertiary">
          <LegendDot tone="online" label="سالم" />
          <LegendDot tone="warning" label="هشدار" />
          <LegendDot tone="offline" label="قطع‌شده" />
        </div>
      </div>
    </section>
  );
}

function LegendDot({
  tone,
  label,
}: {
  tone: ConnectionStatus;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          tone === "online" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "offline" && "bg-danger"
        )}
      />
      {label}
    </span>
  );
}

function ConnectionDetail({
  connection,
  onClose,
}: {
  connection: OrgConnection;
  onClose: () => void;
}) {
  const Icon = connection.icon;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-overlay cursor-pointer"
        aria-label="بستن"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="conn-detail-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={spring.panel}
        className="relative w-full max-w-lg rounded-[16px] border border-etch-strong bg-deck shadow-[var(--shadow-md)] p-5 md:p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[12px] border",
                connection.status === "online" &&
                  "border-success/30 bg-success-soft text-success",
                connection.status === "warning" &&
                  "border-warning/30 bg-warning-soft text-warning",
                connection.status === "offline" &&
                  "border-danger/30 bg-danger-soft text-danger"
              )}
            >
              <Icon size={20} strokeWidth={1.6} />
            </div>
            <div>
              <h3
                id="conn-detail-title"
                className="text-[17px] font-semibold text-text-primary"
              >
                {connection.name}
              </h3>
              <StatusPill status={connection.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary cursor-pointer"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <Metric
            icon={<Activity size={13} />}
            label="سلامت اتصال"
            value={`${toPersianDigits(connection.health)}٪`}
          />
          <Metric
            icon={<Zap size={13} />}
            label="زمان پاسخ"
            value={
              connection.status === "offline"
                ? "—"
                : `${toPersianDigits(connection.latencyMs)} ms`
            }
          />
          <Metric
            icon={<Database size={13} />}
            label="رکوردهای دریافت‌شده"
            value={formatPersianNumber(connection.recordsSynced)}
          />
          <Metric
            icon={<Activity size={13} />}
            label="کیفیت داده"
            value={`${toPersianDigits(connection.dataQuality)}٪`}
          />
        </div>

        <p className="text-[12px] text-text-tertiary mb-1">آخرین همگام‌سازی</p>
        <p className="text-[14px] text-text-secondary mb-4">
          {connection.lastSyncLabel}
        </p>

        {connection.lastError && (
          <div className="mb-4 rounded-[10px] border border-danger/25 bg-danger-soft/40 px-3 py-2.5 flex gap-2">
            <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-danger mb-0.5">آخرین خطا</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {connection.lastError}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-[11px] text-text-tertiary mb-2">تغذیه می‌کند</p>
          <div className="flex flex-wrap gap-1.5">
            {connection.feeds.map((f) => (
              <span
                key={f}
                className="rounded-[7px] border border-etch px-2 py-1 text-[11px] text-text-secondary"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-accent/25 bg-accent-soft/30 px-4 py-3">
          <p className="text-[11px] text-accent mb-1.5">اثر مدیریتی</p>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-2">
            {connection.businessImpact}
          </p>
          <p className="text-[12px] text-text-tertiary leading-relaxed">
            <span className="text-text-secondary">اقدام: </span>
            {connection.recommendedAction}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-etch bg-void/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="text-[15px] font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
