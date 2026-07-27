"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Circle, Diamond, Square, Bell } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useIntelligenceStore } from "@/store/intelligence-store";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { BusinessEdge, BusinessNode } from "@/types/intelligence";

const roleStyle = {
  start: "border-success/40 bg-success-soft text-success",
  action: "border-etch-strong bg-slab text-text-primary",
  decision: "border-warning/40 bg-warning-soft text-warning",
  notify: "border-accent/40 bg-accent-soft text-accent",
  end: "border-primary/40 bg-primary-soft text-primary",
};

const roleIcon = {
  start: Circle,
  action: Square,
  decision: Diamond,
  notify: Bell,
  end: Circle,
};

const NODE_W = 220;
const NODE_H = 88;

export function WorkflowBuilderPage({
  recommendationId,
}: {
  recommendationId: string;
}) {
  const router = useRouter();
  const rec = useIntelligenceStore((s) => s.getById(recommendationId));
  const workflow = rec?.workflow;

  const nodes = useMemo(() => workflow?.processSteps ?? [], [workflow]);
  const edges = useMemo(() => workflow?.connections ?? [], [workflow]);

  const canvas = useMemo(() => {
    if (!nodes.length) return { width: 640, height: 480 };
    const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W + 64;
    const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H + 64;
    return { width: Math.max(640, maxX), height: Math.max(420, maxY) };
  }, [nodes]);

  if (!workflow || rec?.status !== "approved") {
    return (
      <AppShell pageTitle="نقشه فرآیند کسب‌وکار">
        <EmptyState
          title="گردش‌کار تأییدشده‌ای برای نمایش نیست"
          action={() => router.push("/chat")}
          actionLabel="بازگشت به فضای کار"
        />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={workflow.name}>
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1280px] mx-auto pb-24">
        <motion.header
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={spring.soft}
          className="mb-10"
        >
          <p className="text-[13px] text-text-tertiary">نقشه عملیات کسب‌وکار</p>
          <h1 className="mt-2 text-[32px] font-semibold text-text-primary">
            {workflow.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {workflow.objective}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {workflow.actors.map((a) => (
              <span
                key={a}
                className="rounded-[8px] border border-etch px-3 py-1 text-[12px] text-text-tertiary"
              >
                {a}
              </span>
            ))}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-10">
          <motion.div
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={spring.panel}
            className="relative overflow-auto rounded-[18px] border border-etch bg-panel/60 backdrop-blur-md"
          >
            <div className="sticky top-0 z-10 border-b border-etch bg-panel/90 px-6 py-3 backdrop-blur-md">
              <p className="text-[12px] text-text-tertiary">
                هر گره یک عملیات کسب‌وکار است — نه دستور فنی.
              </p>
            </div>

            <div
              className="relative m-4 md:m-6"
              style={{ width: canvas.width, height: canvas.height }}
            >
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvas.width}
                height={canvas.height}
                aria-hidden
              >
                <defs>
                  <marker
                    id="edge-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--etch-strong)" />
                  </marker>
                </defs>
                {edges.map((edge) => (
                  <EdgePath key={edge.id} edge={edge} nodes={nodes} />
                ))}
              </svg>

              {nodes.map((node, i) => {
                const Icon = roleIcon[node.role];
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ ...spring.soft, delay: i * 0.06 }}
                    whileHover={{ y: -2, transition: spring.gentle }}
                    className={cn(
                      "absolute rounded-[14px] border px-4 py-3 backdrop-blur-sm shadow-[var(--shadow-sm)]",
                      roleStyle[node.role]
                    )}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: NODE_W,
                      minHeight: NODE_H,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        size={15}
                        strokeWidth={1.6}
                        className="mt-0.5 shrink-0 opacity-80"
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold leading-snug">
                          {node.label}
                        </p>
                        {node.owner && (
                          <p className="mt-1 text-[11px] opacity-75">
                            مسئول: {node.owner}
                          </p>
                        )}
                        {node.description && (
                          <p className="mt-1 text-[11px] opacity-65 leading-relaxed">
                            {node.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <aside className="space-y-5">
            <SideCard title="ارزش کسب‌وکار" body={workflow.businessValue} />
            <SideCard
              title="بازده مورد انتظار"
              body={workflow.expectedRoi}
              accent
            />
            <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
              <p className="text-[12px] text-text-tertiary mb-3">بهبود شاخص‌ها</p>
              <ul className="space-y-2">
                {workflow.kpiImprovements.map((k) => (
                  <li
                    key={k}
                    className="text-[13px] text-text-secondary leading-relaxed"
                  >
                    · {k}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
              <p className="text-[12px] text-text-tertiary mb-3">
                فرصت‌های هوشمندسازی
              </p>
              <ul className="space-y-2">
                {workflow.automationOpportunities.map((a) => (
                  <li
                    key={a}
                    className="text-[13px] text-text-secondary leading-relaxed"
                  >
                    · {a}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="w-full rounded-[10px] border border-etch px-4 py-3 text-[13px] text-text-secondary cursor-pointer hover:border-border-hover inline-flex items-center justify-center gap-2"
            >
              <ArrowRight size={14} className="rotate-180" />
              بازگشت به جلسه اجرایی
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function EdgePath({
  edge,
  nodes,
}: {
  edge: BusinessEdge;
  nodes: BusinessNode[];
}) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;

  return (
    <motion.path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none"
      stroke="var(--etch-strong)"
      strokeWidth="1.5"
      markerEnd="url(#edge-arrow)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.85 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function SideCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border p-5",
        accent ? "border-primary/30 bg-primary-soft" : "border-etch bg-slab/70"
      )}
    >
      <p className="text-[12px] text-text-tertiary">{title}</p>
      <p className="mt-2 text-[14px] text-text-primary leading-relaxed">{body}</p>
    </div>
  );
}

function EmptyState({
  title,
  action,
  actionLabel,
}: {
  title: string;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <p className="text-[15px] text-text-secondary">{title}</p>
      <button
        type="button"
        onClick={action}
        className="rounded-[10px] bg-primary px-4 py-2.5 text-[13px] text-text-inverse cursor-pointer"
      >
        {actionLabel}
      </button>
    </div>
  );
}
