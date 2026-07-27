import { resolve } from "node:path";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import { FsCompanyRepository } from "../persistence/fs-company-repository.js";
import { FsProjectRepository } from "../persistence/fs-project-repository.js";
import { FsJobRepository } from "../persistence/fs-job-repository.js";
import { WorkspaceManager } from "../workspaces/workspace-manager.js";
import { CompanyRegistry } from "../registry/company-registry.js";
import { JobManager } from "../jobs/job-manager.js";
import type { CommandContext } from "../commands/execute.js";
import { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { FsCompanyKnowledgeRepository } from "../knowledge/company-knowledge-repository.js";
import { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import { DiscoveryOrchestrator } from "../discovery/discovery-orchestrator.js";
import { CompanyDiscoveryService } from "../discovery/company-discovery-service.js";
import { createDiscoveryProviders } from "../discovery/providers/provider-chain.js";
import type {
  KnowledgeSynthesisProvider,
  SearchProvider,
  WebsiteFetcher,
} from "../discovery/discovery-types.js";
import { IndustryEngine } from "../industries/industry-engine.js";
import { FsMasterBuildSpecificationRepository } from "../specifications/master-build-specification-repository.js";
import { FsMasterPromptRepository } from "../prompts/master-prompt-repository.js";
import { CompanyPlanningService } from "../prompts/company-planning-service.js";
import { FsCompanyOSBlueprintRepository } from "../blueprints/company-os-blueprint-repository.js";
import { CompanyBlueprintPlanningService } from "../blueprints/company-blueprint-planning-service.js";
import { ApplicationGenerationService } from "../generation/application-generation-service.js";
import { mkdir } from "node:fs/promises";

export type AppServices = {
  config: AppConfig;
  logger: Logger;
  companies: FsCompanyRepository;
  projects: FsProjectRepository;
  jobs: FsJobRepository;
  workspaces: WorkspaceManager;
  registry: CompanyRegistry;
  jobManager: JobManager;
  runner: SafeCommandRunner;
  knowledge: CompanyKnowledgeService;
  discovery: CompanyDiscoveryService;
  industry: IndustryEngine;
  planning: CompanyPlanningService;
  blueprint: CompanyBlueprintPlanningService;
  generation: ApplicationGenerationService;
  commandContext: CommandContext;
};

export async function createAppServices(
  config: AppConfig,
  logger: Logger,
  overrides?: {
    searchProvider?: SearchProvider;
    fetcher?: WebsiteFetcher;
    synthesis?: KnowledgeSynthesisProvider;
    generation?: ApplicationGenerationService;
  },
): Promise<AppServices> {
  await mkdir(config.dataRoot, { recursive: true });
  await mkdir(config.companiesDir, { recursive: true });
  await mkdir(config.projectsRoot, { recursive: true });
  await mkdir(config.jobsDir, { recursive: true });
  await mkdir(config.logsDir, { recursive: true });
  await mkdir(config.memoryDir, { recursive: true });
  const memorySpecsDir = resolve(config.dataRoot, "memory", "specifications");
  const memoryBlueprintsDir = resolve(config.dataRoot, "memory", "blueprints");
  await mkdir(memorySpecsDir, { recursive: true });
  await mkdir(memoryBlueprintsDir, { recursive: true });
  await mkdir(resolve(config.dataRoot, "projects-meta"), { recursive: true });

  const companies = new FsCompanyRepository(config.companiesDir);
  const projects = new FsProjectRepository(
    resolve(config.dataRoot, "projects-meta"),
  );
  const jobs = new FsJobRepository(config.jobsDir);
  const workspaces = new WorkspaceManager(config.projectsRoot);
  const registry = new CompanyRegistry(companies, projects, workspaces);
  const jobManager = new JobManager(jobs, logger);
  const runner = new SafeCommandRunner();

  const knowledgeRepo = new FsCompanyKnowledgeRepository(
    config.projectsRoot,
    config.memoryDir,
    {
      minReadyConfidence: config.discovery.minReadyConfidence,
      minWebsiteConfidence: config.discovery.minWebsiteConfidence,
    },
  );
  const knowledge = new CompanyKnowledgeService(knowledgeRepo);

  const providers = await createDiscoveryProviders({
    config,
    runner,
    logger,
    overrides,
  });

  const orchestrator = new DiscoveryOrchestrator({
    config,
    registry,
    jobs: jobManager,
    knowledge,
    companies,
    searchProvider: providers.searchProvider,
    fetcher: providers.fetcher,
    synthesis: providers.synthesis,
    logger,
  });
  const discovery = new CompanyDiscoveryService(orchestrator);
  const industry = new IndustryEngine();
  const specifications = new FsMasterBuildSpecificationRepository(
    config.projectsRoot,
    memorySpecsDir,
  );
  const prompts = new FsMasterPromptRepository(config.projectsRoot);
  const planning = new CompanyPlanningService({
    projectsRoot: config.projectsRoot,
    registry,
    knowledge,
    industry,
    specifications,
    prompts,
    jobs: jobManager,
    logger,
  });
  const blueprints = new FsCompanyOSBlueprintRepository(
    config.projectsRoot,
    memoryBlueprintsDir,
  );
  const blueprint = new CompanyBlueprintPlanningService({
    projectsRoot: config.projectsRoot,
    registry,
    knowledge,
    industry,
    specifications,
    prompts,
    blueprints,
    jobs: jobManager,
    logger,
  });
  const generation =
    overrides?.generation ??
    new ApplicationGenerationService({
      cwd: process.cwd(),
      projectsRoot: config.projectsRoot,
      registry,
      knowledge,
      specifications,
      prompts,
      blueprints,
      jobs: jobManager,
      runner,
      logger,
    });

  const commandContext: CommandContext = {
    registry,
    jobs: jobManager,
    companies,
    jobRepo: jobs,
    logger,
    discovery,
    knowledge,
    planning,
    blueprint,
    generation,
  };

  return {
    config,
    logger,
    companies,
    projects,
    jobs,
    workspaces,
    registry,
    jobManager,
    runner,
    knowledge,
    discovery,
    industry,
    planning,
    blueprint,
    generation,
    commandContext,
  };
}
