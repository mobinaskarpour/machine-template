import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { AppError } from "../shared/errors.js";
import { nowIso, shortStableHash } from "../shared/ids.js";
import { runProductionNpmAudit, type AdvisorySummary } from "./dependency-audit.js";
import { evaluateDependencyGate, type DependencyGateResult } from "./advisory-policy.js";
import {
  runBrowserPredeployQa,
  type BrowserPredeployQaResult,
} from "./browser-predeploy-qa.js";
import {
  parsePreDeploymentGateResult,
  type PreDeploymentCheck,
  type PreDeploymentGateResult,
} from "./predeployment-gate-schema.js";

export type PreDeploymentGateInput = {
  companyId: string;
  companySlug: string;
  generationId: string;
  qualityRunId?: string;
  releaseAppDir: string;
  qualityAccepted: boolean;
  sourceHashesMatch: boolean;
  buildPassed: boolean;
  securityPassed: boolean;
  releaseImmutable: boolean;
  publicExposureRequested: boolean;
  acceptNextHighLoopback: boolean;
  runner: SafeCommandRunner;
  browserQaRoutes: string[];
  requireRtl: boolean;
  artifactsDir: string;
  /** Loopback base URL of a running release under QA (required unless browserQaResult provided). */
  browserBaseUrl?: string;
  /** Injected result (tests / callers that already ran browser QA against a live loopback app). */
  browserQaResult?: BrowserPredeployQaResult;
  skipBrowserQa?: boolean;
  runDependencyAudit?: (
    appDir: string,
    runner: SafeCommandRunner,
  ) => Promise<AdvisorySummary>;
  runBrowserQaFn?: (input: {
    baseUrl: string;
    routes: string[];
    artifactsDir: string;
    requireRtl?: boolean;
  }) => Promise<BrowserPredeployQaResult>;
};

async function readNextVersion(releaseAppDir: string): Promise<string | undefined> {
  try {
    const raw = await readFile(join(releaseAppDir, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
    const version = pkg.dependencies?.next;
    return version?.replace(/^[\^~]/, "");
  } catch {
    return undefined;
  }
}

function addCheck(
  checks: PreDeploymentCheck[],
  blockingReasons: string[],
  id: string,
  required: boolean,
  passed: boolean,
  message?: string,
): void {
  checks.push({ id, required, passed, message });
  if (required && !passed) {
    blockingReasons.push(message ?? `Pre-deployment check failed: ${id}`);
  }
}

/**
 * Evaluate the Phase 6 pre-deployment gate for a generated + quality-accepted
 * release. A skipped *required* check is treated as a failure — this gate
 * never silently waves through an unverified deployment.
 */
export async function evaluatePreDeploymentGate(
  input: PreDeploymentGateInput,
): Promise<PreDeploymentGateResult> {
  const checks: PreDeploymentCheck[] = [];
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  addCheck(
    checks,
    blockingReasons,
    "generation-present",
    true,
    Boolean(input.generationId),
    input.generationId ? undefined : "No accepted generation is available to deploy",
  );
  addCheck(
    checks,
    blockingReasons,
    "quality-accepted",
    true,
    input.qualityAccepted,
    input.qualityAccepted ? undefined : "Quality gate has not accepted this release",
  );
  addCheck(
    checks,
    blockingReasons,
    "source-hashes-match",
    true,
    input.sourceHashesMatch,
    input.sourceHashesMatch ? undefined : "Source hashes do not match; regenerate before deploying",
  );
  addCheck(
    checks,
    blockingReasons,
    "build-passed",
    true,
    input.buildPassed,
    input.buildPassed ? undefined : "Release build verification did not pass",
  );
  addCheck(
    checks,
    blockingReasons,
    "security-scan-passed",
    true,
    input.securityPassed,
    input.securityPassed ? undefined : "Release failed the security scan",
  );
  addCheck(
    checks,
    blockingReasons,
    "release-immutable",
    true,
    input.releaseImmutable,
    input.releaseImmutable ? undefined : "Release artifact is missing or not immutable",
  );

  const auditFn = input.runDependencyAudit ?? runProductionNpmAudit;
  let audit: AdvisorySummary;
  try {
    audit = await auditFn(input.releaseAppDir, input.runner);
  } catch (error) {
    throw new AppError("PREDEPLOY_DEPENDENCY_BLOCKER", "Dependency audit failed to run", {
      cause: error,
    });
  }
  const nextVersion = await readNextVersion(input.releaseAppDir);
  const dependencyGate: DependencyGateResult = evaluateDependencyGate({
    audit,
    publicExposureRequested: input.publicExposureRequested,
    acceptNextHighLoopback: input.acceptNextHighLoopback,
    nextVersion,
  });
  addCheck(
    checks,
    blockingReasons,
    "dependency-audit",
    true,
    dependencyGate.passed,
    dependencyGate.passed ? undefined : dependencyGate.blockingReasons.join("; "),
  );
  warnings.push(...dependencyGate.warnings);

  const browserFn = input.runBrowserQaFn ?? runBrowserPredeployQa;
  let browserQa: BrowserPredeployQaResult;
  if (input.browserQaResult) {
    browserQa = input.browserQaResult;
  } else if (input.skipBrowserQa) {
    // A skipped required gate is never a pass — record failure explicitly.
    browserQa = {
      available: false,
      passed: false,
      criticalIssuesClear: false,
      accessibilityCriticalClear: false,
      screenshots: [],
      routesChecked: [],
      consoleErrors: [],
      viewports: [],
      reason: "Browser QA skipped by caller",
    };
  } else {
    const baseUrl = input.browserBaseUrl ?? "http://127.0.0.1/";
    if (!input.browserBaseUrl && !input.runBrowserQaFn) {
      throw new AppError(
        "PREDEPLOY_BROWSER_QA_REQUIRED",
        "browserBaseUrl is required for pre-deployment browser QA (start a loopback app first)",
      );
    }
    browserQa = await browserFn({
      baseUrl,
      routes: input.browserQaRoutes,
      artifactsDir: input.artifactsDir,
      requireRtl: input.requireRtl,
    });
  }

  // Browser smoke QA is mandatory for every deployable release (loopback and public).
  addCheck(
    checks,
    blockingReasons,
    "browser-qa",
    true,
    browserQa.available && browserQa.passed,
    browserQa.available && browserQa.passed
      ? undefined
      : browserQa.reason ?? "Browser QA did not pass",
  );
  addCheck(
    checks,
    blockingReasons,
    "visual-critical-clear",
    true,
    browserQa.available && browserQa.criticalIssuesClear,
    browserQa.available && browserQa.criticalIssuesClear
      ? undefined
      : "Critical visual/runtime browser issues were not cleared",
  );
  addCheck(
    checks,
    blockingReasons,
    "accessibility-critical-clear",
    true,
    browserQa.available && browserQa.accessibilityCriticalClear,
    browserQa.available && browserQa.accessibilityCriticalClear
      ? undefined
      : "Critical accessibility issues were not cleared",
  );
  if (input.publicExposureRequested && !(browserQa.available && browserQa.passed)) {
    warnings.push("Public exposure requires successful browser QA");
  }

  const gateId = `pdg_${shortStableHash(
    `${input.companySlug}:${input.generationId}:${input.qualityRunId ?? ""}:${nowIso()}`,
  )}`;

  return parsePreDeploymentGateResult({
    schemaVersion: "1.0",
    gateId,
    companyId: input.companyId,
    companySlug: input.companySlug,
    generationId: input.generationId,
    qualityRunId: input.qualityRunId,
    publicExposureRequested: input.publicExposureRequested,
    checks,
    dependencyAudit: audit,
    dependencyGate,
    browserQa,
    passed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
    createdAt: nowIso(),
  });
}
