import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import {
  clampScore,
  fileExists,
  readReleaseText,
} from "./auditor-fs.js";

/**
 * Static source checks: package.json present, no .env, lang/dir from layout.
 */
export async function auditStaticSource(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let score = 1;

  const hasPkg = await fileExists(ctx.releaseAppDir, "package.json");
  if (!hasPkg) {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "BUILD",
      title: "Missing package.json",
      severity: "CRITICAL",
      affectedFiles: ["package.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "BUILD",
        severity: "CRITICAL",
        title: "Missing package.json",
        description: "Release app directory does not contain package.json",
        evidence: [
          { type: "FILE", value: "package.json", sanitized: true },
        ],
        affectedFiles: ["package.json"],
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
      }),
    );
    score -= 0.5;
  }

  for (const envName of [".env", ".env.local", ".env.production"]) {
    if (await fileExists(ctx.releaseAppDir, envName)) {
      const { fingerprint, blocking } = classifyIssueFields({
        category: "SECURITY",
        title: "Environment file present in release",
        severity: "CRITICAL",
        affectedFiles: [envName],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "SECURITY",
          severity: "CRITICAL",
          title: "Environment file present in release",
          description: `Release must not include ${envName}`,
          evidence: [{ type: "FILE", value: envName, sanitized: true }],
          affectedFiles: [envName],
          fingerprint,
          blocking,
          repairability: "AUTO_DETERMINISTIC",
        }),
      );
      score -= 0.3;
    }
  }

  const layout =
    (await readReleaseText(ctx.releaseAppDir, "src/app/layout.tsx")) ??
    (await readReleaseText(ctx.releaseAppDir, "src/app/layout.ts"));
  if (layout) {
    const expectsRtl = Boolean(ctx.blueprint.company.rtl);
    const langFa = /lang=["']fa["']/i.test(layout) || /lang=\{[^}]*fa/i.test(layout);
    const dirRtl = /dir=["']rtl["']/i.test(layout) || /dir=\{[^}]*rtl/i.test(layout);
    const hasLang = /lang=/.test(layout);
    const hasDir = /dir=/.test(layout);
    if (!hasLang || !hasDir) {
      const { fingerprint, blocking } = classifyIssueFields({
        category: "CONTENT",
        title: "Layout missing lang or dir attributes",
        severity: "MEDIUM",
        affectedFiles: ["src/app/layout.tsx"],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "CONTENT",
          severity: "MEDIUM",
          title: "Layout missing lang or dir attributes",
          description: "Root layout should declare lang and dir for locale correctness",
          evidence: [
            { type: "FILE", value: "src/app/layout.tsx", sanitized: true },
          ],
          affectedFiles: ["src/app/layout.tsx"],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
      score -= 0.1;
    } else if (expectsRtl && !(langFa || dirRtl)) {
      // Soft check — RTL auditor owns hard failure; note static mismatch
      score -= 0.05;
    }
  } else {
    score -= 0.15;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "BUILD",
      title: "Root layout not found",
      severity: "HIGH",
      affectedFiles: ["src/app/layout.tsx"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "BUILD",
        severity: "HIGH",
        title: "Root layout not found",
        description: "Could not read src/app/layout.tsx for lang/dir checks",
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

  return {
    auditorId: "static-source",
    score: clampScore(score),
    issues,
  };
}
