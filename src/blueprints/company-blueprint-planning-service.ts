import { readJsonFile } from "../persistence/atomic.js";
import { resolveUnderRoot } from "../security/paths.js";
import { assertSafeSlug } from "../registry/slug.js";
import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import type { IndustryEngine } from "../industries/industry-engine.js";
import type { IndustryResolution } from "../industries/industry-resolver.js";
import type { FsMasterBuildSpecificationRepository } from "../specifications/master-build-specification-repository.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import type { FsMasterPromptRepository } from "../prompts/master-prompt-repository.js";
import type { MasterPromptArtifact } from "../prompts/master-prompt-schema.js";
import {
  buildBlueprintSummary,
  buildCompanyOSBlueprint,
} from "./company-os-blueprint-service.js";
import type { FsCompanyOSBlueprintRepository } from "./company-os-blueprint-repository.js";
import { validateCompanyOSBlueprint } from "./company-os-blueprint-validator.js";
import type { CompanyOSBlueprint, BlueprintSummary } from "./company-os-blueprint-schema.js";
import { hashJsonStable } from "./blueprint-hash.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import { AppError } from "../shared/errors.js";
import type { Logger } from "pino";

export type BlueprintResult = {
  ok: boolean;
  jobId: string;
  companyId: string;
  companySlug: string;
  blueprint: CompanyOSBlueprint;
  summary: BlueprintSummary;
  message: string;
};

export class CompanyBlueprintPlanningService {
  constructor(
    private readonly deps: {
      projectsRoot: string;
      registry: CompanyRegistry;
      knowledge: CompanyKnowledgeService;
      industry: IndustryEngine;
      specifications: FsMasterBuildSpecificationRepository;
      prompts: FsMasterPromptRepository;
      blueprints: FsCompanyOSBlueprintRepository;
      jobs: JobManager;
      logger: Logger;
    },
  ) {}

  async blueprintFromExisting(companyName: string, options?: { dryRun?: boolean }): Promise<BlueprintResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const knowledge = await this.deps.knowledge.get(resolved.company.slug);
    if (!knowledge) {
      throw new AppError(
        "NOT_FOUND",
        `No CompanyKnowledge for ${resolved.company.displayName}. Run discovery/plan first.`,
      );
    }
    const specification = await this.deps.specifications.get(resolved.company.slug);
    if (!specification) {
      throw new AppError(
        "NOT_FOUND",
        `No MasterBuildSpecification for ${resolved.company.displayName}. Run plan first.`,
      );
    }
    const prompt = await this.deps.prompts.get(resolved.company.slug);
    if (!prompt) {
      throw new AppError(
        "NOT_FOUND",
        `No Master Prompt for ${resolved.company.displayName}. Run plan first.`,
      );
    }

    let resolution: IndustryResolution;
    try {
      resolution = (await readJsonFile(
        resolveUnderRoot(
          this.deps.projectsRoot,
          assertSafeSlug(resolved.company.slug),
          ".factory",
          "industry-resolution.json",
        ),
      )) as IndustryResolution;
    } catch {
      resolution = this.deps.industry.resolveFromKnowledge(knowledge);
    }

    return this.blueprintWithArtifacts({
      knowledge,
      resolution,
      specification,
      prompt,
      companyId: resolved.company.id,
      projectId: resolved.project.id,
      dryRun: options?.dryRun,
    });
  }

  async blueprintWithArtifacts(input: {
    knowledge: CompanyKnowledge;
    resolution: IndustryResolution;
    specification: MasterBuildSpecification;
    prompt: MasterPromptArtifact;
    companyId: string;
    projectId: string;
    dryRun?: boolean;
    existingJobId?: string;
  }): Promise<BlueprintResult> {
    const { knowledge, resolution, specification, prompt } = input;

    if (knowledge.status === "NEEDS_INPUT") {
      throw new AppError("DISCOVERY_NEEDS_INPUT", "Cannot build blueprint while knowledge needs input");
    }

    const job = input.existingJobId
      ? await this.deps.jobs.require(input.existingJobId)
      : await this.deps.jobs.create({
          type: "DEMO",
          companyId: input.companyId,
          projectId: input.projectId,
          currentStage: "LOADING_PLANNING_ARTIFACTS",
          input: {
            phase: 3,
            companySlug: knowledge.companySlug,
            companyName: knowledge.displayName,
            dryRun: Boolean(input.dryRun),
          },
        });

    try {
      if (job.status === "QUEUED") {
        await this.deps.jobs.transition(job.id, "RUNNING");
      }

      await this.deps.jobs.setStage(job.id, "LOADING_PLANNING_ARTIFACTS", 5);

      // Verify source hash consistency against prompt↔spec
      if (
        prompt.specificationHash &&
        specification.contentHash &&
        prompt.specificationHash !== specification.contentHash
      ) {
        throw new AppError(
          "BLUEPRINT_SOURCE_MISMATCH",
          "Master Prompt hash does not match MasterBuildSpecification",
        );
      }

      const pack = this.deps.industry.getPack(resolution.selectedPackId);

      await this.deps.jobs.setStage(job.id, "BUILDING_PERMISSION_MODEL", 15);
      await this.deps.jobs.setStage(job.id, "BUILDING_NAVIGATION", 25);
      await this.deps.jobs.setStage(job.id, "BUILDING_DASHBOARDS", 35);
      await this.deps.jobs.setStage(job.id, "BUILDING_MODULES", 45);
      await this.deps.jobs.setStage(job.id, "BUILDING_WORKFLOWS", 55);
      await this.deps.jobs.setStage(job.id, "BUILDING_AGENT_BLUEPRINTS", 65);
      await this.deps.jobs.setStage(job.id, "BUILDING_DATA_MODEL", 72);
      await this.deps.jobs.setStage(job.id, "BUILDING_MOCK_DATA_PLAN", 78);
      await this.deps.jobs.setStage(job.id, "BUILDING_IMPLEMENTATION_PLAN", 84);

      let blueprint = buildCompanyOSBlueprint({
        knowledge,
        resolution,
        pack,
        specification,
        prompt,
      });

      await this.deps.jobs.setStage(job.id, "VALIDATING_BLUEPRINT", 90);
      validateCompanyOSBlueprint(blueprint);

      // Re-check resolution hash stored in blueprint matches current resolution
      const currentResolutionHash = hashJsonStable(resolution);
      if (blueprint.sourceArtifacts.industryResolutionHash !== currentResolutionHash) {
        throw new AppError("BLUEPRINT_SOURCE_MISMATCH", "Industry resolution hash mismatch");
      }

      const summary = buildBlueprintSummary(blueprint);

      if (!input.dryRun) {
        await this.deps.jobs.setStage(job.id, "PERSISTING_BLUEPRINT", 95);
        blueprint = await this.deps.blueprints.save(blueprint, summary);
      }

      await this.deps.jobs.setStage(job.id, "BLUEPRINT_COMPLETE", 100);
      await this.deps.jobs.succeed(job.id, {
        phase: 3,
        blueprintId: blueprint.blueprintId,
        contentHash: blueprint.contentHash,
        readyForCodeGeneration: blueprint.quality.readyForCodeGeneration,
        dryRun: Boolean(input.dryRun),
      });

      const message = formatBlueprintSummaryMessage(blueprint, summary);
      this.deps.logger.info(
        { companySlug: knowledge.companySlug, blueprintId: blueprint.blueprintId },
        "blueprint.complete",
      );

      return {
        ok: true,
        jobId: job.id,
        companyId: input.companyId,
        companySlug: knowledge.companySlug,
        blueprint,
        summary,
        message,
      };
    } catch (error) {
      const code = error instanceof AppError ? error.code : "INTERNAL_ERROR";
      const msg = error instanceof Error ? error.message : String(error);
      await this.deps.jobs.fail(job.id, { code, message: msg }).catch(() => undefined);
      throw error;
    }
  }
}

export function formatBlueprintSummaryMessage(
  blueprint: CompanyOSBlueprint,
  summary: BlueprintSummary,
): string {
  const persian = /[\u0600-\u06FF]/.test(blueprint.company.displayName);
  const ready = blueprint.quality.readyForCodeGeneration;
  const blockers = [
    ...blueprint.quality.blockingReasons,
    ...blueprint.unresolvedQuestions.filter((q) => q.blocking).map((q) => q.question),
  ].slice(0, 5);

  if (persian) {
    const industryLabel =
      blueprint.company.industryPackId === "manufacturing"
        ? "تولید صنایع غذایی"
        : blueprint.company.industryPackId;
    return [
      "Blueprint سیستم‌عامل شرکتی تکمیل شد.",
      "",
      `شرکت: ${blueprint.company.displayName}`,
      `صنعت: ${industryLabel}`,
      `ماژول‌ها: ${summary.counts.modules}`,
      `داشبوردها: ${summary.counts.dashboards}`,
      `گردش‌کارها: ${summary.counts.workflows}`,
      `نقش‌ها: ${summary.counts.roles}`,
      `عامل‌های هوش مصنوعی: ${summary.counts.agents}`,
      `موجودیت‌های داده: ${summary.counts.entities}`,
      `امتیاز آمادگی پیاده‌سازی: ${blueprint.quality.implementationReadinessScore.toFixed(2)}`,
      `آماده برای تولید کد: ${ready ? "بله" : "خیر"}`,
      "",
      "موارد نیازمند تأیید:",
      ...(blockers.length ? blockers.map((b) => `- ${b}`) : ["- مورد مسدودکننده ثبت نشد"]),
      "",
      "این مرحله فقط Blueprint است؛ تولید اپلیکیشن در مرحله جداگانه (/demo یا generate) انجام می‌شود.",
    ].join("\n");
  }

  return [
    "Company OS blueprint completed.",
    "",
    `Company: ${blueprint.company.displayName}`,
    `Industry pack: ${blueprint.company.industryPackId}`,
    `Modules: ${summary.counts.modules}`,
    `Dashboards: ${summary.counts.dashboards}`,
    `Workflows: ${summary.counts.workflows}`,
    `Roles: ${summary.counts.roles}`,
    `AI agents: ${summary.counts.agents}`,
    `Data entities: ${summary.counts.entities}`,
    `Implementation readiness: ${blueprint.quality.implementationReadinessScore.toFixed(2)}`,
    `Ready for code generation: ${ready ? "Yes" : "No"}`,
    "",
    "Items requiring confirmation:",
    ...(blockers.length ? blockers.map((b) => `- ${b}`) : ["- No blocking items"]),
    "",
    "This Blueprint step does not generate application source. Generation runs separately via /demo or npm run generate when ready.",
  ].join("\n");
}
