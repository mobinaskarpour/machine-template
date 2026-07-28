import type { QualityIssue } from "./quality-issue-schema.js";
import {
  isBlockingIssue,
  pickHigherSeverity,
  severityRank,
} from "./issue-classifier.js";

/**
 * Merge duplicate issues by fingerprint, keeping the highest severity
 * and unioning evidence / affected paths.
 */
export function deduplicateIssues(issues: QualityIssue[]): QualityIssue[] {
  const byFp = new Map<string, QualityIssue>();

  for (const issue of issues) {
    const existing = byFp.get(issue.fingerprint);
    if (!existing) {
      byFp.set(issue.fingerprint, {
        ...issue,
        blocking: isBlockingIssue(issue.severity, issue.category),
      });
      continue;
    }

    const severity = pickHigherSeverity(existing.severity, issue.severity);
    const winner =
      severityRank(issue.severity) > severityRank(existing.severity)
        ? issue
        : existing;
    const loser = winner === issue ? existing : issue;

    byFp.set(issue.fingerprint, {
      ...winner,
      severity,
      blocking: isBlockingIssue(severity, winner.category),
      description:
        winner.description.length >= loser.description.length
          ? winner.description
          : loser.description,
      evidence: mergeEvidence(winner.evidence, loser.evidence),
      affectedFiles: uniqueSorted([
        ...winner.affectedFiles,
        ...loser.affectedFiles,
      ]),
      affectedRoutes: uniqueSorted([
        ...winner.affectedRoutes,
        ...loser.affectedRoutes,
      ]),
      blueprintReferences: uniqueSorted([
        ...winner.blueprintReferences,
        ...loser.blueprintReferences,
      ]),
      updatedAt:
        winner.updatedAt >= loser.updatedAt ? winner.updatedAt : loser.updatedAt,
    });
  }

  return [...byFp.values()].sort((a, b) => {
    const sev = severityRank(b.severity) - severityRank(a.severity);
    if (sev !== 0) return sev;
    return a.fingerprint.localeCompare(b.fingerprint);
  });
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.replace(/\\/g, "/")))].sort();
}

function mergeEvidence(
  a: QualityIssue["evidence"],
  b: QualityIssue["evidence"],
): QualityIssue["evidence"] {
  const seen = new Set<string>();
  const out: QualityIssue["evidence"] = [];
  for (const item of [...a, ...b]) {
    const key = `${item.type}:${item.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
