import { z } from "zod";
import { AppError } from "../../shared/errors.js";
import { RepairStrategySchema } from "./repair-plan-schema.js";

export const RepairAttemptStatusSchema = z.enum([
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
]);

export const RepairAttemptSchema = z.object({
  attempt: z.number().int().nonnegative(),
  issueId: z.string().min(1),
  strategy: RepairStrategySchema,
  status: RepairAttemptStatusSchema,
  filesChanged: z.array(z.string()),
  notes: z.string(),
  at: z.string(),
});

export const RepairManifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  repairManifestId: z.string().min(1),
  repairPlanId: z.string().min(1),
  qualityRunId: z.string().min(1),
  attempts: z.array(RepairAttemptSchema),
  filesChanged: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RepairAttempt = z.infer<typeof RepairAttemptSchema>;
export type RepairManifest = z.infer<typeof RepairManifestSchema>;

export function parseRepairManifest(data: unknown): RepairManifest {
  const parsed = RepairManifestSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid RepairManifest", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
