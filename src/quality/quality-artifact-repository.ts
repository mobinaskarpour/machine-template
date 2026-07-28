import { mkdir } from "node:fs/promises";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import {
  parseQualityRun,
  type QualityRun,
} from "./quality-run-schema.js";
import {
  parseQualityReport,
  type QualityReport,
} from "./quality-report-schema.js";
import {
  parseQualityIssues,
  type QualityIssue,
} from "./quality-issue-schema.js";
import { QUALITY_POLICY_VERSION } from "./quality-thresholds.js";

export type CurrentQualityPointer = {
  schemaVersion: "1.0";
  companySlug: string;
  qualityRunId: string;
  generationId: string;
  qualityPolicyVersion: string;
  releaseContentHash: string;
  accepted: boolean;
  overallScore?: number;
  updatedAt: string;
};

export type QualityReuseMatch = {
  report: QualityReport;
  run: QualityRun;
  pointer: CurrentQualityPointer;
};

export class QualityArtifactRepository {
  constructor(
    private readonly projectsRoot: string,
    private readonly memoryQualityDir: string,
  ) {}

  private safeSlug(slug: string): string {
    return assertSafeSlug(slug);
  }

  currentQualityPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      ".factory",
      "current-quality.json",
    );
  }

  qualitySummaryPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      ".factory",
      "quality-summary.json",
    );
  }

  runDir(slug: string, runId: string): string {
    if (!runId || runId.includes("..") || runId.includes("/") || runId.includes("\\")) {
      throw new AppError("VALIDATION_ERROR", `Unsafe quality run id: ${runId}`);
    }
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      "artifacts",
      "quality",
      runId,
    );
  }

  memoryPath(slug: string): string {
    return resolveUnderRoot(this.memoryQualityDir, `${this.safeSlug(slug)}.json`);
  }

  async ensureDirs(slug: string, runId?: string): Promise<void> {
    const safe = this.safeSlug(slug);
    const factory = resolveUnderRoot(this.projectsRoot, safe, ".factory");
    const artifacts = resolveUnderRoot(
      this.projectsRoot,
      safe,
      "artifacts",
      "quality",
    );
    await mkdir(factory, { recursive: true });
    await mkdir(artifacts, { recursive: true });
    await mkdir(this.memoryQualityDir, { recursive: true });
    if (runId) {
      await mkdir(this.runDir(safe, runId), { recursive: true });
    }
  }

  async saveRun(slug: string, run: QualityRun): Promise<QualityRun> {
    const validated = parseQualityRun(run);
    await this.ensureDirs(slug, validated.qualityRunId);
    const path = resolveUnderRoot(
      this.runDir(slug, validated.qualityRunId),
      "quality-run.json",
    );
    await writeJsonAtomic(path, validated);
    return validated;
  }

  async saveReport(slug: string, report: QualityReport): Promise<QualityReport> {
    const validated = parseQualityReport(report);
    await this.ensureDirs(slug, validated.qualityRunId);
    const runPath = resolveUnderRoot(
      this.runDir(slug, validated.qualityRunId),
      "quality-report.json",
    );
    await writeJsonAtomic(runPath, validated);

    const pointer: CurrentQualityPointer = {
      schemaVersion: "1.0",
      companySlug: this.safeSlug(slug),
      qualityRunId: validated.qualityRunId,
      generationId:
        validated.acceptedGenerationId ?? validated.sourceGenerationId,
      qualityPolicyVersion:
        validated.qualityPolicyVersion ?? QUALITY_POLICY_VERSION,
      releaseContentHash: validated.sourceHashes?.releaseContentHash ?? "",
      accepted: validated.acceptance.accepted,
      overallScore: validated.scores.overall,
      updatedAt: nowIso(),
    };
    await writeJsonAtomic(this.currentQualityPath(slug), pointer);
    await writeJsonAtomic(this.qualitySummaryPath(slug), {
      companySlug: pointer.companySlug,
      qualityRunId: pointer.qualityRunId,
      accepted: pointer.accepted,
      overall: validated.scores.overall,
      confidence: validated.scores.confidence,
      sourceGenerationId: validated.sourceGenerationId,
      acceptedGenerationId: validated.acceptedGenerationId,
      issueCounts: validated.issueCounts,
      warnings: validated.acceptance.warnings,
      blockingReasons: validated.acceptance.blockingReasons,
      updatedAt: pointer.updatedAt,
    });
    await writeJsonAtomic(this.memoryPath(slug), validated);
    return validated;
  }

  async saveIssues(
    slug: string,
    runId: string,
    issues: QualityIssue[],
  ): Promise<QualityIssue[]> {
    const validated = parseQualityIssues(issues);
    await this.ensureDirs(slug, runId);
    const path = resolveUnderRoot(this.runDir(slug, runId), "issues.json");
    await writeJsonAtomic(path, validated);
    return validated;
  }

  async saveRepairPlan(
    slug: string,
    runId: string,
    plan: unknown,
  ): Promise<void> {
    await this.ensureDirs(slug, runId);
    const path = resolveUnderRoot(this.runDir(slug, runId), "repair-plan.json");
    await writeJsonAtomic(path, plan);
  }

  async loadCurrentQuality(
    slug: string,
  ): Promise<CurrentQualityPointer | null> {
    try {
      const raw = await readJsonFile(this.currentQualityPath(slug));
      if (!raw || typeof raw !== "object") return null;
      return raw as CurrentQualityPointer;
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async loadRun(slug: string, runId: string): Promise<QualityRun | null> {
    try {
      return parseQualityRun(
        await readJsonFile(
          resolveUnderRoot(this.runDir(slug, runId), "quality-run.json"),
        ),
      );
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async loadReport(slug: string, runId: string): Promise<QualityReport | null> {
    try {
      return parseQualityReport(
        await readJsonFile(
          resolveUnderRoot(this.runDir(slug, runId), "quality-report.json"),
        ),
      );
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  /**
   * Reuse a prior accepted quality report when release hash + policy version match.
   */
  async tryReuseAccepted(input: {
    slug: string;
    releaseContentHash: string;
    qualityPolicyVersion?: string;
  }): Promise<QualityReuseMatch | null> {
    const pointer = await this.loadCurrentQuality(input.slug);
    if (!pointer || !pointer.accepted) return null;
    const policy = input.qualityPolicyVersion ?? QUALITY_POLICY_VERSION;
    if (pointer.qualityPolicyVersion !== policy) return null;
    if (
      !input.releaseContentHash ||
      pointer.releaseContentHash !== input.releaseContentHash
    ) {
      return null;
    }
    const report = await this.loadReport(input.slug, pointer.qualityRunId);
    const run = await this.loadRun(input.slug, pointer.qualityRunId);
    if (!report || !run) return null;
    if (!report.acceptance.accepted) return null;
    return { report, run, pointer };
  }
}
