import { describe, it, expect } from "vitest";
import http from "node:http";
import { mkdtemp, cp, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";

import { loadConfig, parseTelegramAdminIds, publicConfigView, type AppConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { executeCommand } from "../src/commands/execute.js";
import { parseCommand } from "../src/commands/parse.js";
import { AppError, isAppError } from "../src/shared/errors.js";
import { nowIso } from "../src/shared/ids.js";
import { writeJsonAtomic } from "../src/persistence/atomic.js";

import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import { parseCompanyKnowledge } from "../src/knowledge/company-knowledge-schema.js";
import type { FetchedPage, WebsiteFetcher } from "../src/discovery/discovery-types.js";
import { FsCompanyOSBlueprintRepository } from "../src/blueprints/company-os-blueprint-repository.js";
import { FsMasterBuildSpecificationRepository } from "../src/specifications/master-build-specification-repository.js";
import { FsMasterPromptRepository } from "../src/prompts/master-prompt-repository.js";
import { ApplicationGenerationService } from "../src/generation/application-generation-service.js";
import { GenerationWorkspace } from "../src/generation/generation-workspace.js";
import { hashDirectory } from "../src/generation/generation-types.js";
import { QualityArtifactRepository } from "../src/quality/quality-artifact-repository.js";
import { QUALITY_POLICY_VERSION } from "../src/quality/quality-thresholds.js";
import { SafeCommandRunner, type RunExecutableInput, type RunResult } from "../src/runners/safe-command-runner.js";

import { buildProcessName, colorProcessName, otherColor } from "../src/deployment/process-name.js";
import { PortAllocator } from "../src/deployment/port-allocator.js";
import { acquireDeploymentLock } from "../src/deployment/deployment-lock.js";
import { evaluateDependencyGate, ACCEPTED_RISK_NEXT_HIGH_LOOPBACK } from "../src/deployment/advisory-policy.js";
import type { AdvisorySummary } from "../src/deployment/dependency-audit.js";
import { evaluatePreDeploymentGate } from "../src/deployment/predeployment-gate.js";
import {
  isValidDomainPattern,
  renderDomainForSlug,
  assertSafeDomain,
} from "../src/deployment/proxy/domain-validator.js";
import type {
  DeploymentProvider,
  DeploymentProviderLogs,
  DeploymentProviderStartInput,
  DeploymentProviderStatus,
} from "../src/deployment/providers/deployment-provider.js";
import { DeploymentService } from "../src/deployment/deployment-service.js";

import { isAdminTelegramUser, assertOpsAuthorized } from "../src/operations/operations-policy.js";
import { OperationsService } from "../src/operations/operations-service.js";
import type { OpsActor } from "../src/operations/operations-types.js";

const fixtureRoot = join(process.cwd(), "tests/fixtures/zar-macaron");
const zarKnowledge = parseCompanyKnowledge(
  JSON.parse(readFileSync(join(fixtureRoot, "company-knowledge.json"), "utf8")),
);
const zarHome = readFileSync(join(fixtureRoot, "homepage.html"), "utf8");

function fixtureFetcher(htmlByUrl: Record<string, string>): WebsiteFetcher {
  return {
    async fetchPage(input): Promise<FetchedPage> {
      const html = htmlByUrl[input.url] ?? htmlByUrl["*"];
      if (!html) throw new AppError("DISCOVERY_FETCH_FAILED", `No fixture for ${input.url}`);
      return {
        url: input.url,
        finalUrl: input.url,
        statusCode: 200,
        contentType: "text/html",
        bodyText: html,
        bytes: Buffer.byteLength(html),
        fetchedAt: nowIso(),
      };
    },
  };
}

function okRunResult(partial?: Partial<RunResult>): RunResult {
  return {
    stdout: "",
    stderr: "",
    exitCode: 0,
    signal: null,
    timedOut: false,
    executable: "/usr/bin/npm",
    args: [],
    ...partial,
  };
}

/** Never spawns a real process — install/typecheck/test/build all report success instantly. */
class SucceedingRunner extends SafeCommandRunner {
  override async runExecutable(input: RunExecutableInput): Promise<RunResult> {
    return okRunResult({ executable: input.executable, args: input.args });
  }
}

function passingAudit(): AdvisorySummary {
  return { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0, packages: [] };
}

function passingBrowserQa() {
  return {
    available: true,
    passed: true,
    criticalIssuesClear: true,
    accessibilityCriticalClear: true,
    screenshots: [] as string[],
    routesChecked: ["/"],
    consoleErrors: [] as string[],
    viewports: ["1440x900"],
  };
}

/**
 * In-memory stand-in for Pm2DeploymentProvider: each "process" is a tiny real
 * HTTP server bound to 127.0.0.1 on the allocated port, serving /api/health
 * with the caller-supplied companySlug/generationId so health-verifier's
 * real HTTP checks exercise the full deploy/health/rollback code paths
 * without ever shelling out to pm2 or npm.
 */
class FakeDeploymentProvider implements DeploymentProvider {
  private procs = new Map<
    string,
    { server: http.Server | null; port: number; restarts: number; pid: number; generationId: string }
  >();
  private nextPid = 1000;

  private slugFromProcessName(name: string): string {
    const m = /^machine-(.+)-(blue|green)$/.exec(name);
    return m ? m[1]! : name.replace(/^machine-/, "");
  }

  private listen(processName: string, port: number, generationId: string): Promise<http.Server> {
    const slug = this.slugFromProcessName(processName);
    const server = http.createServer((req, res) => {
      if (req.url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", companySlug: slug, generationId }));
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    });
    return new Promise((resolvePromise, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => resolvePromise(server));
    });
  }

  private closeIfOpen(server: http.Server | null): Promise<void> {
    if (!server) return Promise.resolve();
    return new Promise((r) => server.close(() => r()));
  }

  async start(input: DeploymentProviderStartInput): Promise<DeploymentProviderStatus> {
    const existing = this.procs.get(input.processName);
    await this.closeIfOpen(existing?.server ?? null);
    const generationId = input.env.MACHINE_GENERATION_ID ?? "";
    const server = await this.listen(input.processName, input.port, generationId);
    const pid = existing?.pid ?? this.nextPid++;
    const restarts = existing?.restarts ?? 0;
    this.procs.set(input.processName, { server, port: input.port, restarts, pid, generationId });
    return { name: input.processName, status: "online", pid, restarts };
  }

  async stop(processName: string): Promise<void> {
    const entry = this.procs.get(processName);
    if (!entry) return;
    await this.closeIfOpen(entry.server);
    entry.server = null;
  }

  async restart(processName: string): Promise<DeploymentProviderStatus> {
    const entry = this.procs.get(processName);
    if (!entry) throw new AppError("PM2_PROCESS_FAILED", `Unknown process: ${processName}`);
    await this.closeIfOpen(entry.server);
    entry.server = await this.listen(processName, entry.port, entry.generationId);
    entry.restarts += 1;
    return { name: processName, status: "online", pid: entry.pid, restarts: entry.restarts };
  }

  async delete(processName: string): Promise<void> {
    const entry = this.procs.get(processName);
    if (!entry) return;
    await this.closeIfOpen(entry.server);
    this.procs.delete(processName);
  }

  async describe(processName: string): Promise<DeploymentProviderStatus | null> {
    const entry = this.procs.get(processName);
    if (!entry) return null;
    return { name: processName, status: entry.server ? "online" : "stopped", pid: entry.pid, restarts: entry.restarts };
  }

  async logs(processName: string, _lines: number): Promise<DeploymentProviderLogs> {
    const entry = this.procs.get(processName);
    return { out: entry ? [`[fake] ${processName} log line`] : [], err: [] };
  }
}

async function seedFixtureCompany(root: string) {
  const config = loadConfig(
    {
      DATA_ROOT: root,
      PROJECTS_ROOT: join(root, "projects"),
      LOG_LEVEL: "silent",
      NODE_ENV: "test",
      TELEGRAM_ADMIN_IDS: "111,222",
    },
    { cwd: root, requireTelegramToken: false },
  );
  const services = await createAppServices(config, createLogger({ level: "silent" }), {
    synthesis: new DeterministicKnowledgeSynthesisProvider(),
    fetcher: fixtureFetcher({ "*": zarHome }),
  });
  const resolved = await services.registry.resolveByName("زر ماکارون دپلوی");
  await services.knowledge.save({
    ...zarKnowledge,
    companyId: resolved.company.id,
    companySlug: resolved.company.slug,
  });
  await services.planning.planFromExistingKnowledge("زر ماکارون دپلوی");
  const blueprintResult = await services.blueprint.blueprintFromExisting("زر ماکارون دپلوی");
  return { config, services, resolved, blueprint: blueprintResult.blueprint };
}

/**
 * Runs the real generation pipeline (deterministic codegen + validators +
 * security scan) with all npm install/typecheck/test/build steps stubbed to
 * succeed instantly, producing a genuine promoted release directory on disk.
 */
async function generateFixtureRelease(config: AppConfig, services: any, blueprint: any, resolved: any) {
  const specifications = new FsMasterBuildSpecificationRepository(
    config.projectsRoot,
    join(config.dataRoot, "memory", "specifications"),
  );
  const prompts = new FsMasterPromptRepository(config.projectsRoot);
  const blueprints = new FsCompanyOSBlueprintRepository(
    config.projectsRoot,
    join(config.dataRoot, "memory", "blueprints"),
  );
  const specification = await specifications.get(blueprint.company.slug);
  const prompt = await prompts.get(blueprint.company.slug);
  const knowledge = await services.knowledge.get(blueprint.company.slug);

  const generation = new ApplicationGenerationService({
    cwd: process.cwd(),
    projectsRoot: config.projectsRoot,
    registry: services.registry,
    knowledge: services.knowledge,
    specifications,
    prompts,
    blueprints,
    jobs: services.jobManager,
    runner: new SucceedingRunner(),
    logger: createLogger({ level: "silent" }),
  });

  const result = await generation.generateWithArtifacts({
    knowledgeHash: knowledge!.contentHash ?? "",
    specificationHash: specification!.contentHash ?? "",
    masterPromptHash: prompt!.contentHash ?? "",
    blueprint,
    companyId: resolved.company.id,
    projectId: resolved.project.id,
    force: true,
  });
  expect(result.ok).toBe(true);
  return result;
}

async function markQualityAccepted(
  qualityArtifacts: QualityArtifactRepository,
  slug: string,
  generationId: string,
  releaseAppDir: string,
) {
  const releaseContentHash = await hashDirectory(releaseAppDir);
  await writeJsonAtomic(qualityArtifacts.currentQualityPath(slug), {
    schemaVersion: "1.0",
    companySlug: slug,
    qualityRunId: `qr_fixture_${generationId}`,
    generationId,
    qualityPolicyVersion: QUALITY_POLICY_VERSION,
    releaseContentHash,
    accepted: true,
    overallScore: 0.95,
    updatedAt: nowIso(),
  });
}

describe("process-name", () => {
  it("builds a safe, ascii, hyphenated process name", () => {
    expect(buildProcessName("acme-co")).toBe("machine-acme-co");
  });

  it("truncates very long slugs to 48 chars without trailing hyphen", () => {
    const longSlug = "a".repeat(80);
    const name = buildProcessName(longSlug);
    expect(name.length).toBeLessThanOrEqual(48);
    expect(name.endsWith("-")).toBe(false);
    expect(name).toMatch(/^[a-z0-9-]+$/);
  });

  it("rejects unsafe slugs", () => {
    expect(() => buildProcessName("../evil")).toThrow(AppError);
  });

  it("derives distinct, reversible blue/green variants", () => {
    const base = buildProcessName("acme-co");
    const blue = colorProcessName(base, "blue");
    const green = colorProcessName(base, "green");
    expect(blue).toBe("machine-acme-co-blue");
    expect(green).toBe("machine-acme-co-green");
    expect(otherColor("blue")).toBe("green");
    expect(otherColor("green")).toBe("blue");
  });

  it("keeps colored variants within the 48-char limit", () => {
    const base = buildProcessName("b".repeat(80));
    const blue = colorProcessName(base, "blue");
    expect(blue.length).toBeLessThanOrEqual(48);
    expect(blue.endsWith("-blue")).toBe(true);
  });
});

describe("PortAllocator", () => {
  it("allocates within range and reuses for the same company slug", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p6-ports-"));
    const allocator = new PortAllocator(join(root, "allocations.json"), 3100, 3110);
    const a = await allocator.allocate({ companySlug: "acme-blue", deploymentId: "dep_1" });
    expect(a).toBeGreaterThanOrEqual(3100);
    expect(a).toBeLessThanOrEqual(3110);
    const again = await allocator.allocate({ companySlug: "acme-blue", deploymentId: "dep_2" });
    expect(again).toBe(a);
    const other = await allocator.allocate({ companySlug: "acme-green", deploymentId: "dep_3" });
    expect(other).not.toBe(a);
  });

  it("releases a port so it can be reallocated", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p6-ports-"));
    const allocator = new PortAllocator(join(root, "allocations.json"), 3200, 3202);
    const a = await allocator.allocate({ companySlug: "x", deploymentId: "d1" });
    await allocator.release("x");
    expect(await allocator.currentPort("x")).toBeNull();
    const b = await allocator.allocate({ companySlug: "y", deploymentId: "d2" });
    expect([a, a + 1, a + 2]).toContain(b);
  });

  it("throws DEPLOYMENT_PORT_EXHAUSTED when the range is full", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p6-ports-"));
    const allocator = new PortAllocator(join(root, "allocations.json"), 3300, 3301);
    await allocator.allocate({ companySlug: "a1", deploymentId: "d1" });
    await allocator.allocate({ companySlug: "a2", deploymentId: "d2" });
    await expect(allocator.allocate({ companySlug: "a3", deploymentId: "d3" })).rejects.toMatchObject({
      code: "DEPLOYMENT_PORT_EXHAUSTED",
    });
  });
});

describe("deployment-lock", () => {
  it("acquires and releases; a second concurrent acquire is rejected", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p6-lock-"));
    const lockPath = join(root, "acme", ".factory", "deployment.lock");
    const handle = await acquireDeploymentLock(lockPath, "holder-1");
    await expect(acquireDeploymentLock(lockPath, "holder-2")).rejects.toMatchObject({
      code: "DEPLOYMENT_LOCK_HELD",
    });
    await handle.release();
    const second = await acquireDeploymentLock(lockPath, "holder-3");
    await second.release();
  });

  it("reclaims a stale lock (old timestamp)", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p6-lock-"));
    const lockPath = join(root, "acme", ".factory", "deployment.lock");
    await mkdir(join(root, "acme", ".factory"), { recursive: true });
    await writeJsonAtomic(lockPath, {
      holder: "stale-holder",
      pid: 999999,
      acquiredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    const handle = await acquireDeploymentLock(lockPath, "fresh-holder");
    await handle.release();
  });
});

describe("advisory-policy (evaluateDependencyGate)", () => {
  it("always blocks on critical advisories", () => {
    const result = evaluateDependencyGate({
      audit: { ...passingAudit(), critical: 1, total: 1 },
      publicExposureRequested: false,
      acceptNextHighLoopback: true,
      nextVersion: "14.2.35",
    });
    expect(result.passed).toBe(false);
  });

  it("blocks high advisories by default", () => {
    const result = evaluateDependencyGate({
      audit: {
        ...passingAudit(),
        high: 1,
        total: 1,
        packages: [{ name: "lodash", severity: "high", via: ["x"] }],
      },
      publicExposureRequested: false,
      acceptNextHighLoopback: true,
      nextVersion: "14.2.35",
    });
    expect(result.passed).toBe(false);
  });

  it("accepts a lone high 'next' advisory on loopback-only with pinned Next version", () => {
    const result = evaluateDependencyGate({
      audit: {
        ...passingAudit(),
        high: 1,
        total: 1,
        packages: [{ name: "next", severity: "high", via: ["GHSA-xxx"] }],
      },
      publicExposureRequested: false,
      acceptNextHighLoopback: true,
      nextVersion: "14.2.35",
    });
    expect(result.passed).toBe(true);
    expect(result.acceptedRiskIds).toContain(ACCEPTED_RISK_NEXT_HIGH_LOOPBACK);
  });

  it("does not accept the next-high exception once public exposure is requested", () => {
    const result = evaluateDependencyGate({
      audit: {
        ...passingAudit(),
        high: 1,
        total: 1,
        packages: [{ name: "next", severity: "high", via: ["GHSA-xxx"] }],
      },
      publicExposureRequested: true,
      acceptNextHighLoopback: true,
      nextVersion: "14.2.35",
    });
    expect(result.passed).toBe(false);
  });

  it("does not accept the exception for a non-14.2.3x Next version", () => {
    const result = evaluateDependencyGate({
      audit: {
        ...passingAudit(),
        high: 1,
        total: 1,
        packages: [{ name: "next", severity: "high", via: ["GHSA-xxx"] }],
      },
      publicExposureRequested: false,
      acceptNextHighLoopback: true,
      nextVersion: "16.0.0",
    });
    expect(result.passed).toBe(false);
  });
});

describe("domain-validator", () => {
  it("validates domain patterns containing {slug}", () => {
    expect(isValidDomainPattern("{slug}.apps.example.com")).toBe(true);
    expect(isValidDomainPattern("apps.example.com")).toBe(false);
    expect(isValidDomainPattern("")).toBe(false);
  });

  it("renders and validates a concrete domain from a pattern", () => {
    const domain = renderDomainForSlug("{slug}.apps.example.com", "acme-co");
    expect(domain).toBe("acme-co.apps.example.com");
    expect(assertSafeDomain(domain)).toBe(domain);
  });

  it("rejects unsafe rendered domains", () => {
    expect(() => renderDomainForSlug("bad pattern", "acme-co")).toThrow(AppError);
  });
});

describe("config: Phase 6 deployment fields", () => {
  it("parses comma-separated Telegram admin ids, ignoring non-numeric entries", () => {
    expect(parseTelegramAdminIds("111,222,abc, 333 ,")).toEqual([111, 222, 333]);
    expect(parseTelegramAdminIds("")).toEqual([]);
  });

  it("rejects a DEPLOYMENT_BIND_ADDRESS other than 127.0.0.1", () => {
    expect(() =>
      loadConfig(
        { DATA_ROOT: "/tmp/x", PROJECTS_ROOT: "/tmp/x/projects", DEPLOYMENT_BIND_ADDRESS: "0.0.0.0" },
        { requireTelegramToken: false },
      ),
    ).toThrow(AppError);
  });

  it("rejects an inverted deployment port range", () => {
    expect(() =>
      loadConfig(
        {
          DATA_ROOT: "/tmp/x",
          PROJECTS_ROOT: "/tmp/x/projects",
          DEPLOYMENT_PORT_MIN: "4000",
          DEPLOYMENT_PORT_MAX: "3000",
        },
        { requireTelegramToken: false },
      ),
    ).toThrow(AppError);
  });

  it("exposes deployment config booleans/flags without secret values", () => {
    const config = loadConfig(
      {
        DATA_ROOT: "/tmp/x",
        PROJECTS_ROOT: "/tmp/x/projects",
        TELEGRAM_ADMIN_IDS: "1,2,3",
        SSL_PROVIDER: "CERTBOT",
        CERTBOT_EMAIL: "ops@example.com",
      },
      { requireTelegramToken: false },
    );
    expect(config.telegramAdminIds).toEqual([1, 2, 3]);
    expect(config.deployment.bindAddress).toBe("127.0.0.1");
    const view = publicConfigView(config);
    const deploymentView = view.deployment as Record<string, unknown>;
    expect(deploymentView.certbotEmailConfigured).toBe(true);
    expect(JSON.stringify(view)).not.toContain("ops@example.com");
    expect(view.telegramAdminCount).toBe(3);
  });
});

describe("operations-policy", () => {
  const config = loadConfig(
    { DATA_ROOT: "/tmp/x", PROJECTS_ROOT: "/tmp/x/projects", TELEGRAM_ADMIN_IDS: "42" },
    { requireTelegramToken: false },
  );

  it("only recognizes configured telegram ids as admins", () => {
    expect(isAdminTelegramUser(42, config)).toBe(true);
    expect(isAdminTelegramUser(43, config)).toBe(false);
    expect(isAdminTelegramUser(undefined, config)).toBe(false);
  });

  it("always trusts the CLI channel for active actions", () => {
    expect(() => assertOpsAuthorized("status", { channel: "cli" }, config)).not.toThrow();
  });

  it("rejects deferred actions from any channel, including CLI", () => {
    expect(() => assertOpsAuthorized("ssl", { channel: "cli" }, config)).toThrow(AppError);
    expect(() =>
      assertOpsAuthorized("deploy", { channel: "telegram", telegramUserId: 42 }, config),
    ).toThrow(AppError);
  });

  it("rejects non-admin telegram users and allows admins", () => {
    const nonAdmin: OpsActor = { channel: "telegram", telegramUserId: 999 };
    const admin: OpsActor = { channel: "telegram", telegramUserId: 42 };
    expect(() => assertOpsAuthorized("restart", nonAdmin, config)).toThrow(AppError);
    expect(() => assertOpsAuthorized("restart", admin, config)).not.toThrow();
  });
});

describe("evaluatePreDeploymentGate (injected fakes, no real npm/browser)", () => {
  const baseInput = {
    companyId: "co_1",
    companySlug: "acme",
    generationId: "gen_1",
    qualityRunId: "qr_1",
    releaseAppDir: "/tmp/does-not-matter",
    qualityAccepted: true,
    sourceHashesMatch: true,
    buildPassed: true,
    securityPassed: true,
    releaseImmutable: true,
    publicExposureRequested: false,
    acceptNextHighLoopback: true,
    runner: new SafeCommandRunner(),
    browserQaRoutes: ["/"],
    requireRtl: false,
    artifactsDir: "/tmp/artifacts",
  };

  it("passes when every check is green", async () => {
    const gate = await evaluatePreDeploymentGate({
      ...baseInput,
      runDependencyAudit: async () => passingAudit(),
      runBrowserQaFn: async () => passingBrowserQa(),
    });
    expect(gate.passed).toBe(true);
    expect(gate.blockingReasons).toEqual([]);
  });

  it("fails when the build did not pass, even with a clean dependency audit", async () => {
    const gate = await evaluatePreDeploymentGate({
      ...baseInput,
      buildPassed: false,
      runDependencyAudit: async () => passingAudit(),
      runBrowserQaFn: async () => passingBrowserQa(),
    });
    expect(gate.passed).toBe(false);
    expect(gate.blockingReasons.some((r) => /build/i.test(r))).toBe(true);
  });

  it("fails when source hashes do not match (stale release)", async () => {
    const gate = await evaluatePreDeploymentGate({
      ...baseInput,
      sourceHashesMatch: false,
      runDependencyAudit: async () => passingAudit(),
      runBrowserQaFn: async () => passingBrowserQa(),
    });
    expect(gate.passed).toBe(false);
    expect(gate.blockingReasons.some((r) => /hash/i.test(r))).toBe(true);
  });

  it("fails when the dependency audit reports a critical advisory", async () => {
    const gate = await evaluatePreDeploymentGate({
      ...baseInput,
      runDependencyAudit: async () => ({ ...passingAudit(), critical: 2, total: 2 }),
      runBrowserQaFn: async () => passingBrowserQa(),
    });
    expect(gate.passed).toBe(false);
    expect(gate.dependencyGate.passed).toBe(false);
  });

  it("requires browser QA to pass for loopback and public deployments", async () => {
    const unavailable = {
      available: false,
      passed: false,
      criticalIssuesClear: false,
      accessibilityCriticalClear: false,
      screenshots: [] as string[],
      routesChecked: [] as string[],
      consoleErrors: [] as string[],
      viewports: [] as string[],
      reason: "playwright not installed",
    };
    const loopbackOnly = await evaluatePreDeploymentGate({
      ...baseInput,
      publicExposureRequested: false,
      runDependencyAudit: async () => passingAudit(),
      runBrowserQaFn: async () => unavailable,
    });
    expect(loopbackOnly.passed).toBe(false);
    expect(loopbackOnly.blockingReasons.some((r) => /browser|playwright/i.test(r))).toBe(true);

    const publicRequested = await evaluatePreDeploymentGate({
      ...baseInput,
      publicExposureRequested: true,
      runDependencyAudit: async () => passingAudit(),
      runBrowserQaFn: async () => unavailable,
    });
    expect(publicRequested.passed).toBe(false);
    expect(publicRequested.blockingReasons.some((r) => /browser|playwright/i.test(r))).toBe(true);
  });
});

describe("/ops command parsing (Phase 6)", () => {
  it("recognizes the full active + deferred action set", () => {
    for (const action of ["status", "health", "logs", "restart", "rollback", "stop", "start"]) {
      const parsed = parseCommand(`/ops Acme: ${action}`);
      expect(parsed).toMatchObject({ kind: "ops", companyName: "Acme", action });
    }
  });

  it("parses an optional confirm=<token> suffix for telegram confirmation replies", () => {
    const parsed = parseCommand("/ops Acme: restart confirm=abc123");
    expect(parsed).toEqual({ kind: "ops", companyName: "Acme", action: "restart", confirmToken: "abc123" });
  });

  it("still rejects truly unknown actions", () => {
    expect(() => parseCommand("/ops Acme: reboot")).toThrow(AppError);
  });
});

describe("Deployment + Operations end-to-end (fake PM2 provider, real HTTP health checks)", () => {
  it(
    "predeploy -> deploy -> status/health/logs -> restart/stop/start -> rollback, with ops confirmation + authorization",
    async () => {
      const root = await mkdtemp(join(tmpdir(), "machine-p6-e2e-"));
      const { config, services, resolved, blueprint } = await seedFixtureCompany(root);
      const slug = resolved.company.slug;
      const companyName = resolved.company.displayName;

      const genA = await generateFixtureRelease(config, services, blueprint, resolved);
      const workspace = new GenerationWorkspace(config.projectsRoot);
      const qualityArtifacts = new QualityArtifactRepository(
        config.projectsRoot,
        join(config.dataRoot, "memory", "quality"),
      );
      await markQualityAccepted(qualityArtifacts, slug, genA.generationId, workspace.releaseAppDir(slug, genA.generationId));

      const blueprints = new FsCompanyOSBlueprintRepository(
        config.projectsRoot,
        join(config.dataRoot, "memory", "blueprints"),
      );
      const provider = new FakeDeploymentProvider();
      const deployment = new DeploymentService({
        cwd: process.cwd(),
        projectsRoot: config.projectsRoot,
        memoryQualityDir: join(config.dataRoot, "memory", "quality"),
        memoryDeploymentsDir: join(config.dataRoot, "memory", "deployments"),
        portAllocationsPath: join(config.dataRoot, "memory", "ports", "allocations.json"),
        registry: services.registry,
        blueprints,
        runner: new SucceedingRunner(),
        logger: createLogger({ level: "silent" }),
        config,
        provider,
        runDependencyAudit: async () => passingAudit(),
        runBrowserQaFn: async () => passingBrowserQa(),
      });

      // --- predeploy gate ---
      const gate = await deployment.predeploy(companyName);
      expect(gate.passed).toBe(true);
      expect(gate.generationId).toBe(genA.generationId);

      // --- deploy (first release: blue) ---
      const deployResult = await deployment.deploy(companyName);
      expect(deployResult.deployment.record.status).toBe("HEALTHY");
      expect(deployResult.deployment.record.color).toBe("blue");
      expect(deployResult.deployment.record.bindAddress).toBe("127.0.0.1");
      const firstPort = deployResult.deployment.record.port;

      // --- operations service wiring ---
      const operations = new OperationsService({
        deployment,
        registry: services.registry,
        config,
        projectsRoot: config.projectsRoot,
        confirmationsPath: join(config.dataRoot, "memory", "ops-confirmations.json"),
        logger: createLogger({ level: "silent" }),
      });
      const cliActor: OpsActor = { channel: "cli" };

      // --- non-mutating actions from the trusted CLI channel ---
      const status = await operations.requestAction({ companyName, action: "status", actor: cliActor });
      expect(status.ok).toBe(true);
      expect(status.message).toContain(companyName);

      const health = await operations.requestAction({ companyName, action: "health", actor: cliActor });
      expect(health.ok).toBe(true);
      expect(health.message).toMatch(/HEALTHY/);

      const logs = await operations.requestAction({ companyName, action: "logs", actor: cliActor });
      expect(logs.ok).toBe(true);

      // --- mutating action from CLI requires --yes (skipConfirmation) ---
      await expect(
        operations.requestAction({ companyName, action: "restart", actor: cliActor }),
      ).rejects.toMatchObject({ code: "OPS_CONFIRMATION_REQUIRED" });

      const restarted = await operations.requestAction({
        companyName,
        action: "restart",
        actor: cliActor,
        skipConfirmation: true,
      });
      expect(restarted.ok).toBe(true);

      // --- telegram authorization: non-admin rejected, admin requires confirm token ---
      const nonAdmin: OpsActor = { channel: "telegram", telegramUserId: 999 };
      await expect(
        operations.requestAction({ companyName, action: "restart", actor: nonAdmin }),
      ).rejects.toMatchObject({ code: "OPS_UNAUTHORIZED" });

      const admin: OpsActor = { channel: "telegram", telegramUserId: 111 };
      const pending = await operations.requestAction({ companyName, action: "restart", actor: admin });
      expect(pending.ok).toBe(false);
      expect(pending.requiresConfirmation).toBe(true);
      expect(pending.confirmToken).toBeTruthy();

      // wrong token is rejected
      await expect(
        operations.requestAction({
          companyName,
          action: "restart",
          actor: admin,
          confirmToken: "not-the-real-token",
        }),
      ).rejects.toMatchObject({ code: "OPS_CONFIRMATION_INVALID" });

      // correct token succeeds, and is single-use
      const confirmed = await operations.requestAction({
        companyName,
        action: "restart",
        actor: admin,
        confirmToken: pending.confirmToken,
      });
      expect(confirmed.ok).toBe(true);
      await expect(
        operations.requestAction({
          companyName,
          action: "restart",
          actor: admin,
          confirmToken: pending.confirmToken,
        }),
      ).rejects.toMatchObject({ code: "OPS_CONFIRMATION_INVALID" });

      // deferred actions are never allowed from chat or CLI
      await expect(
        operations.requestAction({ companyName, action: "ssl", actor: cliActor }),
      ).rejects.toMatchObject({ code: "OPS_ACTION_NOT_ALLOWED" });

      // --- stop / start round-trip ---
      const stopped = await operations.requestAction({
        companyName,
        action: "stop",
        actor: cliActor,
        skipConfirmation: true,
      });
      expect(stopped.ok).toBe(true);
      const afterStop = await deployment.status(companyName);
      expect(afterStop.record.status).toBe("STOPPED");

      const started = await operations.requestAction({
        companyName,
        action: "start",
        actor: cliActor,
        skipConfirmation: true,
      });
      expect(started.ok).toBe(true);
      const afterStart = await deployment.status(companyName);
      expect(afterStart.record.status).toBe("HEALTHY");
      expect(afterStart.record.port).toBe(firstPort);

      // --- second generation + second deploy (green), then rollback to the first ---
      const genBId = `${genA.generationId}_v2`;
      const releaseBDir = workspace.releaseAppDir(slug, genBId);
      await mkdir(join(releaseBDir, ".."), { recursive: true });
      await cp(workspace.releaseAppDir(slug, genA.generationId), releaseBDir, { recursive: true });
      await writeJsonAtomic(workspace.resolvePaths(slug).currentGenerationJson, {
        generationId: genBId,
        companySlug: slug,
        blueprintHash: blueprint.contentHash ?? "x",
        releasedAt: nowIso(),
        releaseRelativePath: `generated/releases/${genBId}/app`,
      });
      await markQualityAccepted(qualityArtifacts, slug, genBId, releaseBDir);

      const secondDeploy = await deployment.deploy(companyName);
      expect(secondDeploy.deployment.record.status).toBe("HEALTHY");
      expect(secondDeploy.deployment.record.generationId).toBe(genBId);
      expect(secondDeploy.deployment.record.color).toBe("green");

      const rollback = await operations.requestAction({
        companyName,
        action: "rollback",
        actor: cliActor,
        skipConfirmation: true,
      });
      expect(rollback.ok).toBe(true);
      const afterRollback = await deployment.status(companyName);
      expect(afterRollback.record.generationId).toBe(genA.generationId);
      expect(afterRollback.record.status).toBe("HEALTHY");

      // release-manifest / summary artifacts were written under the company workspace
      const manifestPath = join(
        config.projectsRoot,
        slug,
        "artifacts",
        "deployment",
        "deployments",
        `${afterRollback.record.deploymentId}.manifest.json`,
      );
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      expect(manifest.companySlug).toBe(slug);
      expect(manifest.status).toBe("HEALTHY");
    },
    60_000,
  );
});
