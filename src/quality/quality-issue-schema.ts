import { z } from "zod";
import { AppError } from "../shared/errors.js";
import { nowIso, shortStableHash } from "../shared/ids.js";

export const QualityIssueCategorySchema = z.enum([
  "BUILD",
  "TYPECHECK",
  "TEST",
  "ROUTE",
  "BLUEPRINT_COVERAGE",
  "FUNCTIONAL",
  "DATA_INTEGRITY",
  "VISUAL",
  "RESPONSIVE",
  "RTL",
  "ACCESSIBILITY",
  "PERFORMANCE",
  "SECURITY",
  "CONTENT",
  "DEPENDENCY",
]);

export const QualityIssueSeveritySchema = z.enum([
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const QualityIssueRepairabilitySchema = z.enum([
  "AUTO_DETERMINISTIC",
  "AUTO_CODEX",
  "MANUAL_REVIEW",
  "NOT_REPAIRABLE",
]);

export const QualityIssueStatusSchema = z.enum([
  "OPEN",
  "PLANNED",
  "REPAIRED",
  "VERIFIED",
  "ACCEPTED_RISK",
  "UNRESOLVED",
]);

export const QualityIssueEvidenceSchema = z.object({
  type: z.enum([
    "FILE",
    "ROUTE",
    "SCREENSHOT",
    "COMMAND",
    "TEST",
    "METRIC",
    "BLUEPRINT_REFERENCE",
  ]),
  value: z.string(),
  sanitized: z.boolean(),
});

export const QualityIssueSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1),
  qualityRunId: z.string().min(1),
  category: QualityIssueCategorySchema,
  severity: QualityIssueSeveritySchema,
  title: z.string().min(1),
  description: z.string(),
  evidence: z.array(QualityIssueEvidenceSchema),
  affectedFiles: z.array(z.string()),
  affectedRoutes: z.array(z.string()),
  blueprintReferences: z.array(z.string()),
  repairability: QualityIssueRepairabilitySchema,
  blocking: z.boolean(),
  fingerprint: z.string().min(1),
  status: QualityIssueStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QualityIssue = z.infer<typeof QualityIssueSchema>;
export type QualityIssueCategory = z.infer<typeof QualityIssueCategorySchema>;
export type QualityIssueSeverity = z.infer<typeof QualityIssueSeveritySchema>;
export type QualityIssueRepairability = z.infer<
  typeof QualityIssueRepairabilitySchema
>;

export function parseQualityIssue(data: unknown): QualityIssue {
  const parsed = QualityIssueSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid QualityIssue", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}

export function parseQualityIssues(data: unknown): QualityIssue[] {
  if (!Array.isArray(data)) {
    throw new AppError("VALIDATION_ERROR", "Quality issues must be an array");
  }
  return data.map((item) => parseQualityIssue(item));
}

export type CreateQualityIssueInput = {
  qualityRunId: string;
  category: QualityIssueCategory;
  severity: QualityIssueSeverity;
  title: string;
  description: string;
  evidence?: QualityIssue["evidence"];
  affectedFiles?: string[];
  affectedRoutes?: string[];
  blueprintReferences?: string[];
  repairability?: QualityIssueRepairability;
  fingerprint: string;
  blocking: boolean;
  status?: QualityIssue["status"];
};

export function createQualityIssue(input: CreateQualityIssueInput): QualityIssue {
  const ts = nowIso();
  const id = `qi_${shortStableHash(
    `${input.qualityRunId}:${input.fingerprint}:${input.severity}`,
  )}`;
  return parseQualityIssue({
    schemaVersion: "1.0",
    id,
    qualityRunId: input.qualityRunId,
    category: input.category,
    severity: input.severity,
    title: input.title,
    description: input.description,
    evidence: input.evidence ?? [],
    affectedFiles: input.affectedFiles ?? [],
    affectedRoutes: input.affectedRoutes ?? [],
    blueprintReferences: input.blueprintReferences ?? [],
    repairability: input.repairability ?? "AUTO_CODEX",
    blocking: input.blocking,
    fingerprint: input.fingerprint,
    status: input.status ?? "OPEN",
    createdAt: ts,
    updatedAt: ts,
  });
}
