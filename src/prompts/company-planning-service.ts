import { writeJsonAtomic } from "../persistence/atomic.js";
import { resolveUnderRoot } from "../security/paths.js";
import { assertSafeSlug } from "../registry/slug.js";
import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import type { IndustryEngine } from "../industries/industry-engine.js";
import type { IndustryResolution } from "../industries/industry-resolver.js";
import { buildMasterBuildSpecification } from "../specifications/master-build-specification-service.js";
import type { FsMasterBuildSpecificationRepository } from "../specifications/master-build-specification-repository.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import { buildMasterPrompt } from "./master-prompt-builder.js";
import type { FsMasterPromptRepository } from "./master-prompt-repository.js";
import type { MasterPromptArtifact } from "./master-prompt-schema.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import { AppError } from "../shared/errors.js";
import type { Logger } from "pino";

export type PlanningResult = {
  ok: boolean;
  jobId: string;
  companyId: string;
  companySlug: string;
  knowledge: CompanyKnowledge;
  resolution: IndustryResolution;
  specification: MasterBuildSpecification;
  prompt: MasterPromptArtifact;
  message: string;
  relativePaths: {
    industryResolution: string;
    specification: string;
    memorySpecification: string;
    masterPromptJson: string;
    masterPromptTxt: string;
  };
};

export class CompanyPlanningService {
  constructor(
    private readonly deps: {
      projectsRoot: string;
      registry: CompanyRegistry;
      knowledge: CompanyKnowledgeService;
      industry: IndustryEngine;
      specifications: FsMasterBuildSpecificationRepository;
      prompts: FsMasterPromptRepository;
      jobs: JobManager;
      logger: Logger;
    },
  ) {}

  async planFromExistingKnowledge(companyName: string): Promise<PlanningResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const knowledge = await this.deps.knowledge.get(resolved.company.slug);
    if (!knowledge) {
      throw new AppError(
        "NOT_FOUND",
        `No CompanyKnowledge for ${resolved.company.displayName}. Run discovery first.`,
      );
    }
    return this.planWithKnowledge(knowledge, resolved.company.id, resolved.project.id);
  }

  async planWithKnowledge(
    knowledge: CompanyKnowledge,
    companyId: string,
    projectId: string,
  ): Promise<PlanningResult> {
    if (knowledge.status === "NEEDS_INPUT") {
      throw new AppError(
        "DISCOVERY_NEEDS_INPUT",
        "CompanyKnowledge is NEEDS_INPUT; Phase 2 planning will not run",
      );
    }

    const job = await this.deps.jobs.create({
      type: "DEMO",
      companyId,
      projectId,
      currentStage: "RESOLVING_INDUSTRY",
      input: {
        phase: 2,
        companySlug: knowledge.companySlug,
        companyName: knowledge.displayName,
      },
    });

    try {
      await this.deps.jobs.transition(job.id, "RUNNING");

      await this.deps.jobs.setStage(job.id, "RESOLVING_INDUSTRY", 10);
      const resolution = this.deps.industry.resolveFromKnowledge(knowledge);

      await this.deps.jobs.setStage(job.id, "LOADING_INDUSTRY_PACK", 25);
      const pack = this.deps.industry.getPack(resolution.selectedPackId);

      const resolutionPath = resolveUnderRoot(
        this.deps.projectsRoot,
        assertSafeSlug(knowledge.companySlug),
        ".factory",
        "industry-resolution.json",
      );
      await writeJsonAtomic(resolutionPath, resolution);

      await this.deps.jobs.setStage(job.id, "BUILDING_MASTER_SPECIFICATION", 45);
      let specification = buildMasterBuildSpecification({
        knowledge,
        pack,
        resolution,
      });

      await this.deps.jobs.setStage(job.id, "VALIDATING_MASTER_SPECIFICATION", 60);
      specification = await this.deps.specifications.save(specification);

      await this.deps.jobs.setStage(job.id, "BUILDING_MASTER_PROMPT", 75);
      let prompt = buildMasterPrompt({ knowledge, specification, pack });
      if (prompt.specificationHash !== specification.contentHash) {
        prompt = {
          ...prompt,
          specificationHash: specification.contentHash ?? prompt.specificationHash,
        };
      }

      await this.deps.jobs.setStage(job.id, "PERSISTING_PLANNING_ARTIFACTS", 90);
      prompt = await this.deps.prompts.save(prompt);

      await this.deps.jobs.setStage(job.id, "PLANNING_COMPLETE", 100);
      await this.deps.jobs.succeed(job.id, {
        phase: 2,
        selectedPackId: pack.id,
        specificationHash: specification.contentHash,
        promptHash: prompt.contentHash,
        readyForBlueprintGeneration: specification.quality.readyForBlueprintGeneration,
      });

      const message = formatPlanningSummary(knowledge, specification, resolution);
      this.deps.logger.info(
        {
          companySlug: knowledge.companySlug,
          packId: pack.id,
          jobId: job.id,
        },
        "planning.complete",
      );

      return {
        ok: true,
        jobId: job.id,
        companyId,
        companySlug: knowledge.companySlug,
        knowledge,
        resolution,
        specification,
        prompt,
        message,
        relativePaths: {
          industryResolution: `data/projects/${knowledge.companySlug}/.factory/industry-resolution.json`,
          specification: `data/projects/${knowledge.companySlug}/.factory/master-build-specification.json`,
          memorySpecification: `data/memory/specifications/${knowledge.companySlug}.json`,
          masterPromptJson: `data/projects/${knowledge.companySlug}/.factory/master-prompt.json`,
          masterPromptTxt: `data/projects/${knowledge.companySlug}/.factory/master-prompt.txt`,
        },
      };
    } catch (error) {
      const code = error instanceof AppError ? error.code : "INTERNAL_ERROR";
      const msg = error instanceof Error ? error.message : String(error);
      await this.deps.jobs.fail(job.id, { code, message: msg }).catch(() => undefined);
      throw error;
    }
  }
}

export function formatPlanningSummary(
  knowledge: CompanyKnowledge,
  specification: MasterBuildSpecification,
  resolution: IndustryResolution,
): string {
  const highDashboards = specification.dashboards.filter((d) => d.priority === "HIGH").length;
  const highWorkflows = specification.workflows.filter((w) => w.priority === "HIGH").length;
  const agents = specification.agents.length;
  const entities = specification.dataModel.entities.length;
  const ready = specification.quality.readyForBlueprintGeneration ? "بله" : "خیر";
  const persian = /[\u0600-\u06FF]/.test(knowledge.displayName);

  if (persian) {
    const packLabel =
      resolution.selectedPackId === "manufacturing" ? "تولید" : specification.industry.selectedPackName;
    const specialty =
      /food|pasta|ماکارون|غذایی|پاستا/i.test(
        [
          knowledge.industry.primary,
          ...knowledge.industry.secondary,
          knowledge.identity.description,
        ].join(" "),
      )
        ? "تولید صنایع غذایی و پاستا"
        : knowledge.industry.primary;

    return [
      "برنامه‌ریزی شرکت با موفقیت تکمیل شد.",
      "",
      `شرکت: ${knowledge.displayName}`,
      `صنعت منتخب: ${packLabel}`,
      `حوزه تخصصی: ${specialty}`,
      `زبان اصلی: ${specification.company.primaryLanguage === "fa" ? "فارسی" : specification.company.primaryLanguage}`,
      `چیدمان راست‌به‌چپ: ${specification.company.rtl ? "فعال" : "غیرفعال"}`,
      `داشبوردهای اولویت‌بالا: ${highDashboards}`,
      `گردش‌کارهای اولویت‌بالا: ${highWorkflows}`,
      `عامل‌های هوش مصنوعی اولیه: ${agents}`,
      `موجودیت‌های داده: ${entities}`,
      `اطمینان مشخصات: ${specification.quality.specificationConfidence.toFixed(2)}`,
      `آماده برای تولید Blueprint: ${ready}`,
      "",
      "هنوز هیچ اپلیکیشنی تولید یا مستقر نشده است.",
    ].join("\n");
  }

  return [
    "Company planning completed.",
    "",
    `Company: ${knowledge.displayName}`,
    `Industry pack: ${specification.industry.selectedPackName}`,
    `Industry confidence: ${resolution.confidence.toFixed(2)}`,
    `High-priority dashboards: ${highDashboards}`,
    `High-priority workflows: ${highWorkflows}`,
    `Initial AI agents: ${agents}`,
    `Data entities: ${entities}`,
    `Specification confidence: ${specification.quality.specificationConfidence.toFixed(2)}`,
    `Ready for blueprint generation: ${specification.quality.readyForBlueprintGeneration ? "Yes" : "No"}`,
    "",
    "No application has been generated or deployed yet.",
  ].join("\n");
}
