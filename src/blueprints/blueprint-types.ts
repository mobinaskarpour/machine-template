export type TraceReference = {
  sourceType: "COMPANY_KNOWLEDGE" | "INDUSTRY_PACK" | "MASTER_SPECIFICATION";
  sourceId: string;
  reason: string;
};

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type BlueprintLimits = {
  maxHighDashboards: number;
  maxTotalDashboards: number;
  maxWidgetsPerDashboard: number;
  maxWorkflows: number;
  maxAgents: number;
  maxEntities: number;
  maxModules: number;
};

export const DEFAULT_BLUEPRINT_LIMITS: BlueprintLimits = {
  maxHighDashboards: 8,
  maxTotalDashboards: 12,
  maxWidgetsPerDashboard: 12,
  maxWorkflows: 15,
  maxAgents: 10,
  maxEntities: 28,
  maxModules: 14,
};
