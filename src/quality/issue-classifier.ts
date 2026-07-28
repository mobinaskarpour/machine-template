import { shortStableHash } from "../shared/ids.js";
import type {
  QualityIssue,
  QualityIssueCategory,
  QualityIssueSeverity,
} from "./quality-issue-schema.js";

const SEVERITY_RANK: Record<QualityIssueSeverity, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const BLOCKING_HIGH_CATEGORIES = new Set<QualityIssueCategory>([
  "BUILD",
  "TYPECHECK",
  "TEST",
  "SECURITY",
  "ROUTE",
]);

/**
 * Deterministic fingerprint from category + title + sorted files + routes.
 */
export function computeIssueFingerprint(input: {
  category: QualityIssueCategory;
  title: string;
  affectedFiles?: string[];
  affectedRoutes?: string[];
}): string {
  const files = [...(input.affectedFiles ?? [])].map(normalizePath).sort();
  const routes = [...(input.affectedRoutes ?? [])].map(String).sort();
  const raw = [
    input.category,
    input.title.trim().toLowerCase(),
    files.join("|"),
    routes.join("|"),
  ].join("::");
  return shortStableHash(raw, 16);
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Blocking if CRITICAL, or HIGH in BUILD|TYPECHECK|TEST|SECURITY|ROUTE.
 */
export function isBlockingIssue(
  severity: QualityIssueSeverity,
  category: QualityIssueCategory,
): boolean {
  if (severity === "CRITICAL") return true;
  if (severity === "HIGH" && BLOCKING_HIGH_CATEGORIES.has(category)) return true;
  return false;
}

export function severityRank(severity: QualityIssueSeverity): number {
  return SEVERITY_RANK[severity];
}

export function classifyIssueFields(input: {
  category: QualityIssueCategory;
  title: string;
  severity: QualityIssueSeverity;
  affectedFiles?: string[];
  affectedRoutes?: string[];
}): { fingerprint: string; blocking: boolean } {
  const fingerprint = computeIssueFingerprint(input);
  const blocking = isBlockingIssue(input.severity, input.category);
  return { fingerprint, blocking };
}

export function pickHigherSeverity(
  a: QualityIssueSeverity,
  b: QualityIssueSeverity,
): QualityIssueSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

export function annotateIssueBlocking(issue: QualityIssue): QualityIssue {
  return {
    ...issue,
    blocking: isBlockingIssue(issue.severity, issue.category),
  };
}
