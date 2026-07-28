import { createQualityIssue } from "../quality-issue-schema.js";
import type { QualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore, readReleaseText } from "./auditor-fs.js";

/**
 * RTL apps must expose runtime.company.rtl and layout dir="rtl" or lang fa.
 * LTR apps score 1 when not requiring RTL.
 */
export async function auditRtl(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues: QualityIssue[] = [];
  const requiresRtl = Boolean(ctx.blueprint.company.rtl);

  if (!requiresRtl) {
    return { auditorId: "rtl", score: 1, issues };
  }

  let score = 1;
  const runtimeRtl = Boolean(ctx.runtime?.company?.rtl);
  if (!runtimeRtl) {
    score -= 0.5;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "RTL",
      title: "Runtime missing RTL flag",
      severity: "HIGH",
      affectedFiles: ["src/data/blueprint-runtime.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "RTL",
        severity: "HIGH",
        title: "Runtime missing RTL flag",
        description: "Blueprint requires RTL but runtime.company.rtl is not true",
        evidence: [
          {
            type: "FILE",
            value: "src/data/blueprint-runtime.json",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/data/blueprint-runtime.json"],
        fingerprint,
        blocking,
        repairability: "AUTO_DETERMINISTIC",
      }),
    );
  }

  const layout =
    (await readReleaseText(ctx.releaseAppDir, "src/app/layout.tsx")) ??
    (await readReleaseText(ctx.releaseAppDir, "src/app/layout.ts")) ??
    "";
  const hasDirRtl =
    /dir=["']rtl["']/i.test(layout) ||
    /dir=\{[^}]*\?[^}]*["']rtl["']/i.test(layout) ||
    /rtl\s*\?\s*["']rtl["']/i.test(layout);
  const hasLangFa =
    /lang=["']fa["']/i.test(layout) ||
    /lang=\{[^}]*fa/i.test(layout) ||
    /startsWith\(["']fa["']\)/.test(layout);

  if (!hasDirRtl && !hasLangFa) {
    score -= 0.5;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "RTL",
      title: "Layout missing RTL markers",
      severity: "HIGH",
      affectedFiles: ["src/app/layout.tsx"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "RTL",
        severity: "HIGH",
        title: "Layout missing RTL markers",
        description:
          'RTL application layout should include dir="rtl" or Persian lang handling',
        evidence: [
          { type: "FILE", value: "src/app/layout.tsx", sanitized: true },
        ],
        affectedFiles: ["src/app/layout.tsx"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
  }

  return { auditorId: "rtl", score: clampScore(score), issues };
}
