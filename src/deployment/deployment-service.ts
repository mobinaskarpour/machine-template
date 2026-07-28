import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import { assertSafeSlug } from "../registry/slug.js";
import type { FsCompanyOSBlueprintRepository } from "../blueprints/company-os-blueprint-repository.js";
import { GenerationWorkspace } from "../generation/generation-workspace.js";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { QualityArtifactRepository } from "../quality/quality-artifact-repository.js";
import { resolveUnderRoot } from "../security/paths.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import type { AdvisorySummary } from "./dependency-audit.js";
import { runProductionNpmAudit } from "./dependency-audit.js";
import type { BrowserPredeployQaResult } from "./browser-predeploy-qa.js";
import { runBrowserPredeployQa } from "./browser-predeploy-qa.js";
import { evaluatePreDeploymentGate } from "./predeployment-gate.js";
import type { PreDeploymentGateResult } from "./predeployment-gate-schema.js";
import { PreDeploymentRepository } from "./predeployment-repository.js";
import { loadDeploymentReadiness, collectKeyRoutes } from "./deployment-readiness.js";
import { acquireDeploymentLock } from "./deployment-lock.js";
import { DeploymentRepository } from "./deployment-repository.js";
import { PortAllocator } from "./port-allocator.js";
import type { DeploymentProvider, DeploymentProviderLogs, DeploymentProviderStatus } from "./providers/deployment-provider.js";
import { Pm2DeploymentProvider } from "./providers/pm2-deployment-provider.js";
import { runBlueGreenDeploy, type BlueGreenDeployResult } from "./deployment-orchestrator.js";
import { rollbackToPreviousDeployment } from "./release-rollback.js";
import { writeDeploymentManifest } from "./deployment-manifest.js";
import { verifyDeploymentHealth, type DeploymentHealthResult } from "./health-verifier.js";
import { fetchSanitizedLogs } from "./runtime-log-service.js";
import { NginxProxyProvider } from "./proxy/nginx-proxy-provider.js";
import { CertbotSslProvider } from "./ssl/certbot-ssl-provider.js";
import type { DeploymentRecord } from "./deployment-record-schema.js";
import { startLocalApp, type LocalAppHandle } from "../quality/runtime/local-app-runner.js";
import { ensureReleaseRuntimeInstalled } from "./release-runtime-prepare.js";

export type DeploymentServiceDeps = {
  cwd: string;
  projectsRoot: string;
  memoryQualityDir: string;
  memoryDeploymentsDir: string;
  portAllocationsPath: string;
  registry: CompanyRegistry;
  blueprints: FsCompanyOSBlueprintRepository;
  runner: SafeCommandRunner;
  logger: Logger;
  config: AppConfig;
  provider?: DeploymentProvider;
  runDependencyAudit?: (appDir: string, runner: SafeCommandRunner) => Promise<AdvisorySummary>;
  runBrowserQaFn?: (input: {
    baseUrl: string;
    routes: string[];
    artifactsDir: string;
    requireRtl?: boolean;
  }) => Promise<BrowserPredeployQaResult>;
};

export type DeployOptions = {
  public?: boolean;
  dryRun?: boolean;
};

export type DeployResult = {
  gate: PreDeploymentGateResult;
  deployment: BlueGreenDeployResult;
};

export type StatusResult = {
  record: DeploymentRecord;
  providerStatus: DeploymentProviderStatus | null;
};

export type HealthResult = {
  record: DeploymentRecord;
  health: DeploymentHealthResult;
};

export type LogsResult = {
  record: DeploymentRecord;
  logs: DeploymentProviderLogs;
};

/**
 * Public façade for Phase 6 deployment/operations. Every mutating action is
 * guarded by a per-company file lock, and every network surface stays on
 * 127.0.0.1 unless an operator has explicitly configured a reverse proxy +
 * SSL provider for public exposure.
 */
export class DeploymentService {
  private readonly workspace: GenerationWorkspace;
  private readonly qualityArtifacts: QualityArtifactRepository;
  private readonly repository: DeploymentRepository;
  private readonly predeployRepository: PreDeploymentRepository;
  private readonly portAllocator: PortAllocator;
  private readonly provider: DeploymentProvider;

  constructor(private readonly deps: DeploymentServiceDeps) {
    this.workspace = new GenerationWorkspace(deps.projectsRoot);
    this.qualityArtifacts = new QualityArtifactRepository(deps.projectsRoot, deps.memoryQualityDir);
    this.repository = new DeploymentRepository(deps.projectsRoot, deps.memoryDeploymentsDir);
    this.predeployRepository = new PreDeploymentRepository(deps.projectsRoot);
    this.portAllocator = new PortAllocator(
      deps.portAllocationsPath,
      deps.config.deployment.portMin,
      deps.config.deployment.portMax,
    );
    this.provider = deps.provider ?? new Pm2DeploymentProvider(deps.runner, deps.cwd);
  }

  private lockPath(slug: string): string {
    return resolveUnderRoot(this.deps.projectsRoot, assertSafeSlug(slug), ".factory", "deployment.lock");
  }

  async predeploy(
    companyName: string,
    opts?: { publicExposureRequested?: boolean },
  ): Promise<PreDeploymentGateResult> {
    const publicExposureRequested = opts?.publicExposureRequested ?? false;
    if (publicExposureRequested && !this.deps.config.deployment.publicEnabled) {
      throw new AppError(
        "DEPLOYMENT_PUBLIC_NOT_CONFIGURED",
        "Public exposure requested but DEPLOYMENT_PUBLIC_ENABLED is false",
      );
    }

    const readiness = await loadDeploymentReadiness({
      registry: this.deps.registry,
      blueprints: this.deps.blueprints,
      workspace: this.workspace,
      qualityArtifacts: this.qualityArtifacts,
      companyName,
    });

    const predeployRunId = `pre_${readiness.generationId}_${Date.now().toString(36)}`;
    const artifactsDir = resolveUnderRoot(
      this.deps.projectsRoot,
      readiness.companySlug,
      "artifacts",
      "predeploy",
      predeployRunId,
    );

    let browserQaResult: BrowserPredeployQaResult | undefined;
    let qaHandle: LocalAppHandle | undefined;
    try {
      if (this.deps.runBrowserQaFn) {
        // Tests / fixtures inject browser results without starting a real server.
        browserQaResult = await this.deps.runBrowserQaFn({
          baseUrl: "http://127.0.0.1:9/",
          routes: readiness.appRoutes,
          artifactsDir,
          requireRtl: readiness.requireRtl,
        });
      } else {
        await ensureReleaseRuntimeInstalled({
          releaseAppDir: readiness.releaseAppDir,
          runner: this.deps.runner,
        });
        qaHandle = await startLocalApp({
          appDir: readiness.releaseAppDir,
          startupTimeoutMs: 120_000,
        });
        const browserBaseUrl = `http://127.0.0.1:${qaHandle.port}/`;
        browserQaResult = await runBrowserPredeployQa({
          baseUrl: browserBaseUrl,
          routes: readiness.appRoutes,
          artifactsDir,
          requireRtl: readiness.requireRtl,
        });
      }
    } finally {
      if (qaHandle) {
        await qaHandle.stop().catch(() => undefined);
      }
    }

    const gate = await evaluatePreDeploymentGate({
      companyId: readiness.companyId,
      companySlug: readiness.companySlug,
      generationId: readiness.generationId,
      qualityRunId: readiness.qualityRunId,
      releaseAppDir: readiness.releaseAppDir,
      qualityAccepted: readiness.qualityAccepted,
      sourceHashesMatch: readiness.sourceHashesMatch,
      buildPassed: readiness.buildPassed,
      securityPassed: readiness.securityPassed,
      releaseImmutable: readiness.releaseImmutable,
      publicExposureRequested,
      acceptNextHighLoopback: this.deps.config.deployment.acceptNextHighLoopback,
      runner: this.deps.runner,
      browserQaRoutes: readiness.appRoutes,
      requireRtl: readiness.requireRtl,
      artifactsDir,
      browserQaResult,
      runDependencyAudit: this.deps.runDependencyAudit ?? runProductionNpmAudit,
    });

    await this.predeployRepository.save(readiness.companySlug, gate);
    return gate;
  }

  private assertPublicInfrastructureConfigured(): void {
    const proxy = new NginxProxyProvider({
      publicEnabled: this.deps.config.deployment.publicEnabled,
      nginxConfigRoot: this.deps.config.deployment.nginxConfigRoot,
      domainPattern: this.deps.config.deployment.domainPattern,
    });
    if (!proxy.isConfigured()) {
      throw new AppError(
        "DEPLOYMENT_PUBLIC_NOT_CONFIGURED",
        "Reverse proxy is not configured — set DEPLOYMENT_PUBLIC_ENABLED, NGINX_CONFIG_ROOT, and DEPLOYMENT_DOMAIN_PATTERN",
      );
    }
    const ssl = new CertbotSslProvider({
      sslProvider: this.deps.config.deployment.sslProvider,
      certbotEmail: this.deps.config.deployment.certbotEmail,
    });
    if (!ssl.isConfigured()) {
      throw new AppError(
        "DEPLOYMENT_PUBLIC_NOT_CONFIGURED",
        "SSL is not configured — set SSL_PROVIDER to CERTBOT (with CERTBOT_EMAIL) or EXTERNAL",
      );
    }
  }

  private async ensurePublicExposure(slug: string, port: number): Promise<string> {
    const proxy = new NginxProxyProvider({
      publicEnabled: this.deps.config.deployment.publicEnabled,
      nginxConfigRoot: this.deps.config.deployment.nginxConfigRoot,
      domainPattern: this.deps.config.deployment.domainPattern,
    });
    const route = await proxy.ensurePublicRoute({ slug, port });
    const ssl = new CertbotSslProvider({
      sslProvider: this.deps.config.deployment.sslProvider,
      certbotEmail: this.deps.config.deployment.certbotEmail,
    });
    const sslResult = await ssl.provision(route.domain);
    const scheme = sslResult.configured ? "https" : "http";
    return `${scheme}://${route.domain}/`;
  }

  async deploy(companyName: string, opts?: DeployOptions): Promise<DeployResult> {
    const publicRequested = opts?.public ?? false;
    if (publicRequested) {
      this.assertPublicInfrastructureConfigured();
    }

    const resolved = await this.deps.registry.resolveByName(companyName);
    const lock = await acquireDeploymentLock(
      this.lockPath(resolved.company.slug),
      `deploy:${process.pid}:${nowIso()}`,
    );
    try {
      const gate = await this.predeploy(companyName, { publicExposureRequested: publicRequested });
      if (!gate.passed) {
        throw new AppError(
          "PREDEPLOY_GATE_FAILED",
          `Pre-deployment gate did not pass: ${gate.blockingReasons.join("; ")}`,
          { details: { blockingReasons: gate.blockingReasons } },
        );
      }

      const readiness = await loadDeploymentReadiness({
        registry: this.deps.registry,
        blueprints: this.deps.blueprints,
        workspace: this.workspace,
        qualityArtifacts: this.qualityArtifacts,
        companyName,
      });

      let deployment = await runBlueGreenDeploy({
        provider: this.provider,
        repository: this.repository,
        portAllocator: this.portAllocator,
        companyId: readiness.companyId,
        companySlug: readiness.companySlug,
        generationId: readiness.generationId,
        gateId: gate.gateId,
        releaseAppDir: readiness.releaseAppDir,
        publicExposureRequested: publicRequested,
        appRoutes: readiness.appRoutes,
        dryRun: opts?.dryRun,
        logger: this.deps.logger,
      });

      if (publicRequested && !opts?.dryRun) {
        const publicUrl = await this.ensurePublicExposure(readiness.companySlug, deployment.record.port);
        const updatedRecord = { ...deployment.record, publicUrl, updatedAt: nowIso() };
        await this.repository.saveDeploymentRecord(readiness.companySlug, updatedRecord);
        await this.repository.setCurrent(readiness.companySlug, updatedRecord);
        deployment = { ...deployment, record: updatedRecord };
      }

      if (!opts?.dryRun) {
        await writeDeploymentManifest({
          projectsRoot: this.deps.projectsRoot,
          slug: readiness.companySlug,
          deploymentId: deployment.record.deploymentId,
          plan: deployment.plan,
          record: deployment.record,
        });
      }

      return { gate, deployment };
    } finally {
      await lock.release();
    }
  }

  async status(companyName: string): Promise<StatusResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    const providerStatus = await this.provider.describe(record.processName).catch(() => null);
    return { record, providerStatus };
  }

  private async currentAppRoutes(slug: string, generationId: string): Promise<string[]> {
    const releaseAppDir = this.workspace.releaseAppDir(slug, generationId);
    try {
      const runtime = JSON.parse(
        await readFile(join(releaseAppDir, "src/data/blueprint-runtime.json"), "utf8"),
      );
      return collectKeyRoutes(runtime);
    } catch {
      return ["/"];
    }
  }

  async health(companyName: string): Promise<HealthResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    const appRoutes = await this.currentAppRoutes(record.companySlug, record.generationId);
    const health = await verifyDeploymentHealth({
      provider: this.provider,
      processName: record.processName,
      port: record.port,
      companySlug: record.companySlug,
      generationId: record.generationId,
      appRoutes,
    });
    return { record, health };
  }

  async logs(companyName: string, lines = 100): Promise<LogsResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    const logs = await fetchSanitizedLogs(this.provider, record.processName, lines);
    return { record, logs };
  }

  async restart(companyName: string): Promise<DeploymentRecord> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    const status = await this.provider.restart(record.processName);
    const updated: DeploymentRecord = {
      ...record,
      status: status.status === "online" ? "HEALTHY" : "UNHEALTHY",
      restartCount: status.restarts,
      updatedAt: nowIso(),
    };
    await this.repository.saveDeploymentRecord(record.companySlug, updated);
    await this.repository.setCurrent(record.companySlug, updated);
    return updated;
  }

  async stop(companyName: string): Promise<DeploymentRecord> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    await this.provider.stop(record.processName);
    const updated: DeploymentRecord = {
      ...record,
      status: "STOPPED",
      stoppedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.repository.saveDeploymentRecord(record.companySlug, updated);
    await this.repository.setCurrent(record.companySlug, updated);
    return updated;
  }

  async start(companyName: string): Promise<DeploymentRecord> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const record = await this.repository.requireCurrent(resolved.company.slug);
    const releaseAppDir = this.workspace.releaseAppDir(record.companySlug, record.generationId);
    const status = await this.provider.start({
      processName: record.processName,
      appDir: releaseAppDir,
      port: record.port,
      env: {
        MACHINE_GENERATION_ID: record.generationId,
        PORT: String(record.port),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
    });
    const updated: DeploymentRecord = {
      ...record,
      status: status.status === "online" ? "HEALTHY" : "UNHEALTHY",
      startedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.repository.saveDeploymentRecord(record.companySlug, updated);
    await this.repository.setCurrent(record.companySlug, updated);
    return updated;
  }

  async rollback(companyName: string): Promise<BlueGreenDeployResult> {
    const resolved = await this.deps.registry.resolveByName(companyName);
    const lock = await acquireDeploymentLock(
      this.lockPath(resolved.company.slug),
      `rollback:${process.pid}:${nowIso()}`,
    );
    try {
      const result = await rollbackToPreviousDeployment({
        provider: this.provider,
        repository: this.repository,
        portAllocator: this.portAllocator,
        workspace: this.workspace,
        companyId: resolved.company.id,
        companySlug: resolved.company.slug,
        appRoutes: [],
        logger: this.deps.logger,
      });
      await writeDeploymentManifest({
        projectsRoot: this.deps.projectsRoot,
        slug: resolved.company.slug,
        deploymentId: result.record.deploymentId,
        plan: result.plan,
        record: result.record,
      });
      return result;
    } finally {
      await lock.release();
    }
  }
}
