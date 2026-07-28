import { z } from "zod";
import { AppError } from "../../shared/errors.js";

export const RepairStrategySchema = z.enum([
  "DETERMINISTIC",
  "CODEX",
  "MANUAL",
]);

export const RepairPlanIssueSchema = z.object({
  issueId: z.string().min(1),
  strategy: RepairStrategySchema,
  allowedPaths: z.array(z.string()),
  validationChecks: z.array(z.string()),
  reason: z.string(),
});

export const RepairPlanSchema = z.object({
  schemaVersion: z.literal("1.0"),
  repairPlanId: z.string().min(1),
  qualityRunId: z.string().min(1),
  sourceGenerationId: z.string().min(1),
  issues: z.array(RepairPlanIssueSchema),
  maximumAttempts: z.number().int().positive(),
  generatedAt: z.string(),
});

export type RepairStrategy = z.infer<typeof RepairStrategySchema>;
export type RepairPlanIssue = z.infer<typeof RepairPlanIssueSchema>;
export type RepairPlan = z.infer<typeof RepairPlanSchema>;

export function parseRepairPlan(data: unknown): RepairPlan {
  const parsed = RepairPlanSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid RepairPlan", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
