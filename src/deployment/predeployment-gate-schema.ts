import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const AdvisorySummarySchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  moderate: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  packages: z.array(
    z.object({
      name: z.string(),
      severity: z.string(),
      via: z.array(z.string()),
    }),
  ),
});

export const DependencyGateSchema = z.object({
  passed: z.boolean(),
  blockingReasons: z.array(z.string()),
  warnings: z.array(z.string()),
  acceptedRiskIds: z.array(z.string()),
});

export const BrowserPredeployQaResultSchema = z.object({
  available: z.boolean(),
  passed: z.boolean(),
  criticalIssuesClear: z.boolean(),
  accessibilityCriticalClear: z.boolean(),
  screenshots: z.array(z.string()),
  routesChecked: z.array(z.string()),
  consoleErrors: z.array(z.string()),
  viewports: z.array(z.string()),
  reason: z.string().optional(),
});

export const PreDeploymentCheckSchema = z.object({
  id: z.string(),
  required: z.boolean(),
  passed: z.boolean(),
  message: z.string().optional(),
});

export const PreDeploymentGateResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  gateId: z.string(),
  companyId: z.string(),
  companySlug: z.string(),
  generationId: z.string(),
  qualityRunId: z.string().optional(),
  publicExposureRequested: z.boolean(),
  checks: z.array(PreDeploymentCheckSchema),
  dependencyAudit: AdvisorySummarySchema,
  dependencyGate: DependencyGateSchema,
  browserQa: BrowserPredeployQaResultSchema,
  passed: z.boolean(),
  blockingReasons: z.array(z.string()),
  warnings: z.array(z.string()),
  createdAt: z.string(),
});

export type PreDeploymentCheck = z.infer<typeof PreDeploymentCheckSchema>;
export type PreDeploymentGateResult = z.infer<typeof PreDeploymentGateResultSchema>;

export function parsePreDeploymentGateResult(data: unknown): PreDeploymentGateResult {
  const parsed = PreDeploymentGateResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid PreDeploymentGateResult", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
