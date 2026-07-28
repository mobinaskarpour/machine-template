import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const QualityRunAuditorStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "PASSED",
  "FAILED",
  "SKIPPED",
]);

export const QualityRunStatusSchema = z.enum([
  "QUEUED",
  "AUDITING",
  "ISSUES_FOUND",
  "REPAIRING",
  "REVALIDATING",
  "ACCEPTED",
  "REJECTED",
  "FAILED",
]);

export const QualityRunSchema = z.object({
  schemaVersion: z.literal("1.0"),
  qualityRunId: z.string().min(1),
  companyId: z.string().min(1),
  companySlug: z.string().min(1),
  generationId: z.string().min(1),
  qualityPolicyVersion: z.string().optional(),
  sourceHashes: z.object({
    blueprintHash: z.string(),
    generationManifestHash: z.string(),
    releaseContentHash: z.string(),
  }),
  status: QualityRunStatusSchema,
  iteration: z.number().int().nonnegative(),
  maximumIterations: z.number().int().positive(),
  auditors: z.array(
    z.object({
      id: z.string(),
      required: z.boolean(),
      status: QualityRunAuditorStatusSchema,
    }),
  ),
  issueIds: z.array(z.string()),
  repairPlanIds: z.array(z.string()),
  baselineScore: z.number().min(0).max(1).optional(),
  finalScore: z.number().min(0).max(1).optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QualityRun = z.infer<typeof QualityRunSchema>;

export function parseQualityRun(data: unknown): QualityRun {
  const parsed = QualityRunSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid QualityRun", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
