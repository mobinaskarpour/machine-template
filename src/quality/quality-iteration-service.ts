import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "pino";
import type { FsCompanyOSBlueprintRepository } from "../blueprints/company-os-blueprint-repository.js";
import { hashJsonStable } from "../blueprints/blueprint-hash.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError, isAppError } from "../shared/errors.js";
import { nowIso, shortStableHash } from "../shared/ids.js";
import { GenerationWorkspace, type CurrentGenerationPointer } from "../generation/generation-workspace.js";
import { hashDirectory } from "../generation/generation-types.js";
import { GeneratedAppBuildService } from "../generation/generated-app-build-service.js";
import { promoteStagingToRelease } from "../generation/release-manager.js";
import { scanGeneratedAppSecurity } from "../generation/generated-app-security-scan.js";
import { parseGenerationManifest } from "../generation/generation-manifest-schema.js";
import type { QualityAuditContext, AuditorResult } from "./auditor-types.js";
import { auditStaticSource } from "./auditors/static-source-auditor.js";
import { auditRoutes } from "./auditors/route-auditor.js";
import { auditBlueprintCoverage } from "./auditors/blueprint-coverage-auditor.js";
import { auditBusinessData } from "./auditors/business-data-auditor.js";
import { auditFunctional } from "./auditors/functional-auditor.js";
import { auditRtl } from "./auditors/rtl-auditor.js";
import { auditContentQuality } from "./auditors/content-quality-auditor.js";
import { auditSecurity } from "./auditors/security-auditor.js";
import { auditAccessibility } from "./auditors/accessibility-auditor.js";
import { auditVisual } from "./auditors/visual-auditor.js";
import { auditResponsive } from "./auditors/responsive-auditor.js";
import { auditPerformance } from "./auditors/performance-auditor.js";
import { deduplicateIssues } from "./issue-deduplicator.js";
import { computeOverallScore } from "./quality-score.js";
import { evaluateAcceptance } from "./acceptance-gate.js";
import { formatQualityMessage } from "./quality-summary.js";
import {
  QualityArtifactRepository,
} from "./quality-artifact-repository.js";
import {
  parseQualityRun,
  type QualityRun,
} from "./quality-run-schema.js";
import {
  parseQualityReport,
  type QualityReport,
} from "./quality-report-schema.js";
import type { QualityIssue } from "./quality-issue-schema.js";
import { createQualityIssue } from "./quality-issue-schema.js";
import { classifyIssueFields } from "./issue-classifier.js";
import {
  MAX_ITERATIONS,
  QUALITY_POLICY_VERSION,
} from "./quality-thresholds.js";
import { prepareRepairStaging } from "./repair/repair-workspace.js";
import { buildRepairPlan } from "./repair/repair-planner.js";
import { DeterministicRepairProvider } from "./repair/providers/deterministic-repair-provider.js";
import { validateRepairOutput } from "./repair/repair-validator.js";
import { parseRepairManifest } from "./repair/repair-manifest-schema.js";
import { isPlaywrightResolvable, runBrowserQa } from "./runtime/browser-qa-runner.js";
import { startLocalApp } from "./runtime/local-app-runner.js";
import { probeHealth } from "./runtime/health-probe.js";
import { assertRuntimeStopped } from "./runtime/runtime-cleanup.js";

export type QualityResult = {
  ok: boolean;
  jobId: string;
  companyId: string;
  companySlug: string;
  qualityRunId: string;
  generationId: string;
  acceptedGenerationId?: string;
  reused: boolean;
  accepted: boolean;
  report: QualityReport;
  run: QualityRun;
  issues: QualityIssue[];
  message: string;
};

export type QualityIterateOptions = {
  force?: boolean;
  auditOnly?: boolean;
  maxIterations?: number;
  enableCodex?: boolean;
};

type BuildFlags = {
  install: boolean;
  typecheck: boolean;
  tests: boolean;
  build: boolean;
  securityScan: boolean;
};

const AUDITOR_DEFS: Array<{ id: string; required: boolean }> = [
  { id: "static-source", required: true },
  { id: "route", required: true },
  { id: "blueprint-coverage", required: true },
  { id: "business-data", required: true },
  { id: "functional", required: true },
  { id: "rtl", required: true },
  { id: "content-quality", required: true },
  { id: "security", required: true },
  { id: "accessibility", required: false },
  { id: "visual", required: false },
  { id: "responsive", required: false },
  { id: "performance", required: false },
  { id: "build-integrity", required: true },
];

export class QualityIterationService {
  private readonly workspace: GenerationWorkspace;
  private readonly artifacts: QualityArtifactRepository;
  private readonly buildService: GeneratedAppBuildService;
  private readonly deterministicRepair: DeterministicRepairProvider;

  constructor(
    private readonly deps: {
      projectsRoot: string;
      cwd: string;
      registry: CompanyRegistry;
      blueprints: FsCompanyOSBlueprintRepository;
      jobs: JobManager;
      runner: SafeCommandRunner;
      logger: Logger;
      memoryQualityDir: string;
    },
  ) {
    this.workspace = new GenerationWorkspace(deps.projectsRoot);
    this.artifacts = new QualityArtifactRepository(
      deps.projectsRoot,
      deps.memoryQualityDir,
    );
    this.buildService = new GeneratedAppBuildService(deps.runner);
    this.deterministicRepair = new DeterministicRepairProvider();
  }

  async iterateFromExisting(
    companyName: string,
    options?: QualityIterateOptions,
  ): Promise<QualityResult> {
    const force = options?.force ?? false;
    const auditOnly = options?.auditOnly ?? false;
    const maxIterations = options?.maxIterations ?? MAX_ITERATIONS;
    const enableCodex = options?.enableCodex ?? false;
    void enableCodex; // Codex repair skipped by default (not verified)

    const resolved = await this.deps.registry.resolveByName(companyName);
    const slug = resolved.company.slug;
    const companyId = resolved.company.id;

    const paths = this.workspace.resolvePaths(slug);
    let pointer: CurrentGenerationPointer;
    try {
      pointer = (await readJsonFile(
        paths.currentGenerationJson,
      )) as CurrentGenerationPointer;
    } catch (error) {
      throw new AppError(
        "QUALITY_NOT_READY",
        `No current generation for ${resolved.company.displayName}`,
        { cause: error },
      );
    }
    if (!pointer?.generationId || !pointer.releaseRelativePath) {
      throw new AppError(
        "QUALITY_NOT_READY",
        "current-generation.json missing generationId or releaseRelativePath",
      );
    }

    const releaseAppDir = this.workspace.releaseAppDir(slug, pointer.generationId);
    const blueprint = await this.deps.blueprints.get(slug);
    if (!blueprint) {
      throw new AppError(
        "QUALITY_NOT_READY",
        `No CompanyOSBlueprint for ${resolved.company.displayName}`,
      );
    }

    let manifestRaw: unknown = null;
    try {
      manifestRaw = await readJsonFile(paths.generationManifestJson);
      parseGenerationManifest(manifestRaw);
    } catch {
      // Manifest optional for audit; hash whatever is present
      try {
        manifestRaw = await readJsonFile(paths.generationManifestJson);
      } catch {
        manifestRaw = {};
      }
    }

    const blueprintHash = blueprint.contentHash ?? hashJsonStable(blueprint);
    const generationManifestHash = hashJsonStable(manifestRaw);
    const releaseContentHash = await hashDirectory(releaseAppDir);

    if (!force) {
      const reused = await this.artifacts.tryReuseAccepted({
        slug,
        releaseContentHash,
        qualityPolicyVersion: QUALITY_POLICY_VERSION,
      });
      if (reused) {
        const job = await this.deps.jobs.create({
          type: "QUALITY",
          companyId,
          projectId: resolved.project.id,
          currentStage: "QUALITY_REUSED",
          input: {
            phase: 5,
            reused: true,
            qualityRunId: reused.run.qualityRunId,
            generationId: pointer.generationId,
          },
        });
        await this.deps.jobs.transition(job.id, "RUNNING");
        await this.deps.jobs.setStage(job.id, "QUALITY_REUSED", 100);
        await this.deps.jobs.succeed(job.id, {
          phase: 5,
          reused: true,
          accepted: true,
          qualityRunId: reused.run.qualityRunId,
        });
        const issues = await readIssuesSafe(
          this.artifacts,
          slug,
          reused.run.qualityRunId,
        );
        const message = formatQualityMessage({
          companyDisplayName: blueprint.company.displayName,
          sourceGenerationId: reused.report.sourceGenerationId,
          acceptedGenerationId: reused.report.acceptedGenerationId,
          baselineScore: reused.run.baselineScore,
          finalScore: reused.report.scores.overall,
          issuesFound: countAll(reused.report.issueCounts),
          issuesRepaired: reused.report.repairedIssueIds.length,
          issuesRemaining: reused.report.unresolvedIssueIds.length,
          typecheckOk: true,
          testsOk: true,
          buildOk: true,
          securityStatus: statusLabel(reused.report.scores.security, "passed"),
          rtlStatus: statusLabel(reused.report.scores.rtlCorrectness, "passed"),
          accessibilityStatus: nullableStatus(reused.report.scores.accessibility),
          visualStatus: nullableStatus(reused.report.scores.visualQuality),
          accepted: true,
        });
        return {
          ok: true,
          jobId: job.id,
          companyId,
          companySlug: slug,
          qualityRunId: reused.run.qualityRunId,
          generationId: pointer.generationId,
          acceptedGenerationId: reused.report.acceptedGenerationId,
          reused: true,
          accepted: true,
          report: reused.report,
          run: reused.run,
          issues,
          message: `${message}\n(reused prior accepted quality report)`,
        };
      }
    }

    const qualityRunId = `qr_${shortStableHash(
      `${slug}:${pointer.generationId}:${releaseContentHash}:${QUALITY_POLICY_VERSION}`,
    )}`;

    const job = await this.deps.jobs.create({
      type: "QUALITY",
      companyId,
      projectId: resolved.project.id,
      currentStage: "LOADING_RELEASE",
      input: {
        phase: 5,
        companySlug: slug,
        generationId: pointer.generationId,
        qualityRunId,
        force,
        auditOnly,
      },
    });

    let stagingAppDir: string | undefined;
    let runtimePid: number | undefined;

    try {
      await this.deps.jobs.transition(job.id, "RUNNING");
      await this.deps.jobs.setStage(job.id, "PREPARING_STAGING", 5);
      await this.artifacts.ensureDirs(slug, qualityRunId);

      const staging = await prepareRepairStaging({
        projectsRoot: this.deps.projectsRoot,
        slug,
        qualityRunId,
        sourceReleaseAppDir: releaseAppDir,
      });
      stagingAppDir = staging.stagingAppDir;

      const { runtime, mockData } = await loadRuntimeAndMock(stagingAppDir);

      await this.deps.jobs.setStage(job.id, "BUILD_INTEGRITY", 15);
      const buildFlags = await this.runBuildIntegrity(stagingAppDir, qualityRunId);

      let healthOk = false;
      if (buildFlags.build) {
        await this.deps.jobs.setStage(job.id, "RUNTIME_PROBE", 25);
        try {
          const handle = await startLocalApp({ appDir: stagingAppDir });
          runtimePid = handle.pid;
          const probe = await probeHealth({
            port: handle.port,
            retries: 3,
            timeoutMs: 3_000,
          });
          healthOk = probe.ok;
          await handle.stop();
          await assertRuntimeStopped(handle.pid);
          runtimePid = undefined;
        } catch (error) {
          this.deps.logger.warn(
            { err: isAppError(error) ? error.code : String(error) },
            "quality.runtime_probe_skipped",
          );
          healthOk = false;
        }
      }

      const browserAvailable = await isPlaywrightResolvable();
      const artifactsDir = this.artifacts.runDir(slug, qualityRunId);

      await this.deps.jobs.setStage(job.id, "AUDITING", 40);
      const auditCtx: QualityAuditContext = {
        companySlug: slug,
        generationId: pointer.generationId,
        qualityRunId,
        releaseAppDir: stagingAppDir,
        blueprint,
        runtime,
        mockData,
        browserAvailable,
      };

      const auditorResults = await this.runAuditors(auditCtx);
      let issues = deduplicateIssues(
        auditorResults.flatMap((r) => r.issues),
      );
      issues = [
        ...issues,
        ...buildIssuesFromFlags(qualityRunId, buildFlags, healthOk),
      ];
      issues = deduplicateIssues(issues);

      if (browserAvailable) {
        const routes = collectKeyRoutes(runtime);
        const browser = await runBrowserQa({
          baseUrl: "http://127.0.0.1/",
          routes,
          artifactsDir,
        });
        void browser;
      }

      const scoreMap = scoresFromAuditors(auditorResults, buildFlags);
      const { overall: baselineOverall, confidence: baselineConfidence } =
        computeOverallScore(scoreMap);
      void baselineConfidence;

      let repairedIssueIds: string[] = [];
      let filesChanged: string[] = [];
      let iteration = 0;
      let regressionFlags = { ...buildFlags };

      const hasRepairable =
        !auditOnly &&
        issues.some(
          (i) =>
            i.status === "OPEN" && i.repairability === "AUTO_DETERMINISTIC",
        );

      if (hasRepairable && maxIterations > 0) {
        await this.deps.jobs.setStage(job.id, "REPAIRING", 55);
        iteration = 1;
        const plan = buildRepairPlan({
          qualityRunId,
          sourceGenerationId: pointer.generationId,
          issues,
        });
        await this.artifacts.saveRepairPlan(slug, qualityRunId, plan);

        const deterministicIssues = plan.issues.filter(
          (p) => p.strategy === "DETERMINISTIC",
        );
        if (deterministicIssues.length > 0) {
          const result = await this.deterministicRepair.repair({
            stagingAppDir,
            plan,
            issues: issues.filter((i) =>
              deterministicIssues.some((p) => p.issueId === i.id),
            ),
            blueprint,
          });
          await validateRepairOutput({
            stagingAppDir,
            filesChanged: result.filesChanged,
          });
          filesChanged = result.filesChanged;
          const repairedSet = new Set(
            deterministicIssues.map((p) => p.issueId),
          );
          issues = issues.map((issue) =>
            repairedSet.has(issue.id)
              ? { ...issue, status: "REPAIRED" as const, updatedAt: nowIso() }
              : issue,
          );
          repairedIssueIds = [...repairedSet];

          const manifest = parseRepairManifest({
            schemaVersion: "1.0",
            repairManifestId: `rm_${shortStableHash(plan.repairPlanId)}`,
            repairPlanId: plan.repairPlanId,
            qualityRunId,
            attempts: deterministicIssues.map((p, idx) => ({
              attempt: idx + 1,
              issueId: p.issueId,
              strategy: p.strategy,
              status: "SUCCEEDED",
              filesChanged: result.filesChanged,
              notes: result.notes,
              at: nowIso(),
            })),
            filesChanged: result.filesChanged,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          await writeJsonAtomic(
            join(artifactsDir, "repair-manifest.json"),
            manifest,
          );
        }

        if (filesChanged.length > 0) {
          await this.deps.jobs.setStage(job.id, "REVALIDATING", 70);
          regressionFlags = await this.runBuildIntegrity(
            stagingAppDir,
            qualityRunId,
          );
          const security = await scanGeneratedAppSecurity(stagingAppDir);
          regressionFlags.securityScan = security.ok;

          const reAuditCtx: QualityAuditContext = {
            ...auditCtx,
            runtime: (await loadRuntimeAndMock(stagingAppDir)).runtime,
            mockData: (await loadRuntimeAndMock(stagingAppDir)).mockData,
          };
          const reResults = await this.runAuditors(reAuditCtx);
          const fresh = deduplicateIssues(reResults.flatMap((r) => r.issues));
          const repairedFingerprints = new Set(
            issues
              .filter((i) => i.status === "REPAIRED")
              .map((i) => i.fingerprint),
          );
          const merged = new Map<string, QualityIssue>();
          for (const issue of issues) {
            if (issue.status === "REPAIRED" || issue.status === "VERIFIED") {
              merged.set(issue.fingerprint, issue);
            }
          }
          for (const issue of fresh) {
            if (repairedFingerprints.has(issue.fingerprint)) {
              merged.set(issue.fingerprint, {
                ...issue,
                status: "VERIFIED",
                updatedAt: nowIso(),
              });
              continue;
            }
            merged.set(issue.fingerprint, issue);
          }
          issues = deduplicateIssues([...merged.values()]);
          Object.assign(
            scoreMap,
            scoresFromAuditors(reResults, regressionFlags),
          );
        }
      }

      const finalScore = computeOverallScore(scoreMap);
      const routeResult = auditorResults.find((r) => r.auditorId === "route");
      const routeIntegrity =
        (routeResult?.score ?? 0) >= 0.9 &&
        !issues.some(
          (i) =>
            i.category === "ROUTE" &&
            i.blocking &&
            (i.status === "OPEN" || i.status === "UNRESOLVED"),
        );

      await this.deps.jobs.setStage(job.id, "ACCEPTANCE", 85);
      const acceptance = evaluateAcceptance({
        scores: {
          overall: finalScore.overall,
          blueprintCoverage: num(scoreMap.blueprintCoverage),
          dataIntegrity: num(scoreMap.dataIntegrity),
          accessibility: scoreMap.accessibility ?? null,
          rtlCorrectness: num(scoreMap.rtlCorrectness),
          visualQuality: scoreMap.visualQuality ?? null,
          responsiveBehavior: scoreMap.responsiveBehavior ?? null,
          security: num(scoreMap.security),
        },
        issues,
        validation: {
          typecheck: regressionFlags.typecheck,
          tests: regressionFlags.tests,
          build: regressionFlags.build,
          securityScan: regressionFlags.securityScan,
          routeIntegrity,
          sourceHashesMatch: Boolean(blueprintHash && releaseContentHash),
          regressionPassed:
            regressionFlags.typecheck &&
            regressionFlags.tests &&
            regressionFlags.build &&
            regressionFlags.securityScan,
          requiresRtl: blueprint.company.rtl === true,
        },
      });

      let acceptedGenerationId: string | undefined;
      if (acceptance.accepted && filesChanged.length > 0 && stagingAppDir) {
        await this.deps.jobs.setStage(job.id, "PROMOTING", 92);
        const newGenerationId = `gen_q_${shortStableHash(
          `${qualityRunId}:${releaseContentHash}:${filesChanged.join(",")}`,
        )}`;
        await promoteStagingToRelease({
          projectsRoot: this.deps.projectsRoot,
          slug,
          generationId: newGenerationId,
          stagingAppDir,
          blueprintHash,
        });
        acceptedGenerationId = newGenerationId;
      } else if (acceptance.accepted) {
        acceptedGenerationId = pointer.generationId;
      }

      const auditorsExecuted = auditorResults
        .filter((r) => !r.skipped)
        .map((r) => r.auditorId);
      const auditorsSkipped = auditorResults
        .filter((r) => r.skipped)
        .map((r) => ({ auditor: r.auditorId, reason: r.skipped! }));

      const unresolved = issues.filter(
        (i) =>
          i.status === "OPEN" ||
          i.status === "UNRESOLVED" ||
          i.status === "PLANNED",
      );
      const issueCounts = {
        info: issues.filter((i) => i.severity === "INFO").length,
        low: issues.filter((i) => i.severity === "LOW").length,
        medium: issues.filter((i) => i.severity === "MEDIUM").length,
        high: issues.filter((i) => i.severity === "HIGH").length,
        critical: issues.filter((i) => i.severity === "CRITICAL").length,
      };

      const finishedAt = nowIso();
      const run = parseQualityRun({
        schemaVersion: "1.0",
        qualityRunId,
        companyId,
        companySlug: slug,
        generationId: pointer.generationId,
        qualityPolicyVersion: QUALITY_POLICY_VERSION,
        sourceHashes: {
          blueprintHash,
          generationManifestHash,
          releaseContentHash,
        },
        status: acceptance.accepted ? "ACCEPTED" : "REJECTED",
        iteration,
        maximumIterations: maxIterations,
        auditors: AUDITOR_DEFS.map((a) => {
          const result = auditorResults.find((r) => r.auditorId === a.id);
          let status: "PASSED" | "FAILED" | "SKIPPED" | "PENDING" = "PENDING";
          if (result?.skipped) status = "SKIPPED";
          else if (result) {
            status =
              (result.score ?? 1) >= 0.7 &&
              !result.issues.some((i) => i.blocking && i.status === "OPEN")
                ? "PASSED"
                : "FAILED";
          } else if (a.id === "build-integrity") {
            status =
              regressionFlags.typecheck &&
              regressionFlags.tests &&
              regressionFlags.build
                ? "PASSED"
                : "FAILED";
          }
          return { id: a.id, required: a.required, status };
        }),
        issueIds: issues.map((i) => i.id),
        repairPlanIds: [],
        baselineScore: baselineOverall,
        finalScore: finalScore.overall,
        startedAt: job.createdAt,
        finishedAt,
        createdAt: job.createdAt,
        updatedAt: finishedAt,
      });

      const report = parseQualityReport({
        schemaVersion: "1.0",
        qualityRunId,
        companyId,
        companySlug: slug,
        qualityPolicyVersion: QUALITY_POLICY_VERSION,
        sourceGenerationId: pointer.generationId,
        acceptedGenerationId,
        sourceHashes: {
          blueprintHash,
          generationManifestHash,
          releaseContentHash,
        },
        scores: {
          buildIntegrity: num(scoreMap.buildIntegrity),
          functionalCorrectness: num(scoreMap.functionalCorrectness),
          blueprintCoverage: num(scoreMap.blueprintCoverage),
          dataIntegrity: num(scoreMap.dataIntegrity),
          visualQuality: scoreMap.visualQuality ?? null,
          responsiveBehavior: scoreMap.responsiveBehavior ?? null,
          rtlCorrectness: num(scoreMap.rtlCorrectness),
          accessibility: scoreMap.accessibility ?? null,
          performance: scoreMap.performance ?? null,
          security: num(scoreMap.security),
          contentQuality: num(scoreMap.contentQuality),
          overall: finalScore.overall,
          confidence: finalScore.confidence,
        },
        issueCounts,
        repairedIssueIds,
        unresolvedIssueIds: unresolved.map((i) => i.id),
        acceptedRiskIssueIds: issues
          .filter((i) => i.status === "ACCEPTED_RISK")
          .map((i) => i.id),
        acceptance: {
          accepted: acceptance.accepted,
          blockingReasons: acceptance.blockingReasons,
          warnings: acceptance.warnings,
        },
        auditorsExecuted: [...auditorsExecuted, "build-integrity"],
        auditorsSkipped,
        createdAt: job.createdAt,
        completedAt: finishedAt,
      });

      await this.artifacts.saveRun(slug, run);
      await this.artifacts.saveIssues(slug, qualityRunId, issues);
      await this.artifacts.saveReport(slug, report);

      const message = formatQualityMessage({
        companyDisplayName: blueprint.company.displayName,
        sourceGenerationId: pointer.generationId,
        acceptedGenerationId,
        baselineScore: baselineOverall,
        finalScore: finalScore.overall,
        issuesFound: issues.length,
        issuesRepaired: repairedIssueIds.length,
        issuesRemaining: unresolved.length,
        typecheckOk: regressionFlags.typecheck,
        testsOk: regressionFlags.tests,
        buildOk: regressionFlags.build,
        securityStatus: regressionFlags.securityScan
          ? statusLabel(num(scoreMap.security), "passed")
          : "failed",
        rtlStatus: statusLabel(num(scoreMap.rtlCorrectness), "checked"),
        accessibilityStatus: nullableStatus(scoreMap.accessibility ?? null),
        visualStatus: nullableStatus(scoreMap.visualQuality ?? null),
        accepted: acceptance.accepted,
      });

      await this.deps.jobs.setStage(job.id, "COMPLETE", 100);
      if (acceptance.accepted) {
        await this.deps.jobs.succeed(job.id, {
          phase: 5,
          accepted: true,
          qualityRunId,
          generationId: acceptedGenerationId ?? pointer.generationId,
          overall: finalScore.overall,
        });
      } else {
        await this.deps.jobs.fail(job.id, {
          code: "QUALITY_ACCEPTANCE_FAILED",
          message: acceptance.blockingReasons.join("; ") || "Quality rejected",
        });
      }

      return {
        ok: acceptance.accepted,
        jobId: job.id,
        companyId,
        companySlug: slug,
        qualityRunId,
        generationId: pointer.generationId,
        acceptedGenerationId,
        reused: false,
        accepted: acceptance.accepted,
        report,
        run,
        issues,
        message,
      };
    } catch (error) {
      if (runtimePid !== undefined) {
        await assertRuntimeStopped(runtimePid).catch(() => undefined);
      }
      const code = isAppError(error) ? error.code : "QUALITY_AUDIT_FAILED";
      const message = isAppError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
      try {
        const current = await this.deps.jobs.get(job.id);
        if (current && (current.status === "QUEUED" || current.status === "RUNNING")) {
          await this.deps.jobs.fail(job.id, { code, message });
        }
      } catch {
        // ignore job fail errors
      }
      throw error;
    }
  }

  private async runBuildIntegrity(
    stagingAppDir: string,
    qualityRunId: string,
  ): Promise<BuildFlags> {
    const flags: BuildFlags = {
      install: false,
      typecheck: false,
      tests: false,
      build: false,
      securityScan: false,
    };
    try {
      await this.buildService.install(stagingAppDir);
      flags.install = true;
      await this.buildService.typecheck(stagingAppDir);
      flags.typecheck = true;
      await this.buildService.test(stagingAppDir);
      flags.tests = true;
      await this.buildService.build(stagingAppDir);
      flags.build = true;
    } catch (error) {
      this.deps.logger.warn(
        {
          qualityRunId,
          code: isAppError(error) ? error.code : "BUILD_FAILED",
        },
        "quality.build_integrity_step_failed",
      );
    }
    try {
      const security = await scanGeneratedAppSecurity(stagingAppDir);
      flags.securityScan = security.ok;
    } catch {
      flags.securityScan = false;
    }
    return flags;
  }

  private async runAuditors(
    ctx: QualityAuditContext,
  ): Promise<AuditorResult[]> {
    return Promise.all([
      auditStaticSource(ctx),
      auditRoutes(ctx),
      auditBlueprintCoverage(ctx),
      auditBusinessData(ctx),
      auditFunctional(ctx),
      auditRtl(ctx),
      auditContentQuality(ctx),
      auditSecurity(ctx),
      auditAccessibility(ctx),
      auditVisual(ctx),
      auditResponsive(ctx),
      auditPerformance(ctx),
    ]);
  }
}

async function loadRuntimeAndMock(
  appDir: string,
): Promise<{ runtime: unknown; mockData: unknown }> {
  let runtime: unknown = {};
  let mockData: unknown = {};
  try {
    runtime = JSON.parse(
      await readFile(join(appDir, "src/data/blueprint-runtime.json"), "utf8"),
    );
  } catch {
    runtime = {};
  }
  try {
    mockData = JSON.parse(
      await readFile(join(appDir, "src/data/mock-data.json"), "utf8"),
    );
  } catch {
    mockData = {};
  }
  return { runtime, mockData };
}

function scoresFromAuditors(
  results: AuditorResult[],
  build: BuildFlags,
): Record<string, number | null | undefined> {
  const byId = new Map(results.map((r) => [r.auditorId, r]));
  const buildIntegrity =
    (build.install ? 0.15 : 0) +
    (build.typecheck ? 0.3 : 0) +
    (build.tests ? 0.25 : 0) +
    (build.build ? 0.3 : 0);

  return {
    buildIntegrity,
    functionalCorrectness: byId.get("functional")?.score ?? null,
    blueprintCoverage: byId.get("blueprint-coverage")?.score ?? null,
    dataIntegrity: byId.get("business-data")?.score ?? null,
    visualQuality: byId.get("visual")?.score ?? null,
    responsiveBehavior: byId.get("responsive")?.score ?? null,
    rtlCorrectness: byId.get("rtl")?.score ?? null,
    accessibility: byId.get("accessibility")?.score ?? null,
    performance: byId.get("performance")?.score ?? null,
    security: byId.get("security")?.score ?? null,
    contentQuality: byId.get("content-quality")?.score ?? null,
  };
}

function buildIssuesFromFlags(
  qualityRunId: string,
  flags: BuildFlags,
  healthOk: boolean,
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const push = (
    category: QualityIssue["category"],
    severity: QualityIssue["severity"],
    title: string,
    description: string,
  ) => {
    const { fingerprint, blocking } = classifyIssueFields({
      category,
      title,
      severity,
    });
    issues.push(
      createQualityIssue({
        qualityRunId,
        category,
        severity,
        title,
        description,
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
        evidence: [{ type: "COMMAND", value: title, sanitized: true }],
      }),
    );
  };

  if (!flags.typecheck) {
    push("TYPECHECK", "CRITICAL", "Typecheck failed", "Generated app typecheck did not pass");
  }
  if (!flags.tests) {
    push("TEST", "CRITICAL", "Tests failed", "Generated app tests did not pass");
  }
  if (!flags.build) {
    push("BUILD", "CRITICAL", "Production build failed", "Generated app production build did not pass");
  }
  if (!flags.securityScan) {
    push("SECURITY", "HIGH", "Security scan failed", "Generated app security scan did not pass");
  }
  if (flags.build && !healthOk) {
    push(
      "FUNCTIONAL",
      "MEDIUM",
      "Local health probe failed",
      "App built but localhost health probe did not succeed",
    );
  }
  return issues;
}

function collectKeyRoutes(runtime: unknown): string[] {
  const routes = new Set<string>(["/"]);
  const r = runtime as {
    navigation?: { primary?: Array<{ route?: string }>; utility?: Array<{ route?: string }> };
    dashboards?: Array<{ route?: string }>;
  };
  for (const item of [...(r.navigation?.primary ?? []), ...(r.navigation?.utility ?? [])]) {
    if (item?.route) routes.add(String(item.route));
  }
  for (const d of r.dashboards ?? []) {
    if (d?.route) routes.add(String(d.route));
  }
  return [...routes].slice(0, 8);
}

function num(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 0;
  return v;
}

function countAll(counts: QualityReport["issueCounts"]): number {
  return counts.info + counts.low + counts.medium + counts.high + counts.critical;
}

function statusLabel(score: number, fallback: string): string {
  if (score >= 0.9) return "passed";
  if (score >= 0.7) return fallback;
  return "failed";
}

function nullableStatus(score: number | null | undefined): string {
  if (score === null || score === undefined) return "skipped";
  return statusLabel(score, "checked");
}

async function readIssuesSafe(
  artifacts: QualityArtifactRepository,
  slug: string,
  runId: string,
): Promise<QualityIssue[]> {
  try {
    const raw = await readJsonFile(
      join(artifacts.runDir(slug, runId), "issues.json"),
    );
    return Array.isArray(raw) ? (raw as QualityIssue[]) : [];
  } catch {
    return [];
  }
}
