import {
  QUALITY_WEIGHTS,
  type QualityDimensionKey,
} from "./quality-thresholds.js";

export type DimensionScoreMap = Partial<
  Record<QualityDimensionKey, number | null | undefined>
>;

export type OverallScoreResult = {
  overall: number;
  confidence: number;
};

/**
 * Compute weighted overall score, skipping null/undefined dimensions and
 * renormalizing weights among present dimensions.
 * Confidence decreases with the weight mass that was skipped.
 * Null is never treated as 1.0.
 */
export function computeOverallScore(
  scores: DimensionScoreMap,
): OverallScoreResult {
  let presentWeight = 0;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of Object.keys(QUALITY_WEIGHTS) as QualityDimensionKey[]) {
    const weight = QUALITY_WEIGHTS[key];
    totalWeight += weight;
    const value = scores[key];
    if (value === null || value === undefined) {
      continue;
    }
    const clamped = Math.max(0, Math.min(1, value));
    presentWeight += weight;
    weightedSum += clamped * weight;
  }

  if (presentWeight <= 0) {
    return { overall: 0, confidence: 0 };
  }

  const overall = weightedSum / presentWeight;
  const confidence = totalWeight > 0 ? presentWeight / totalWeight : 0;
  return {
    overall: Math.round(overall * 1e6) / 1e6,
    confidence: Math.round(confidence * 1e6) / 1e6,
  };
}
