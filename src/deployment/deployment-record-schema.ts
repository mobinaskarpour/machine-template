import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const DeploymentStatusSchema = z.enum([
  "PENDING",
  "STARTING",
  "HEALTHY",
  "UNHEALTHY",
  "STOPPED",
  "FAILED",
  "ROLLED_BACK",
]);

export const DeploymentRecordSchema = z.object({
  schemaVersion: z.literal("1.0"),
  deploymentId: z.string(),
  companyId: z.string(),
  companySlug: z.string(),
  generationId: z.string(),
  gateId: z.string(),
  processName: z.string(),
  color: z.enum(["blue", "green"]),
  port: z.number().int().positive(),
  bindAddress: z.literal("127.0.0.1"),
  status: DeploymentStatusSchema,
  publicUrl: z.string().nullable(),
  previousDeploymentId: z.string().nullable(),
  restartCount: z.number().int().nonnegative().default(0),
  startedAt: z.string().optional(),
  healthyAt: z.string().optional(),
  stoppedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type DeploymentRecord = z.infer<typeof DeploymentRecordSchema>;

export function parseDeploymentRecord(data: unknown): DeploymentRecord {
  const parsed = DeploymentRecordSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("DEPLOYMENT_PLAN_INVALID", "Invalid DeploymentRecord", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
