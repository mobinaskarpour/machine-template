import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore, readReleaseText } from "./auditor-fs.js";

/**
 * Static functional checks: AppShell role select and navigation links.
 */
export async function auditFunctional(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let score = 1;

  const shell =
    (await readReleaseText(ctx.releaseAppDir, "src/components/AppShell.tsx")) ??
    (await readReleaseText(ctx.releaseAppDir, "src/components/AppShell.ts"));

  if (!shell) {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "FUNCTIONAL",
      title: "AppShell component missing",
      severity: "HIGH",
      affectedFiles: ["src/components/AppShell.tsx"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "FUNCTIONAL",
        severity: "HIGH",
        title: "AppShell component missing",
        description: "Expected AppShell component for role simulation and navigation",
        evidence: [
          {
            type: "FILE",
            value: "src/components/AppShell.tsx",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/components/AppShell.tsx"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
    return { auditorId: "functional", score: 0.2, issues };
  }

  const hasRoleSelect =
    /<select[\s>]/i.test(shell) &&
    (/roles\.map/i.test(shell) || /role/i.test(shell));
  if (!hasRoleSelect) {
    score -= 0.35;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "FUNCTIONAL",
      title: "Role selector missing in AppShell",
      severity: "HIGH",
      affectedFiles: ["src/components/AppShell.tsx"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "FUNCTIONAL",
        severity: "HIGH",
        title: "Role selector missing in AppShell",
        description: "AppShell should expose a demo role <select> control",
        evidence: [
          {
            type: "FILE",
            value: "src/components/AppShell.tsx",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/components/AppShell.tsx"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
  }

  const hasNavLinks =
    /<Link[\s>]/i.test(shell) ||
    /href=\{item\.route\}/i.test(shell) ||
    /navigation/i.test(shell);
  if (!hasNavLinks) {
    score -= 0.35;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "FUNCTIONAL",
      title: "Navigation links missing in AppShell",
      severity: "HIGH",
      affectedFiles: ["src/components/AppShell.tsx"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "FUNCTIONAL",
        severity: "HIGH",
        title: "Navigation links missing in AppShell",
        description: "AppShell should render navigation links from runtime",
        evidence: [
          {
            type: "FILE",
            value: "src/components/AppShell.tsx",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/components/AppShell.tsx"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
  }

  const primaryCount = ctx.runtime?.navigation?.primary?.length ?? 0;
  if (primaryCount === 0) {
    score -= 0.2;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "FUNCTIONAL",
      title: "Empty primary navigation",
      severity: "MEDIUM",
      affectedFiles: ["src/data/blueprint-runtime.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "FUNCTIONAL",
        severity: "MEDIUM",
        title: "Empty primary navigation",
        description: "Runtime primary navigation has no items",
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

  return { auditorId: "functional", score: clampScore(score), issues };
}
