import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";

/**
 * Visual QA requires a browser. Returns null score when unavailable.
 */
export async function auditVisual(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  if (!ctx.browserAvailable) {
    return {
      auditorId: "visual",
      score: null,
      issues: [],
      skipped: "browser QA unavailable",
    };
  }

  // Browser visual checks are owned by the runtime/browser runner (not in CORE).
  // When browser is marked available but runner is not wired yet, skip honestly.
  return {
    auditorId: "visual",
    score: null,
    issues: [],
    skipped: "browser visual runner not executed in CORE auditors",
  };
}
