import type { AdvisorySummary } from "./dependency-audit.js";

/** Stable identifier for the one narrowly-scoped accepted-risk exception this policy allows. */
export const ACCEPTED_RISK_NEXT_HIGH_LOOPBACK = "GHSA-NEXT-NODE18-LOOPBACK";

export type DependencyGateInput = {
  audit: AdvisorySummary;
  publicExposureRequested: boolean;
  acceptNextHighLoopback: boolean;
  nextVersion?: string;
};

export type DependencyGateResult = {
  passed: boolean;
  blockingReasons: string[];
  warnings: string[];
  acceptedRiskIds: string[];
};

/**
 * Deployment dependency-audit policy.
 *
 * - CRITICAL advisories always block.
 * - HIGH advisories block unless the only HIGH-severity package is "next"
 *   itself, the deployment target is loopback-only (never public), the
 *   operator opted in via DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK, and the
 *   installed Next.js version is the pinned 14.2.3x line (the newest Next
 *   release Node 18.19 can run). That single narrow exception is recorded
 *   as accepted risk GHSA-NEXT-NODE18-LOOPBACK — it never applies once
 *   public exposure is requested.
 */
export function evaluateDependencyGate(input: DependencyGateInput): DependencyGateResult {
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const acceptedRiskIds: string[] = [];

  if (input.audit.critical > 0) {
    blockingReasons.push(
      `${input.audit.critical} critical dependency advisor${input.audit.critical === 1 ? "y" : "ies"} found`,
    );
  }

  if (input.audit.high > 0) {
    const highPackages = input.audit.packages.filter((p) => p.severity === "high");
    const onlyNextIsHigh =
      highPackages.length > 0 && highPackages.every((p) => p.name === "next");
    const nextVersionEligible = Boolean(input.nextVersion?.startsWith("14.2.3"));
    const canAcceptRisk =
      !input.publicExposureRequested &&
      input.acceptNextHighLoopback &&
      onlyNextIsHigh &&
      nextVersionEligible;

    if (canAcceptRisk) {
      acceptedRiskIds.push(ACCEPTED_RISK_NEXT_HIGH_LOOPBACK);
      warnings.push(
        `Accepted risk ${ACCEPTED_RISK_NEXT_HIGH_LOOPBACK}: ${input.audit.high} high advisory in "next" ` +
          "accepted for loopback-only deployment (Node 18.19 cannot run next@16); revisit on Node upgrade",
      );
    } else {
      blockingReasons.push(
        `${input.audit.high} high dependency advisor${input.audit.high === 1 ? "y" : "ies"} found`,
      );
    }
  }

  return {
    passed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
    acceptedRiskIds,
  };
}
