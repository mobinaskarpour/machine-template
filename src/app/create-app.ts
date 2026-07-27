import { mkdir } from "node:fs/promises";
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
  commandContext: CommandContext;
};

export async function createAppServices(
  config: AppConfig,
  logger: Logger,
  overrides?: {
    searchProvider?: SearchProvider;
    fetcher?: WebsiteFetcher;
    synthesis?: KnowledgeSynthesisProvider;
  },
): Promise<AppServices> {
  await mkdir(config.dataRoot, { recursive: true });
  await mkdir(config.companiesDir, { recursive: true });
  await mkdir(config.projectsRoot, { recursive: true });
  await mkdir(config.jobsDir, { recursive: true });
  await mkdir(config.logsDir, { recursive: true });
  await mkdir(config.memoryDir, { recursive: true });
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

  const commandContext: CommandContext = {
    registry,
    jobs: jobManager,
    companies,
    jobRepo: jobs,
    logger,
    discovery,
    knowledge,
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
    commandContext,
  };
}
