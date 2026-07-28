/**
 * Quality policy thresholds and dimension weights (Phase 5).
 * Weights must sum to exactly 1.00.
 */

export const QUALITY_POLICY_VERSION = "1.0";

export const QUALITY_WEIGHTS = {
  buildIntegrity: 0.14,
  functionalCorrectness: 0.14,
  blueprintCoverage: 0.12,
  dataIntegrity: 0.1,
  visualQuality: 0.1,
  responsiveBehavior: 0.08,
  rtlCorrectness: 0.08,
  accessibility: 0.08,
  performance: 0.05,
  security: 0.07,
  contentQuality: 0.04,
} as const;

export type QualityDimensionKey = keyof typeof QUALITY_WEIGHTS;

export const ACCEPTANCE_THRESHOLDS = {
  overall: 0.85,
  blueprintCoverage: 0.9,
  dataIntegrity: 0.9,
  accessibility: 0.8,
  rtlCorrectness: 0.9,
} as const;

/** When true, skipped browser visual/accessibility may accept with warnings. */
export const ALLOW_SKIPPED_BROWSER_QA = true;

export const MAX_ITERATIONS = 3;
export const MAX_REPAIR_ATTEMPTS_PER_ISSUE = 2;
export const MAX_CODEX_REPAIRS = 6;

const weightSum = Object.values(QUALITY_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1) > 1e-9) {
  throw new Error(`QUALITY_WEIGHTS must sum to 1.00, got ${weightSum}`);
}
