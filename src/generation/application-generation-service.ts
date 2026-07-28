import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "pino";
import type { CompanyOSBlueprint } from "../blueprints/company-os-blueprint-schema.js";
import type { FsCompanyOSBlueprintRepository } from "../blueprints/company-os-blueprint-repository.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import type { FsMasterBuildSpecificationRepository } from "../specifications/master-build-specification-repository.js";
import type { FsMasterPromptRepository } from "../prompts/master-prompt-repository.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { writeJsonAtomic, readJsonFile } from "../persistence/atomic.js";
import { AppError, isAppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import { buildGenerationPlan } from "./generation-plan-builder.js";
import { parseGenerationManifest, type GenerationManifest } from "./generation-manifest-schema.js";
import type { GenerationPlan } from "./generation-plan-schema.js";
import { GenerationWorkspace, type CurrentGenerationPointer } from "./generation-workspace.js";
import { hashTemplate, copyTemplateToStaging } from "./template-manager.js";
import { DeterministicTemplateProvider } from "./providers/deterministic-template-provider.js";
import type { CodeGenerationProvider } from "./providers/code-generation-provider.js";
import { validateGeneratedSource } from "./validation/generated-source-validator.js";
import { validateDependencyPolicy } from "./validation/dependency-policy-validator.js";
import { validateMockDataIntegrity } from "./validation/mock-data-integrity-validator.js";
import { validateRoutes } from "./validation/route-validator.js";
import { validateBlueprintCoverage } from "./validation/blueprint-coverage-validator.js";
import { scanGeneratedAppSecurity } from "./generated-app-security-scan.js";
import { GeneratedAppBuildService } from "./generated-app-build-service.js";
import { promoteStagingToRelease } from "./release-manager.js";
import { hashFile, listFilesRecursive } from "./generation-types.js";
import type { BlueprintRuntimeDocument } from "./renderers/runtime-renderer.js";

export type GenerationResult = {
  ok: boolean;
  jobId: string;
  companyId: string;
  companySlug: string;
  generationId: string;
  reused: boolean;
  manifest: GenerationManifest;
  pointer?: CurrentGenerationPointer;
  message: string;
  dryRun?: boolean;
};

export class ApplicationGenerationService {
  private readonly workspace: GenerationWorkspace;
  private readonly buildService: GeneratedAppBuildService;
  private readonly provider: CodeGenerationProvider;

  constructor(
    private readonly deps: {
      cwd: string;
      projectsRoot: string;
      registry: CompanyRegistry;
      knowledge: CompanyKnowledgeService;
      specifications: FsMasterBuildSpecificationRepository;
      prompts: FsMasterPromptRepository;
      blueprints: FsCompanyOSBlueprintRepository;
      jobs: JobManager;
      runner: SafeCommandRunner;
      logger: Logger;
      provider?: CodeGenerationProvider;
    },
  ) {
    this.workspace = new GenerationWorkspace(deps.projectsRoot);
    this.buildService = new GeneratedAppBuildService(deps.runner);
    this.provider = deps.provider ?? new DeterministicTemplateProvider();
  }

  async generateFromExisting(
    companyName: string,
    options?: { force?: boolean; dryRun?: boolean },
  ): Promise<GenerationResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const knowledge = await this.deps.knowledge.get(resolved.company.slug);
    if (!knowledge) {
      throw new AppError("KNOWLEDGE_NOT_FOUND", `No CompanyKnowledge for ${resolved.company.displayName}`);
    }
    const specification = await this.deps.specifications.get(resolved.company.slug);
    if (!specification) {
      throw new AppError("NOT_FOUND", `No MasterBuildSpecification for ${resolved.company.displayName}`);
    }
    const prompt = await this.deps.prompts.get(resolved.company.slug);
    if (!prompt) {
      throw new AppError("NOT_FOUND", `No Master Prompt for ${resolved.company.displayName}`);
    }
    const blueprint = await this.deps.blueprints.get(resolved.company.slug);
    if (!blueprint) {
      throw new AppError("NOT_FOUND", `No CompanyOSBlueprint for ${resolved.company.displayName}`);
    }

    return this.generateWithArtifacts({
      knowledgeHash: knowledge.contentHash ?? "",
      specificationHash: specification.contentHash ?? "",
      masterPromptHash: prompt.contentHash ?? "",
      blueprint,
      companyId: resolved.company.id,
      projectId: resolved.project.id,
      force: options?.force,
      dryRun: options?.dryRun,
    });
  }

  async generateWithArtifacts(input: {
    knowledgeHash: string;
    specificationHash: string;
    masterPromptHash: string;
    blueprint: CompanyOSBlueprint;
    companyId: string;
    projectId: string;
    force?: boolean;
    dryRun?: boolean;
    existingJobId?: string;
  }): Promise<GenerationResult> {
    const { blueprint } = input;
    const slug = blueprint.company.slug;

    if (!blueprint.quality.readyForCodeGeneration) {
      throw new AppError(
        "BLUEPRINT_NOT_READY",
        "Blueprint is not ready for code generation",
        { details: { blockingReasons: blueprint.quality.blockingReasons } },
      );
    }

    this.verifySourceHashes({
      knowledgeHash: input.knowledgeHash,
      specificationHash: input.specificationHash,
      masterPromptHash: input.masterPromptHash,
      blueprint,
    });

    const blueprintHash = blueprint.contentHash ?? "";
    if (!input.force && !input.dryRun) {
      const reused = await this.tryReuseCurrentRelease(slug, blueprintHash, input.companyId);
      if (reused) return reused;
    }

    const job = input.existingJobId
      ? await this.deps.jobs.require(input.existingJobId)
      : await this.deps.jobs.create({
          type: "GENERATION",
          companyId: input.companyId,
          projectId: input.projectId,
          currentStage: "LOADING_BLUEPRINT",
          input: {
            phase: 4,
            companySlug: slug,
            companyName: blueprint.company.displayName,
            force: Boolean(input.force),
            dryRun: Boolean(input.dryRun),
          },
        });

    try {
      if (job.status === "QUEUED") {
        await this.deps.jobs.transition(job.id, "RUNNING");
      }

      await this.deps.jobs.setStage(job.id, "LOADING_BLUEPRINT", 5);
      const templateHash = await hashTemplate(this.deps.cwd);

      await this.deps.jobs.setStage(job.id, "BUILDING_GENERATION_PLAN", 10);
      const plan = buildGenerationPlan({
        blueprint,
        companyKnowledgeHash: input.knowledgeHash,
        specificationHash: input.specificationHash,
        masterPromptHash: input.masterPromptHash,
        templateHash,
        providerId: "DETERMINISTIC_TEMPLATE",
        cwd: this.deps.cwd,
      });

      const paths = await this.workspace.ensureDirs(slug, {
        jobId: job.id,
        generationId: plan.generationId,
      });
      await writeJsonAtomic(paths.generationPlanJson, plan);

      if (input.dryRun) {
        await this.deps.jobs.setStage(job.id, "APPLICATION_GENERATION_COMPLETE", 100);
        const dryManifest = this.emptyManifest(plan, "STAGING");
        await this.deps.jobs.succeed(job.id, {
          phase: 4,
          dryRun: true,
          generationId: plan.generationId,
        });
        return {
          ok: true,
          jobId: job.id,
          companyId: input.companyId,
          companySlug: slug,
          generationId: plan.generationId,
          reused: false,
          manifest: dryManifest,
          dryRun: true,
          message: formatGenerationMessage({
            blueprint,
            plan,
            manifest: dryManifest,
            reused: false,
            dryRun: true,
          }),
        };
      }

      await this.deps.jobs.setStage(job.id, "PREPARING_STAGING_WORKSPACE", 15);
      const stagingAppDir = this.workspace.stagingAppDir(slug, job.id);

      await this.deps.jobs.setStage(job.id, "COPYING_TEMPLATE", 20);
      await copyTemplateToStaging({ cwd: this.deps.cwd, stagingAppDir });

      await this.deps.jobs.setStage(job.id, "RENDERING_APPLICATION_SHELL", 30);
      await this.deps.jobs.setStage(job.id, "RENDERING_DASHBOARDS", 35);
      await this.deps.jobs.setStage(job.id, "RENDERING_MODULES", 40);
      await this.deps.jobs.setStage(job.id, "RENDERING_WORKFLOWS", 45);
      await this.deps.jobs.setStage(job.id, "RENDERING_AGENTS", 50);
      await this.deps.jobs.setStage(job.id, "GENERATING_MOCK_DATA", 55);

      const codegen = await this.provider.generate({
        generationPlan: plan,
        blueprint,
        stagingDirectory: stagingAppDir,
      });

      const runtime = JSON.parse(
        await readFile(join(stagingAppDir, "src/data/blueprint-runtime.json"), "utf8"),
      ) as BlueprintRuntimeDocument;
      const mockData = JSON.parse(
        await readFile(join(stagingAppDir, "src/data/mock-data.json"), "utf8"),
      ) as {
        records: Record<string, unknown[]>;
        seed: string;
        totals?: Record<string, number>;
      };

      await this.deps.jobs.setStage(job.id, "VALIDATING_GENERATED_SOURCE", 60);
      await validateGeneratedSource({ stagingAppDir, plan });
      await validateDependencyPolicy({ stagingAppDir, plan });
      validateRoutes(runtime);
      validateBlueprintCoverage({ runtime, plan });
      validateMockDataIntegrity({
        blueprint,
        bundle: mockData as import("./renderers/mock-data-renderer.js").MockDataBundle,
      });
      const coverage = buildCoverage(plan, runtime);

      let manifest = parseGenerationManifest({
        schemaVersion: "1.0",
        generationId: plan.generationId,
        companyId: plan.companyId,
        companySlug: plan.companySlug,
        status: "VALIDATED",
        sourceHashes: {
          blueprintHash,
          specificationHash: input.specificationHash,
          masterPromptHash: input.masterPromptHash,
          templateHash,
        },
        provider: {
          id: codegen.providerId,
          version: plan.provider.providerVersion,
        },
        releasePath: `generated/releases/${plan.generationId}/app`,
        files: await this.collectFileEntries(stagingAppDir, codegen.filesWritten),
        coverage,
        validation: {
          sourcePolicy: true,
          dependencyPolicy: true,
          routeValidation: true,
          mockDataIntegrity: true,
          typecheck: false,
          tests: false,
          build: false,
          securityScan: false,
        },
        build: { command: ["/usr/bin/npm", "run", "build"] },
        repairAttempts: [],
        mockRecordTotal: Object.values(mockData.records).reduce(
          (n, rows) => n + (Array.isArray(rows) ? rows.length : 0),
          0,
        ),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      await writeJsonAtomic(paths.generationManifestJson, manifest);

      await this.deps.jobs.setStage(job.id, "INSTALLING_GENERATED_DEPENDENCIES", 68);
      await this.deps.jobs.setStage(job.id, "TYPECHECKING_GENERATED_APP", 75);
      await this.deps.jobs.setStage(job.id, "TESTING_GENERATED_APP", 82);
      await this.deps.jobs.setStage(job.id, "BUILDING_GENERATED_APP", 88);

      const buildReport = await this.buildService.runAll(stagingAppDir);
      await writeJsonAtomic(paths.buildReportJson, {
        generationId: plan.generationId,
        ...buildReport,
        deployed: false,
        note: "Application generated and build verified. The application has not been deployed.",
      });

      manifest = {
        ...manifest,
        status: "BUILD_PASSED",
        validation: {
          ...manifest.validation,
          typecheck: true,
          tests: true,
          build: true,
        },
        build: {
          command: ["/usr/bin/npm", "run", "build"],
          startedAt: buildReport.steps[0]?.startedAt,
          finishedAt: buildReport.finishedAt,
          exitCode: 0,
          durationMs: buildReport.steps.reduce((n, s) => n + s.durationMs, 0),
          sanitizedSummary: "install, typecheck, test, and production build succeeded",
        },
        updatedAt: nowIso(),
      };

      await this.deps.jobs.setStage(job.id, "SCANNING_GENERATED_APP", 93);
      const scan = await scanGeneratedAppSecurity(stagingAppDir);
      if (!scan.ok) {
        throw new AppError("GENERATION_SECURITY_FAILED", "Generated app failed security scan", {
          details: {
            findings: scan.findings.filter((f) => f.severity === "high").slice(0, 10),
          },
        });
      }
      manifest = {
        ...manifest,
        validation: { ...manifest.validation, securityScan: true },
        updatedAt: nowIso(),
      };

      await this.deps.jobs.setStage(job.id, "PROMOTING_GENERATED_RELEASE", 97);
      const pointer = await promoteStagingToRelease({
        projectsRoot: this.deps.projectsRoot,
        slug,
        generationId: plan.generationId,
        stagingAppDir,
        blueprintHash,
      });

      manifest = {
        ...manifest,
        status: "PROMOTED",
        releasePath: pointer.releaseRelativePath,
        updatedAt: nowIso(),
      };
      await writeJsonAtomic(paths.generationManifestJson, manifest);

      await this.deps.jobs.setStage(job.id, "APPLICATION_GENERATION_COMPLETE", 100);
      await this.deps.jobs.succeed(job.id, {
        phase: 4,
        generationId: plan.generationId,
        releasePath: pointer.releaseRelativePath,
        deployed: false,
      });

      this.deps.logger.info(
        { companySlug: slug, generationId: plan.generationId },
        "generation.complete",
      );

      return {
        ok: true,
        jobId: job.id,
        companyId: input.companyId,
        companySlug: slug,
        generationId: plan.generationId,
        reused: false,
        manifest,
        pointer,
        message: formatGenerationMessage({
          blueprint,
          plan,
          manifest,
          reused: false,
        }),
      };
    } catch (error) {
      const code = isAppError(error) ? error.code : "INTERNAL_ERROR";
      const msg = error instanceof Error ? error.message : String(error);
      await this.deps.jobs.fail(job.id, { code, message: msg }).catch(() => undefined);
      throw error;
    }
  }

  private verifySourceHashes(input: {
    knowledgeHash: string;
    specificationHash: string;
    masterPromptHash: string;
    blueprint: CompanyOSBlueprint;
  }): void {
    const src = input.blueprint.sourceArtifacts;
    if (src.companyKnowledgeHash && input.knowledgeHash && src.companyKnowledgeHash !== input.knowledgeHash) {
      throw new AppError("GENERATION_SOURCE_MISMATCH", "Blueprint knowledge hash mismatch");
    }
    if (
      src.masterBuildSpecificationHash &&
      input.specificationHash &&
      src.masterBuildSpecificationHash !== input.specificationHash
    ) {
      throw new AppError("GENERATION_SOURCE_MISMATCH", "Blueprint specification hash mismatch");
    }
    if (src.masterPromptHash && input.masterPromptHash && src.masterPromptHash !== input.masterPromptHash) {
      throw new AppError("GENERATION_SOURCE_MISMATCH", "Blueprint master prompt hash mismatch");
    }
  }

  private async tryReuseCurrentRelease(
    slug: string,
    blueprintHash: string,
    companyId: string,
  ): Promise<GenerationResult | null> {
    const paths = this.workspace.resolvePaths(slug);
    let pointer: CurrentGenerationPointer | null = null;
    try {
      pointer = (await readJsonFile(paths.currentGenerationJson)) as CurrentGenerationPointer;
    } catch {
      return null;
    }
    if (!pointer?.generationId || pointer.blueprintHash !== blueprintHash) {
      return null;
    }

    let manifest: GenerationManifest | null = null;
    try {
      manifest = parseGenerationManifest(await readJsonFile(paths.generationManifestJson));
    } catch {
      return null;
    }
    if (manifest.status !== "PROMOTED" || manifest.generationId !== pointer.generationId) {
      return null;
    }

    // Template security upgrades (e.g. v1 → v2) must invalidate reuse even when
    // the Blueprint hash is unchanged. Never mutate an immutable prior release.
    try {
      const currentTemplateHash = await hashTemplate(this.deps.cwd);
      if (
        manifest.sourceHashes?.templateHash &&
        manifest.sourceHashes.templateHash !== currentTemplateHash
      ) {
        return null;
      }
    } catch {
      return null;
    }

    const job = await this.deps.jobs.create({
      type: "GENERATION",
      companyId,
      currentStage: "APPLICATION_GENERATION_COMPLETE",
      input: { phase: 4, reused: true, generationId: pointer.generationId },
    });
    await this.deps.jobs.transition(job.id, "RUNNING");
    await this.deps.jobs.setStage(job.id, "APPLICATION_GENERATION_COMPLETE", 100);
    await this.deps.jobs.succeed(job.id, {
      phase: 4,
      reused: true,
      generationId: pointer.generationId,
      deployed: false,
    });

    const blueprint = await this.deps.blueprints.get(slug);
    if (!blueprint) return null;

    return {
      ok: true,
      jobId: job.id,
      companyId,
      companySlug: slug,
      generationId: pointer.generationId,
      reused: true,
      manifest,
      pointer,
      message: formatGenerationMessage({
        blueprint,
        plan: null,
        manifest,
        reused: true,
      }),
    };
  }

  private emptyManifest(plan: GenerationPlan, status: GenerationManifest["status"]): GenerationManifest {
    return parseGenerationManifest({
      schemaVersion: "1.0",
      generationId: plan.generationId,
      companyId: plan.companyId,
      companySlug: plan.companySlug,
      status,
      sourceHashes: {
        blueprintHash: plan.sourceHashes.companyOSBlueprintHash,
        specificationHash: plan.sourceHashes.masterBuildSpecificationHash,
        masterPromptHash: plan.sourceHashes.masterPromptHash,
        templateHash: plan.template.contentHash,
      },
      provider: { id: plan.provider.id, version: plan.provider.providerVersion },
      releasePath: "",
      files: [],
      coverage: {
        dashboards: { expected: plan.expectedCoverage.dashboardIds, generated: [], missing: plan.expectedCoverage.dashboardIds },
        modules: { expected: plan.expectedCoverage.moduleIds, generated: [], missing: plan.expectedCoverage.moduleIds },
        workflows: { expected: plan.expectedCoverage.workflowIds, generated: [], missing: plan.expectedCoverage.workflowIds },
        agents: { expected: plan.expectedCoverage.agentIds, generated: [], missing: plan.expectedCoverage.agentIds },
        entities: { expected: plan.expectedCoverage.entityIds, generated: [], missing: plan.expectedCoverage.entityIds },
      },
      validation: {
        sourcePolicy: false,
        dependencyPolicy: false,
        routeValidation: false,
        mockDataIntegrity: false,
        typecheck: false,
        tests: false,
        build: false,
        securityScan: false,
      },
      build: { command: [] },
      repairAttempts: [],
      mockRecordTotal: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  private async collectFileEntries(
    stagingAppDir: string,
    deterministicFiles: string[],
  ): Promise<GenerationManifest["files"]> {
    const listed = await listFilesRecursive(stagingAppDir);
    const det = new Set(deterministicFiles);
    const out: GenerationManifest["files"] = [];
    for (const f of listed.slice(0, 400)) {
      if (f.path.startsWith("node_modules/") || f.path.startsWith(".next/")) continue;
      const full = join(stagingAppDir, f.path);
      out.push({
        path: f.path,
        hash: await hashFile(full),
        size: f.size,
        source: det.has(f.path) ? "DETERMINISTIC" : "TEMPLATE",
      });
    }
    return out;
  }
}

function buildCoverage(plan: GenerationPlan, runtime: BlueprintRuntimeDocument): GenerationManifest["coverage"] {
  const pair = (expected: string[], generated: string[]) => {
    const set = new Set(generated);
    return {
      expected,
      generated,
      missing: expected.filter((id) => !set.has(id)),
    };
  };
  return {
    dashboards: pair(plan.expectedCoverage.dashboardIds, runtime.dashboards.map((d) => d.id)),
    modules: pair(plan.expectedCoverage.moduleIds, runtime.modules.map((m) => m.id)),
    workflows: pair(plan.expectedCoverage.workflowIds, runtime.workflows.map((w) => w.id)),
    agents: pair(plan.expectedCoverage.agentIds, runtime.agents.map((a) => a.id)),
    entities: pair(plan.expectedCoverage.entityIds, runtime.entities.map((e) => e.id)),
  };
}

export function formatGenerationMessage(input: {
  blueprint: CompanyOSBlueprint;
  plan: GenerationPlan | null;
  manifest: GenerationManifest;
  reused: boolean;
  dryRun?: boolean;
}): string {
  const { blueprint, manifest } = input;
  const persian = /[\u0600-\u06FF]/.test(blueprint.company.displayName);
  const modules = manifest.coverage.modules.generated.length || blueprint.modules.length;
  const dashboards = manifest.coverage.dashboards.generated.length || blueprint.dashboards.length;
  const workflows = manifest.coverage.workflows.generated.length || blueprint.workflows.length;
  const agents = manifest.coverage.agents.generated.length || blueprint.agents.length;
  const entities = manifest.coverage.entities.generated.length || blueprint.dataModel.entities.length;
  const records = manifest.mockRecordTotal ?? 0;

  if (input.dryRun) {
    return persian
      ? [
          "برنامه تولید (dry-run) آماده شد — فایلی نوشته نشد.",
          `شرکت: ${blueprint.company.displayName}`,
          `شناسه تولید پیشنهادی: ${manifest.generationId}`,
          "این نسخه هنوز Deploy نشده و URL عمومی ندارد.",
        ].join("\n")
      : [
          "Generation plan dry-run complete — no application files written.",
          `Company: ${blueprint.company.displayName}`,
          `Proposed generation id: ${manifest.generationId}`,
          "The application has not been deployed.",
        ].join("\n");
  }

  if (persian) {
    return [
      input.reused
        ? "نسخه تولیدشده فعلی با Blueprint هم‌خوان است و مجدداً استفاده شد."
        : "اپلیکیشن مدیریتی شرکت تولید و Build آن با موفقیت تأیید شد.",
      "",
      `شرکت: ${blueprint.company.displayName}`,
      `نسخه تولیدشده: ${manifest.generationId}`,
      `زبان رابط: فارسی`,
      `چیدمان: راست‌به‌چپ`,
      `ماژول‌ها: ${modules}`,
      `داشبوردها: ${dashboards}`,
      `گردش‌کارهای نمایشی: ${workflows}`,
      `عامل‌های هوش مصنوعی نمایشی: ${agents}`,
      `موجودیت‌های داده: ${entities}`,
      `رکوردهای Mock: ${records}`,
      `Typecheck: موفق`,
      `Tests: موفق`,
      `Production Build: موفق`,
      "",
      "Application generated and build verified",
      "این نسخه هنوز Deploy نشده و URL عمومی ندارد.",
      "The application has not been deployed.",
    ].join("\n");
  }

  return [
    input.reused
      ? "Current generated release matches the Blueprint and was reused."
      : "Application generated and build verified",
    "",
    `Company: ${blueprint.company.displayName}`,
    `Generation: ${manifest.generationId}`,
    `Modules: ${modules}`,
    `Dashboards: ${dashboards}`,
    `Workflows: ${workflows}`,
    `Agents: ${agents}`,
    `Entities: ${entities}`,
    `Mock records: ${records}`,
    "Typecheck: passed",
    "Tests: passed",
    "Production build: passed",
    "",
    "The application has not been deployed.",
  ].join("\n");
}
