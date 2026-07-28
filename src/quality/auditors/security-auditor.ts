import { scanGeneratedAppSecurity } from "../../generation/generated-app-security-scan.js";
import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import type { QualityIssueSeverity } from "../quality-issue-schema.js";
import { clampScore } from "./auditor-fs.js";

function mapSeverity(
  s: "high" | "medium" | "low",
): QualityIssueSeverity {
  if (s === "high") return "HIGH";
  if (s === "medium") return "MEDIUM";
  return "LOW";
}

/**
 * Reuse generation security scan and map findings to quality issues.
 */
export async function auditSecurity(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const scan = await scanGeneratedAppSecurity(ctx.releaseAppDir);
  const issues = [];

  for (const finding of scan.findings) {
    const severity = mapSeverity(finding.severity);
    const title = `Security finding: ${finding.path}`;
    const { fingerprint, blocking } = classifyIssueFields({
      category: "SECURITY",
      title,
      severity,
      affectedFiles: [finding.path],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "SECURITY",
        severity,
        title,
        description: finding.snippet.slice(0, 200),
        evidence: [
          { type: "FILE", value: finding.path, sanitized: true },
          { type: "METRIC", value: finding.severity, sanitized: true },
        ],
        affectedFiles: [finding.path],
        fingerprint,
        blocking,
        repairability:
          severity === "HIGH" || severity === "CRITICAL"
            ? "AUTO_CODEX"
            : "AUTO_DETERMINISTIC",
      }),
    );
  }

  const high = scan.findings.filter((f) => f.severity === "high").length;
  const medium = scan.findings.filter((f) => f.severity === "medium").length;
  const low = scan.findings.filter((f) => f.severity === "low").length;
  const score = clampScore(1 - high * 0.35 - medium * 0.1 - low * 0.03);

  return { auditorId: "security", score, issues };
}
