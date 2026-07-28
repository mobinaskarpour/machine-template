import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import {
  clampScore,
  listReleaseTextFiles,
  readReleaseText,
  toRel,
} from "./auditor-fs.js";

const BUTTON_RE = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
const IMG_RE = /<img\b([^>]*)\/?>/gi;

/**
 * Source accessibility checks. Partial score from source when axe/browser
 * is unavailable — never null if source checks ran.
 */
export async function auditAccessibility(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let checks = 0;
  let failures = 0;

  const files = await listReleaseTextFiles(ctx.releaseAppDir, {
    underSrcOnly: true,
  });

  for (const full of files) {
    const rel = toRel(ctx.releaseAppDir, full);
    if (!/\.(tsx|jsx|html)$/.test(rel)) continue;
    const text = (await readReleaseText(ctx.releaseAppDir, rel)) ?? "";
    if (!text) continue;

    BUTTON_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BUTTON_RE.exec(text))) {
      checks += 1;
      const attrs = match[1] ?? "";
      const body = (match[2] ?? "").replace(/\{[^}]*\}/g, "x").replace(/<[^>]+>/g, "").trim();
      const hasAria = /aria-label\s*=/i.test(attrs) || /title\s*=/i.test(attrs);
      if (!body && !hasAria) {
        failures += 1;
        const { fingerprint, blocking } = classifyIssueFields({
          category: "ACCESSIBILITY",
          title: "Button without accessible name",
          severity: "MEDIUM",
          affectedFiles: [rel],
        });
        issues.push(
          createQualityIssue({
            qualityRunId: ctx.qualityRunId,
            category: "ACCESSIBILITY",
            severity: "MEDIUM",
            title: "Button without accessible name",
            description: `A <button> in ${rel} has no text or aria-label`,
            evidence: [{ type: "FILE", value: rel, sanitized: true }],
            affectedFiles: [rel],
            fingerprint,
            blocking,
            repairability: "AUTO_CODEX",
          }),
        );
      }
    }

    IMG_RE.lastIndex = 0;
    while ((match = IMG_RE.exec(text))) {
      checks += 1;
      const attrs = match[1] ?? "";
      if (!/\balt\s*=/i.test(attrs)) {
        failures += 1;
        const { fingerprint, blocking } = classifyIssueFields({
          category: "ACCESSIBILITY",
          title: "Image missing alt attribute",
          severity: "MEDIUM",
          affectedFiles: [rel],
        });
        issues.push(
          createQualityIssue({
            qualityRunId: ctx.qualityRunId,
            category: "ACCESSIBILITY",
            severity: "MEDIUM",
            title: "Image missing alt attribute",
            description: `An <img> in ${rel} is missing an alt attribute`,
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

  const score =
    checks === 0 ? 0.85 : clampScore(1 - failures / Math.max(checks, 1));

  const result: AuditorResult = {
    auditorId: "accessibility",
    score,
    issues,
  };
  if (!ctx.browserAvailable) {
    result.skipped = "browser axe unavailable; source checks only";
  }
  return result;
}
