import {
  ACCEPTANCE_THRESHOLDS,
  ALLOW_SKIPPED_BROWSER_QA,
} from "./quality-thresholds.js";
import type { QualityIssue } from "./quality-issue-schema.js";
import type { QualityReportScores } from "./quality-report-schema.js";

export type AcceptanceValidationFlags = {
  typecheck: boolean;
  tests: boolean;
  build: boolean;
  securityScan: boolean;
  routeIntegrity: boolean;
  sourceHashesMatch: boolean;
  regressionPassed: boolean;
  /** When true, application expects RTL layout. */
  requiresRtl?: boolean;
};

export type AcceptanceEvaluationInput = {
  scores: Pick<
    QualityReportScores,
    | "overall"
    | "blueprintCoverage"
    | "dataIntegrity"
    | "accessibility"
    | "rtlCorrectness"
    | "visualQuality"
    | "responsiveBehavior"
    | "security"
  >;
  issues: QualityIssue[];
  validation: AcceptanceValidationFlags;
  /** Override default ALLOW_SKIPPED_BROWSER_QA policy. */
  allowSkippedBrowserQa?: boolean;
};

export type AcceptanceEvaluationResult = {
  accepted: boolean;
  blockingReasons: string[];
  warnings: string[];
};

const OPEN_STATUSES = new Set(["OPEN", "PLANNED", "UNRESOLVED"]);

/**
 * Evaluate Phase 5 acceptance gates.
 * Skipped visual/accessibility (null) produce warnings, not auto-fail,
 * when ALLOW_SKIPPED_BROWSER_QA is true.
 */
export function evaluateAcceptance(
  input: AcceptanceEvaluationInput,
): AcceptanceEvaluationResult {
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const allowSkipped =
    input.allowSkippedBrowserQa ?? ALLOW_SKIPPED_BROWSER_QA;
  const { scores, validation } = input;

  if (!validation.typecheck) {
    blockingReasons.push("Typecheck did not pass");
  }
  if (!validation.tests) {
    blockingReasons.push("Generated-app tests did not pass");
  }
  if (!validation.build) {
    blockingReasons.push("Production build did not pass");
  }
  if (!validation.routeIntegrity) {
    blockingReasons.push("Route integrity did not pass");
  }
  if (!validation.sourceHashesMatch) {
    blockingReasons.push("Release source hashes do not match");
  }
  if (!validation.regressionPassed) {
    blockingReasons.push("Full regression did not pass");
  }
  if (!validation.securityScan) {
    blockingReasons.push("Security scan did not pass");
  }

  const unresolved = input.issues.filter((i) => OPEN_STATUSES.has(i.status));

  const critical = unresolved.filter((i) => i.severity === "CRITICAL");
  if (critical.length > 0) {
    blockingReasons.push(
      `Unresolved CRITICAL issues remain (${critical.length})`,
    );
  }

  const blockingHigh = unresolved.filter(
    (i) => i.blocking && i.severity === "HIGH",
  );
  if (blockingHigh.length > 0) {
    blockingReasons.push(
      `Unresolved blocking HIGH issues remain (${blockingHigh.length})`,
    );
  }

  const securityHighOrCritical = unresolved.filter(
    (i) =>
      i.category === "SECURITY" &&
      (i.severity === "HIGH" || i.severity === "CRITICAL"),
  );
  if (securityHighOrCritical.length > 0) {
    blockingReasons.push(
      `Unresolved HIGH/CRITICAL security issues remain (${securityHighOrCritical.length})`,
    );
  }

  if (scores.blueprintCoverage < ACCEPTANCE_THRESHOLDS.blueprintCoverage) {
    blockingReasons.push(
      `Blueprint coverage ${scores.blueprintCoverage.toFixed(2)} below ${ACCEPTANCE_THRESHOLDS.blueprintCoverage}`,
    );
  }
  if (scores.dataIntegrity < ACCEPTANCE_THRESHOLDS.dataIntegrity) {
    blockingReasons.push(
      `Data integrity ${scores.dataIntegrity.toFixed(2)} below ${ACCEPTANCE_THRESHOLDS.dataIntegrity}`,
    );
  }
  if (scores.overall < ACCEPTANCE_THRESHOLDS.overall) {
    blockingReasons.push(
      `Overall quality score ${scores.overall.toFixed(2)} below ${ACCEPTANCE_THRESHOLDS.overall}`,
    );
  }

  if (validation.requiresRtl !== false) {
    // Only enforce RTL threshold when the app requires RTL
    if (validation.requiresRtl === true) {
      if (scores.rtlCorrectness < ACCEPTANCE_THRESHOLDS.rtlCorrectness) {
        blockingReasons.push(
          `RTL correctness ${scores.rtlCorrectness.toFixed(2)} below ${ACCEPTANCE_THRESHOLDS.rtlCorrectness}`,
        );
      }
    }
  }

  // Accessibility: enforce threshold only when audited (non-null)
  if (scores.accessibility === null || scores.accessibility === undefined) {
    const msg =
      "Accessibility not fully verified (browser/axe QA skipped or unavailable)";
    if (allowSkipped) {
      warnings.push(msg);
    } else {
      blockingReasons.push(msg);
    }
  } else if (scores.accessibility < ACCEPTANCE_THRESHOLDS.accessibility) {
    blockingReasons.push(
      `Accessibility ${scores.accessibility.toFixed(2)} below ${ACCEPTANCE_THRESHOLDS.accessibility}`,
    );
  }

  // Visual: null → warning when policy allows, never claim full visual verification
  if (scores.visualQuality === null || scores.visualQuality === undefined) {
    const msg =
      "Visual QA skipped — browser QA unavailable; full visual verification not claimed";
    if (allowSkipped) {
      warnings.push(msg);
    } else {
      blockingReasons.push(msg);
    }
  }

  if (
    scores.responsiveBehavior === null ||
    scores.responsiveBehavior === undefined
  ) {
    warnings.push(
      "Responsive browser QA skipped or unavailable; static heuristics may apply only",
    );
  }

  // Strong visual cannot override build/security — already covered by hard gates above
  if (
    scores.visualQuality !== null &&
    scores.visualQuality !== undefined &&
    scores.visualQuality >= 0.9 &&
    (!validation.build || !validation.securityScan)
  ) {
    blockingReasons.push(
      "High visual score cannot compensate for build or security failure",
    );
  }

  return {
    accepted: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  };
}
