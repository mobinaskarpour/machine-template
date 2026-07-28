import { nowIso, shortStableHash } from "../../shared/ids.js";
import { MAX_REPAIR_ATTEMPTS_PER_ISSUE } from "../quality-thresholds.js";
import type { QualityIssue } from "../quality-issue-schema.js";
import {
  parseRepairPlan,
  type RepairPlan,
  type RepairStrategy,
} from "./repair-plan-schema.js";
import { isAllowedRepairPath } from "./repair-file-policy.js";

const DEFAULT_VALIDATION_CHECKS = [
  "source-policy",
  "typecheck",
  "tests",
  "build",
  "security-scan",
  "route-integrity",
];

function strategyForIssue(issue: QualityIssue): RepairStrategy {
  if (issue.repairability === "AUTO_DETERMINISTIC") return "DETERMINISTIC";
  if (issue.repairability === "AUTO_CODEX") return "CODEX";
  return "MANUAL";
}

function allowedPathsForIssue(issue: QualityIssue): string[] {
  const fromIssue = issue.affectedFiles
    .map((p) => p.replace(/\\/g, "/").replace(/^\.\//, ""))
    .filter((p) => isAllowedRepairPath(p));
  if (fromIssue.length > 0) return [...new Set(fromIssue)].sort();
  return ["src/"];
}

function validationChecksForIssue(issue: QualityIssue): string[] {
  const checks = new Set(DEFAULT_VALIDATION_CHECKS);
  if (issue.category === "RTL" || issue.category === "CONTENT") {
    checks.add("static-source");
    checks.add("content-quality");
  }
  if (issue.category === "ROUTE") checks.add("routes");
  if (issue.category === "SECURITY") checks.add("security-scan");
  if (issue.category === "DATA_INTEGRITY") checks.add("mock-data-integrity");
  if (issue.category === "BLUEPRINT_COVERAGE") checks.add("blueprint-coverage");
  return [...checks].sort();
}

function reasonForIssue(issue: QualityIssue, strategy: RepairStrategy): string {
  if (strategy === "DETERMINISTIC") {
    return `Safe deterministic repair for ${issue.category}: ${issue.title}`;
  }
  if (strategy === "CODEX") {
    return `Codex-scoped repair candidate for ${issue.category}: ${issue.title}`;
  }
  return `Manual review required for ${issue.category}: ${issue.title}`;
}

/**
 * Build a repair plan for OPEN issues.
 * AUTO_DETERMINISTIC → DETERMINISTIC, AUTO_CODEX → CODEX, else MANUAL.
 */
export function buildRepairPlan(input: {
  qualityRunId: string;
  sourceGenerationId: string;
  issues: QualityIssue[];
  maximumAttempts?: number;
}): RepairPlan {
  const open = input.issues.filter((i) => i.status === "OPEN");
  const planned = open.map((issue) => {
    const strategy = strategyForIssue(issue);
    return {
      issueId: issue.id,
      strategy,
      allowedPaths: allowedPathsForIssue(issue),
      validationChecks: validationChecksForIssue(issue),
      reason: reasonForIssue(issue, strategy),
    };
  });

  const repairPlanId = `rp_${shortStableHash(
    `${input.qualityRunId}:${input.sourceGenerationId}:${planned.map((p) => p.issueId).join(",")}`,
  )}`;

  return parseRepairPlan({
    schemaVersion: "1.0",
    repairPlanId,
    qualityRunId: input.qualityRunId,
    sourceGenerationId: input.sourceGenerationId,
    issues: planned,
    maximumAttempts: input.maximumAttempts ?? MAX_REPAIR_ATTEMPTS_PER_ISSUE,
    generatedAt: nowIso(),
  });
}
