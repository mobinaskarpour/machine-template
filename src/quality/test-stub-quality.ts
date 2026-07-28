import type {
  QualityIterationService,
  QualityResult,
} from "./quality-iteration-service.js";
import { nowIso } from "../shared/ids.js";
import { parseQualityRun } from "./quality-run-schema.js";
import { parseQualityReport } from "./quality-report-schema.js";
import { QUALITY_POLICY_VERSION } from "./quality-thresholds.js";

/**
 * Fast test double for Phase 1–4 /demo pipelines — skips auditors and npm.
 */
export function createStubQualityService(
  messageExtra?: string,
): QualityIterationService {
  const stub = {
    async iterateFromExisting(
      companyName: string,
      _options?: { force?: boolean; auditOnly?: boolean; maxIterations?: number },
    ): Promise<QualityResult> {
      return stubResult(companyName, messageExtra);
    },
  };
  return stub as unknown as QualityIterationService;
}

function stubResult(companyName: string, messageExtra?: string): QualityResult {
  const qualityRunId = "qr_teststub01";
  const generationId = "gen_teststub01";
  const ts = nowIso();
  const run = parseQualityRun({
    schemaVersion: "1.0",
    qualityRunId,
    companyId: "co_stub",
    companySlug: "stub",
    generationId,
    qualityPolicyVersion: QUALITY_POLICY_VERSION,
    sourceHashes: {
      blueprintHash: "x",
      generationManifestHash: "x",
      releaseContentHash: "x",
    },
    status: "ACCEPTED",
    iteration: 0,
    maximumIterations: 3,
    auditors: [],
    issueIds: [],
    repairPlanIds: [],
    baselineScore: 1,
    finalScore: 1,
    createdAt: ts,
    updatedAt: ts,
  });
  const report = parseQualityReport({
    schemaVersion: "1.0",
    qualityRunId,
    companyId: "co_stub",
    companySlug: "stub",
    qualityPolicyVersion: QUALITY_POLICY_VERSION,
    sourceGenerationId: generationId,
    acceptedGenerationId: generationId,
    scores: {
      buildIntegrity: 1,
      functionalCorrectness: 1,
      blueprintCoverage: 1,
      dataIntegrity: 1,
      visualQuality: null,
      responsiveBehavior: 0.85,
      rtlCorrectness: 1,
      accessibility: 0.9,
      performance: 1,
      security: 1,
      contentQuality: 1,
      overall: 1,
      confidence: 0.9,
    },
    issueCounts: { info: 0, low: 0, medium: 0, high: 0, critical: 0 },
    repairedIssueIds: [],
    unresolvedIssueIds: [],
    acceptedRiskIssueIds: [],
    acceptance: { accepted: true, blockingReasons: [], warnings: [] },
    auditorsExecuted: [],
    auditorsSkipped: [],
    createdAt: ts,
    completedAt: ts,
  });

  const base = [
    "Application quality iteration completed.",
    `Company: ${companyName}`,
    `Source generation: ${generationId}`,
    "The application has not been deployed.",
  ].join("\n");

  return {
    ok: true,
    jobId: "job_quality_stub",
    companyId: "co_stub",
    companySlug: "stub",
    qualityRunId,
    generationId,
    acceptedGenerationId: generationId,
    reused: false,
    accepted: true,
    report,
    run,
    issues: [],
    message: messageExtra ? `${base}\n${messageExtra}` : base,
  };
}
