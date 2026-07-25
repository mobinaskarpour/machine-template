import type { ConcernDomain } from "@/types/intelligence";
import {
  getDashboardBlueprint,
  getWorkflowBlueprint,
} from "@/lib/intelligence/blueprints";
import { dashboards, workflows } from "@/lib/demo/config";

export type CapabilityStatus = "active" | "attention" | "proposed";

export interface OrgDashboard {
  id: string;
  domain: ConcernDomain;
  name: string;
  summary: string;
  question: string;
  status: CapabilityStatus;
  relatedWorkflowId: string;
}

export interface OrgWorkflow {
  id: string;
  domain: ConcernDomain;
  name: string;
  summary: string;
  status: CapabilityStatus;
  relatedDashboardId: string;
  actors: string[];
}

/** Stable organization capabilities — loaded from config/dashboards.json */
export const orgDashboards = dashboards.items as OrgDashboard[];

/** Stable organization workflows — loaded from config/workflows.json */
export const orgWorkflows = workflows.items as OrgWorkflow[];

/** Map overview KPI / twin / insight signals → specialized dashboard */
export const overviewEntryMap: Record<string, string> = {
  ...dashboards.overviewEntryMap,
};

export function dashboardEntryFor(signal: string): string {
  return overviewEntryMap[signal] ?? "db-risk";
}

export function getOrgDashboard(id: string): OrgDashboard | undefined {
  return orgDashboards.find((d) => d.id === id);
}

export function getOrgWorkflow(id: string): OrgWorkflow | undefined {
  return orgWorkflows.find((w) => w.id === id);
}

export function resolveDashboardBlueprint(id: string) {
  const org = getOrgDashboard(id);
  if (!org) return null;
  return getDashboardBlueprint(org.domain);
}

export function resolveWorkflowBlueprint(id: string) {
  const org = getOrgWorkflow(id);
  if (!org) return null;
  return getWorkflowBlueprint(org.domain);
}

export const statusLabel: Record<CapabilityStatus, string> = dashboards.statusLabels as Record<
  CapabilityStatus,
  string
>;
