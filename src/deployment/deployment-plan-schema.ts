import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const DeploymentPlanSchema = z.object({
  schemaVersion: z.literal("1.0"),
  planId: z.string(),
  companyId: z.string(),
  companySlug: z.string(),
  generationId: z.string(),
  gateId: z.string(),
  processName: z.string(),
  color: z.enum(["blue", "green"]),
  port: z.number().int().positive(),
  bindAddress: z.literal("127.0.0.1"),
  publicExposureRequested: z.boolean(),
  strategy: z.literal("BLUE_GREEN"),
  previousDeploymentId: z.string().optional(),
  dryRun: z.boolean(),
  createdAt: z.string(),
});

export type DeploymentPlan = z.infer<typeof DeploymentPlanSchema>;

export function parseDeploymentPlan(data: unknown): DeploymentPlan {
  const parsed = DeploymentPlanSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("DEPLOYMENT_PLAN_INVALID", "Invalid DeploymentPlan", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
