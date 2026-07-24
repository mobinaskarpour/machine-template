"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Circle,
  Diamond,
  Square,
  Bell,
  LayoutDashboard,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import {
  getOrgWorkflow,
  resolveWorkflowBlueprint,
} from "@/config/capabilities";
import { pageLabels, uiLabels } from "@/config/labels";
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

export function OrgWorkflowView({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const org = getOrgWorkflow(workflowId);
  const blueprint = resolveWorkflowBlueprint(workflowId);
  const nodes = useMemo(() => blueprint?.processSteps ?? [], [blueprint]);
  const edges = useMemo(() => blueprint?.connections ?? [], [blueprint]);

  const canvas = useMemo(() => {
    if (!nodes.length) return { width: 640, height: 420 };
    return {
      width: Math.max(640, Math.max(...nodes.map((n) => n.x)) + NODE_W + 64),
      height: Math.max(420, Math.max(...nodes.map((n) => n.y)) + NODE_H + 64),
    };
  }, [nodes]);

  if (!org || !blueprint) {
    return (
      <AppShell pageTitle={pageLabels.workflows}>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-[15px] text-text-secondary">گردش‌کار یافت نشد</p>
          <button
            type="button"
            onClick={() => router.push("/workflows")}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-[13px] text-text-inverse cursor-pointer"
          >
            بازگشت به فهرست گردش‌کارها
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={org.name}>
      <div className="px-5 py-8 md:px-10 max-w-[1200px] mx-auto pb-28">
        <button
          type="button"
          onClick={() => router.push("/workflows")}
          className="inline-flex items-center gap-2 text-[13px] text-text-tertiary hover:text-text-secondary cursor-pointer mb-6"
        >
          <ArrowLeft size={14} className="rotate-180" />
          همه گردش‌کارها
        </button>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-8"
        >
          <p className="text-[12px] text-text-tertiary">نقشه عملیات کسب‌وکار</p>
          <h1 className="mt-2 text-[30px] font-semibold text-text-primary">
            {org.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            {blueprint.objective}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {blueprint.actors.map((a) => (
              <span
                key={a}
                className="rounded-[8px] border border-etch px-3 py-1 text-[12px] text-text-tertiary"
              >
                {a}
              </span>
            ))}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
          <div className="relative overflow-auto rounded-[18px] border border-etch bg-panel/60 p-4 md:p-6">
            <p className="mb-6 text-[12px] text-text-tertiary">
              هر گره یک عملیات کسب‌وکار است — نه دستور فنی.
            </p>
            <div
              className="relative"
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
                    id="org-edge-arrow"
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
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.soft, delay: i * 0.05 }}
                    className={cn(
                      "absolute rounded-[14px] border px-4 py-3",
                      roleStyle[node.role]
                    )}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: NODE_W,
                      minHeight: NODE_H,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Icon size={14} className="mt-0.5 shrink-0 opacity-80" />
                      <div>
                        <p className="text-[14px] font-semibold leading-snug">
                          {node.label}
                        </p>
                        {node.owner && (
                          <p className="mt-1 text-[11px] opacity-75">
                            مسئول: {node.owner}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[14px] border border-etch bg-slab/70 p-5">
              <p className="text-[12px] text-text-tertiary">ارزش کسب‌وکار</p>
              <p className="mt-2 text-[14px] text-text-primary leading-relaxed">
                {blueprint.businessValue}
              </p>
            </div>
            <div className="rounded-[14px] border border-primary/30 bg-primary-soft p-5">
              <p className="text-[12px] text-text-tertiary">بازده مورد انتظار</p>
              <p className="mt-2 text-[14px] text-text-primary leading-relaxed">
                {blueprint.expectedRoi}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboards/${org.relatedDashboardId}`)
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] border border-accent/40 bg-accent-soft px-4 py-3 text-[13px] text-accent cursor-pointer"
            >
              <LayoutDashboard size={14} />
              {uiLabels.openDashboard} مرتبط
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-[10px] border border-etch px-4 py-3 text-[13px] text-text-tertiary cursor-pointer"
            >
              بازگشت به {pageLabels.home}
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
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none"
      stroke="var(--etch-strong)"
      strokeWidth="1.5"
      markerEnd="url(#org-edge-arrow)"
    />
  );
}
