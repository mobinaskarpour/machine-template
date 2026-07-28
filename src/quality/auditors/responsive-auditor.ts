import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import {
  clampScore,
  listReleaseTextFiles,
  readReleaseText,
  toRel,
} from "./auditor-fs.js";

/**
 * Responsive auditor: null/skipped without browser, with optional static
 * overflow-x heuristics that have low score impact when no browser.
 */
export async function auditResponsive(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  if (ctx.browserAvailable) {
    return {
      auditorId: "responsive",
      score: null,
      issues: [],
      skipped: "browser responsive runner not executed in CORE auditors",
    };
  }

  // Static heuristics when browser QA is unavailable
  const issues = [];
  let score = 0.85; // baseline confidence for static-only responsive check
  const files = await listReleaseTextFiles(ctx.releaseAppDir, {
    underSrcOnly: true,
  });

  let overflowHits = 0;
  for (const full of files) {
    const rel = toRel(ctx.releaseAppDir, full);
    if (!/\.(tsx|jsx|css)$/.test(rel)) continue;
    const text = (await readReleaseText(ctx.releaseAppDir, rel)) ?? "";
    // Unbounded overflow-x:scroll without min-w-0 / overflow-x-auto container hints
    if (/overflow-x-scroll/.test(text) && !/min-w-0/.test(text)) {
      overflowHits += 1;
      if (overflowHits <= 3) {
        const { fingerprint, blocking } = classifyIssueFields({
          category: "RESPONSIVE",
          title: "Potential horizontal overflow",
          severity: "LOW",
          affectedFiles: [rel],
        });
        issues.push(
          createQualityIssue({
            qualityRunId: ctx.qualityRunId,
            category: "RESPONSIVE",
            severity: "LOW",
            title: "Potential horizontal overflow",
            description: `overflow-x-scroll without min-w-0 in ${rel}`,
            evidence: [{ type: "FILE", value: rel, sanitized: true }],
            affectedFiles: [rel],
            fingerprint,
            blocking,
            repairability: "AUTO_CODEX",
          }),
        );
      }
    }
  }

  // Low score impact for static-only findings
  score -= Math.min(0.15, overflowHits * 0.03);

  return {
    auditorId: "responsive",
    score: clampScore(score),
    issues,
    skipped: "browser QA unavailable",
  };
}
