import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const QualityReportScoresSchema = z.object({
  buildIntegrity: z.number().min(0).max(1),
  functionalCorrectness: z.number().min(0).max(1),
  blueprintCoverage: z.number().min(0).max(1),
  dataIntegrity: z.number().min(0).max(1),
  visualQuality: z.number().min(0).max(1).nullable(),
  responsiveBehavior: z.number().min(0).max(1).nullable(),
  rtlCorrectness: z.number().min(0).max(1),
  accessibility: z.number().min(0).max(1).nullable(),
  performance: z.number().min(0).max(1).nullable(),
  security: z.number().min(0).max(1),
  contentQuality: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export const QualityReportSchema = z.object({
  schemaVersion: z.literal("1.0"),
  qualityRunId: z.string().min(1),
  companyId: z.string().min(1),
  companySlug: z.string().min(1),
  qualityPolicyVersion: z.string().optional(),
  sourceGenerationId: z.string().min(1),
  acceptedGenerationId: z.string().optional(),
  sourceHashes: z
    .object({
      blueprintHash: z.string(),
      generationManifestHash: z.string(),
      releaseContentHash: z.string(),
    })
    .optional(),
  scores: QualityReportScoresSchema,
  issueCounts: z.object({
    info: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
  }),
  repairedIssueIds: z.array(z.string()),
  unresolvedIssueIds: z.array(z.string()),
  acceptedRiskIssueIds: z.array(z.string()),
  acceptance: z.object({
    accepted: z.boolean(),
    blockingReasons: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  auditorsExecuted: z.array(z.string()),
  auditorsSkipped: z.array(
    z.object({
      auditor: z.string(),
      reason: z.string(),
    }),
  ),
  createdAt: z.string(),
  completedAt: z.string(),
});

export type QualityReport = z.infer<typeof QualityReportSchema>;
export type QualityReportScores = z.infer<typeof QualityReportScoresSchema>;

export function parseQualityReport(data: unknown): QualityReport {
  const parsed = QualityReportSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid QualityReport", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
