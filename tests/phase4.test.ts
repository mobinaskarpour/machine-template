import { describe, it, expect } from "vitest";
import { access, mkdtemp, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { loadConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { executeCommand } from "../src/commands/execute.js";
import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import { parseCompanyKnowledge } from "../src/knowledge/company-knowledge-schema.js";
import { IndustryEngine } from "../src/industries/industry-engine.js";
import { buildMasterBuildSpecification } from "../src/specifications/master-build-specification-service.js";
import { buildMasterPrompt } from "../src/prompts/master-prompt-builder.js";
import { buildCompanyOSBlueprint } from "../src/blueprints/company-os-blueprint-service.js";
import { FsCompanyOSBlueprintRepository } from "../src/blueprints/company-os-blueprint-repository.js";
import { FsMasterBuildSpecificationRepository } from "../src/specifications/master-build-specification-repository.js";
import { FsMasterPromptRepository } from "../src/prompts/master-prompt-repository.js";
import { AppError, isAppError } from "../src/shared/errors.js";
import type { FetchedPage, WebsiteFetcher } from "../src/discovery/discovery-types.js";
import { nowIso } from "../src/shared/ids.js";
import { createStubGenerationService } from "../src/generation/test-stub-generation.js";
import { createStubQualityService } from "../src/quality/test-stub-quality.js";
import { buildGenerationPlan } from "../src/generation/generation-plan-builder.js";
import { parseGenerationPlan } from "../src/generation/generation-plan-schema.js";
import { hashTemplate, copyTemplateToStaging } from "../src/generation/template-manager.js";
import { GenerationWorkspace } from "../src/generation/generation-workspace.js";
import {
  generateMockDataBundle,
  validateInternalReferences,
} from "../src/generation/renderers/mock-data-renderer.js";
import { validateMockDataIntegrity } from "../src/generation/validation/mock-data-integrity-validator.js";
import { DeterministicTemplateProvider } from "../src/generation/providers/deterministic-template-provider.js";
import { validateGeneratedSource } from "../src/generation/validation/generated-source-validator.js";
import { validateDependencyPolicy } from "../src/generation/validation/dependency-policy-validator.js";
import { validateRoutes } from "../src/generation/validation/route-validator.js";
import { validateBlueprintCoverage } from "../src/generation/validation/blueprint-coverage-validator.js";
import { scanGeneratedAppSecurity } from "../src/generation/generated-app-security-scan.js";
import { ApplicationGenerationService } from "../src/generation/application-generation-service.js";
import { writeJsonAtomic } from "../src/persistence/atomic.js";
import { SafeCommandRunner, type RunExecutableInput, type RunResult } from "../src/runners/safe-command-runner.js";
import type { BlueprintRuntimeDocument } from "../src/generation/renderers/runtime-renderer.js";
import { TEMPLATE_ID, TEMPLATE_RELATIVE_PATH } from "../src/generation/source-file-policy.js";

const fixtureRoot = join(process.cwd(), "tests/fixtures/zar-macaron");
const zarKnowledge = parseCompanyKnowledge(
  JSON.parse(readFileSync(join(fixtureRoot, "company-knowledge.json"), "utf8")),
);
const zarHome = readFileSync(join(fixtureRoot, "homepage.html"), "utf8");

const PROHIBITED_PERSON_NAMES = [
  "Zar Macaron",
  "ZarMacaron",
  "زر ماکارون",
  "زرماکارون",
];

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

function buildZarBlueprint() {
  const engine = new IndustryEngine();
  const resolution = engine.resolveFromKnowledge(zarKnowledge);
  const pack = engine.getPack(resolution.selectedPackId);
  const specification = buildMasterBuildSpecification({
    knowledge: zarKnowledge,
    pack,
    resolution,
  });
  const prompt = buildMasterPrompt({
    knowledge: zarKnowledge,
    specification,
    pack,
  });
  const blueprint = buildCompanyOSBlueprint({
    knowledge: zarKnowledge,
    resolution,
    pack,
    specification,
    prompt,
  });
  return { blueprint, specification, prompt, resolution, pack };
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

class FailingTypecheckRunner extends SafeCommandRunner {
  override async runExecutable(input: RunExecutableInput): Promise<RunResult> {
    const isTypecheck =
      input.args.includes("typecheck") ||
      (input.args[0] === "run" && input.args[1] === "typecheck");
    if (isTypecheck) {
      throw new AppError("COMMAND_EXIT_NON_ZERO", "typecheck failed (test mock)", {
        details: { exitCode: 1 },
      });
    }
    return okRunResult({ executable: input.executable, args: input.args });
  }
}

async function seedBlueprintWorkspace(root: string) {
  const config = loadConfig(
    {
      DATA_ROOT: root,
      PROJECTS_ROOT: join(root, "projects"),
      LOG_LEVEL: "silent",
      NODE_ENV: "test",
    },
    { cwd: root, requireTelegramToken: false },
  );
  const services = await createAppServices(config, createLogger({ level: "silent" }), {
    synthesis: new DeterministicKnowledgeSynthesisProvider(),
    fetcher: fixtureFetcher({ "*": zarHome }),
  });
  const resolved = await services.registry.resolveByName("زر ماکارون");
  await services.knowledge.save({
    ...zarKnowledge,
    companyId: resolved.company.id,
    companySlug: resolved.company.slug,
  });
  await services.planning.planFromExistingKnowledge("زر ماکارون");
  const result = await services.blueprint.blueprintFromExisting("زر ماکارون");
  return { config, services, resolved, blueprint: result.blueprint };
}

describe("Generation plan", () => {
  it("buildGenerationPlan from zar fixture produces a valid plan", () => {
    const { blueprint, specification, prompt } = buildZarBlueprint();
    const plan = buildGenerationPlan({
      blueprint,
      companyKnowledgeHash: zarKnowledge.contentHash ?? "kh",
      specificationHash: specification.contentHash ?? "sh",
      masterPromptHash: prompt.contentHash ?? "ph",
      templateHash: "tmpl_hash_test",
      providerId: "DETERMINISTIC_TEMPLATE",
      cwd: process.cwd(),
    });
    expect(plan.generationId).toMatch(/^gen_/);
    expect(plan.companySlug).toBe(blueprint.company.slug);
    expect(plan.tasks.length).toBeGreaterThan(5);
    expect(plan.expectedCoverage.dashboardIds.length).toBe(blueprint.dashboards.length);
    expect(plan.template.id).toBe(TEMPLATE_ID);
  });

  it("rejects duplicate task IDs via parseGenerationPlan", () => {
    const { blueprint, specification, prompt } = buildZarBlueprint();
    const plan = buildGenerationPlan({
      blueprint,
      companyKnowledgeHash: zarKnowledge.contentHash ?? "kh",
      specificationHash: specification.contentHash ?? "sh",
      masterPromptHash: prompt.contentHash ?? "ph",
      templateHash: "tmpl_hash_test",
      providerId: "DETERMINISTIC_TEMPLATE",
      cwd: process.cwd(),
    });
    const mutated = structuredClone(plan);
    mutated.tasks.push({ ...mutated.tasks[0]!, id: mutated.tasks[0]!.id });
    expect(() => parseGenerationPlan(mutated)).toThrow(AppError);
    try {
      parseGenerationPlan(mutated);
    } catch (error) {
      expect(isAppError(error) && error.code).toBe("GENERATION_PLAN_INVALID");
    }
  });

  it("includes source hash fields and dependency allowlist", () => {
    const { blueprint, specification, prompt } = buildZarBlueprint();
    const plan = buildGenerationPlan({
      blueprint,
      companyKnowledgeHash: zarKnowledge.contentHash ?? "kh",
      specificationHash: specification.contentHash ?? "sh",
      masterPromptHash: prompt.contentHash ?? "ph",
      templateHash: "tmpl_hash_test",
      providerId: "DETERMINISTIC_TEMPLATE",
      cwd: process.cwd(),
    });
    expect(plan.sourceHashes.companyKnowledgeHash).toBeTruthy();
    expect(plan.sourceHashes.masterBuildSpecificationHash).toBeTruthy();
    expect(plan.sourceHashes.masterPromptHash).toBeTruthy();
    expect(plan.sourceHashes.companyOSBlueprintHash).toBe(blueprint.contentHash);
    expect(plan.policies.allowedDependencies.length).toBeGreaterThan(0);
    expect(plan.policies.allowedDependencies).toContain("next");
    expect(plan.policies.forbiddenDependencies).toContain("pm2");
  });
});

describe("Template / workspace", () => {
  it("hashTemplate succeeds for generated-company-os-v1", async () => {
    const hash = await hashTemplate(process.cwd());
    expect(hash).toMatch(/^[a-f0-9]{16,}$/i);
  });

  it("copyTemplateToStaging works and excludes node_modules", async () => {
    const staging = await mkdtemp(join(tmpdir(), "machine-p4-staging-"));
    const stagingAppDir = join(staging, "app");
    await copyTemplateToStaging({ cwd: process.cwd(), stagingAppDir });
    await access(join(stagingAppDir, "package.json"), constants.F_OK);
    await access(join(stagingAppDir, "src", "app", "page.tsx"), constants.F_OK);
    const top = await readdir(stagingAppDir);
    expect(top).not.toContain("node_modules");
    expect(top).toContain("package.json");
    expect(TEMPLATE_RELATIVE_PATH).toContain("generated-company-os-v1");
  });

  it("GenerationWorkspace rejects path segments with ..", () => {
    const workspace = new GenerationWorkspace("/tmp/projects-root");
    expect(() => workspace.stagingAppDir("acme", "../evil")).toThrow(AppError);
    expect(() => workspace.releaseAppDir("acme", "gen/../x")).toThrow(AppError);
  });
});

describe("Mock data", () => {
  it("generateMockDataBundle is deterministic for the same seed", () => {
    const { blueprint } = buildZarBlueprint();
    const a = generateMockDataBundle(blueprint, "seed-alpha-001");
    const b = generateMockDataBundle(blueprint, "seed-alpha-001");
    expect(JSON.stringify(a.records)).toBe(JSON.stringify(b.records));
    expect(a.seed).toBe(b.seed);
  });

  it("different seeds produce different mock JSON", () => {
    const { blueprint } = buildZarBlueprint();
    const a = generateMockDataBundle(blueprint, "seed-alpha-001");
    const b = generateMockDataBundle(blueprint, "seed-beta-999");
    expect(JSON.stringify(a.records)).not.toBe(JSON.stringify(b.records));
  });

  it("validateMockDataIntegrity and validateInternalReferences pass", () => {
    const { blueprint } = buildZarBlueprint();
    const bundle = generateMockDataBundle(blueprint, "seed-integrity");
    expect(() => validateInternalReferences(bundle)).not.toThrow();
    const result = validateMockDataIntegrity({ blueprint, bundle });
    expect(result.ok).toBe(true);
    expect(result.recordTotal).toBeGreaterThan(0);
  });

  it("avoids prohibited real personal/brand names in customer records", () => {
    const { blueprint } = buildZarBlueprint();
    const bundle = generateMockDataBundle(blueprint, "seed-names");
    const blob = JSON.stringify(bundle.records);
    for (const name of PROHIBITED_PERSON_NAMES) {
      expect(blob).not.toContain(name);
    }
    // Synthetic fixture company display name may appear in blueprint metadata elsewhere,
    // but mock person/customer names must stay synthetic.
    const customerKeys = Object.keys(bundle.records).filter((k) => /customer/i.test(k));
    for (const key of customerKeys) {
      for (const row of bundle.records[key] ?? []) {
        const name = String(row.name ?? "");
        expect(name).not.toMatch(/Zar|زر/);
      }
    }
  });
});

describe("Deterministic provider (no npm build)", () => {
  it("copies template, generates, and passes validators + security scan", async () => {
    const { blueprint, specification, prompt } = buildZarBlueprint();
    const stagingRoot = await mkdtemp(join(tmpdir(), "machine-p4-det-"));
    const stagingAppDir = join(stagingRoot, "app");
    await copyTemplateToStaging({ cwd: process.cwd(), stagingAppDir });

    const plan = buildGenerationPlan({
      blueprint,
      companyKnowledgeHash: zarKnowledge.contentHash ?? "kh",
      specificationHash: specification.contentHash ?? "sh",
      masterPromptHash: prompt.contentHash ?? "ph",
      templateHash: await hashTemplate(process.cwd()),
      providerId: "DETERMINISTIC_TEMPLATE",
      cwd: process.cwd(),
    });

    const provider = new DeterministicTemplateProvider();
    const codegen = await provider.generate({
      generationPlan: plan,
      blueprint,
      stagingDirectory: stagingAppDir,
    });
    expect(codegen.filesWritten).toContain("src/data/blueprint-runtime.json");
    expect(codegen.filesWritten).toContain("src/data/mock-data.json");

    await validateGeneratedSource({ stagingAppDir, plan });
    await validateDependencyPolicy({ stagingAppDir, plan });

    const runtime = JSON.parse(
      await readFile(join(stagingAppDir, "src/data/blueprint-runtime.json"), "utf8"),
    ) as BlueprintRuntimeDocument;
    validateRoutes(runtime);
    validateBlueprintCoverage({ runtime, plan });

    const scan = await scanGeneratedAppSecurity(stagingAppDir);
    expect(scan.ok).toBe(true);
  });
});

describe("Build failure blocks promotion", () => {
  it("fails typecheck without promoting current-generation.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p4-fail-"));
    const { config, services, resolved, blueprint } = await seedBlueprintWorkspace(root);
    const knowledge = await services.knowledge.get(resolved.company.slug);
    expect(knowledge).toBeTruthy();

    const specifications = new FsMasterBuildSpecificationRepository(
      config.projectsRoot,
      join(config.dataRoot, "memory", "specifications"),
    );
    const prompts = new FsMasterPromptRepository(config.projectsRoot);
    const blueprints = new FsCompanyOSBlueprintRepository(
      config.projectsRoot,
      join(config.dataRoot, "memory", "blueprints"),
    );
    const specification = await specifications.get(resolved.company.slug);
    const prompt = await prompts.get(resolved.company.slug);
    expect(specification).toBeTruthy();
    expect(prompt).toBeTruthy();

    const failingGeneration = new ApplicationGenerationService({
      cwd: process.cwd(),
      projectsRoot: config.projectsRoot,
      registry: services.registry,
      knowledge: services.knowledge,
      specifications,
      prompts,
      blueprints,
      jobs: services.jobManager,
      runner: new FailingTypecheckRunner(),
      logger: createLogger({ level: "silent" }),
    });

    await expect(
      failingGeneration.generateWithArtifacts({
        knowledgeHash: knowledge!.contentHash ?? "",
        specificationHash: specification!.contentHash ?? "",
        masterPromptHash: prompt!.contentHash ?? "",
        blueprint,
        companyId: resolved.company.id,
        projectId: resolved.project.id,
        force: true,
      }),
    ).rejects.toMatchObject({ code: "GENERATION_TYPECHECK_FAILED" });

    const pointerPath = join(
      config.projectsRoot,
      resolved.company.slug,
      ".factory",
      "current-generation.json",
    );
    await expect(access(pointerPath, constants.F_OK)).rejects.toThrow();
  });
});

describe("Idempotency", () => {
  it("reuses current generation when pointer+manifest match blueprint hash", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p4-reuse-"));
    const { config, services, resolved, blueprint } = await seedBlueprintWorkspace(root);
    const workspace = new GenerationWorkspace(config.projectsRoot);
    const paths = await workspace.ensureDirs(resolved.company.slug);
    const generationId = "gen_reuse_test_01";
    const blueprintHash = blueprint.contentHash ?? "";

    await writeJsonAtomic(paths.currentGenerationJson, {
      generationId,
      companySlug: resolved.company.slug,
      blueprintHash,
      releasedAt: nowIso(),
      releaseRelativePath: `generated/releases/${generationId}/app`,
    });
    await writeJsonAtomic(paths.generationManifestJson, {
      schemaVersion: "1.0",
      generationId,
      companyId: resolved.company.id,
      companySlug: resolved.company.slug,
      status: "PROMOTED",
      sourceHashes: {
        blueprintHash,
        specificationHash: "x",
        masterPromptHash: "x",
        templateHash: "x",
      },
      provider: { id: "DETERMINISTIC_TEMPLATE", version: "1.0.0" },
      releasePath: `generated/releases/${generationId}/app`,
      files: [],
      coverage: {
        dashboards: { expected: [], generated: [], missing: [] },
        modules: { expected: [], generated: [], missing: [] },
        workflows: { expected: [], generated: [], missing: [] },
        agents: { expected: [], generated: [], missing: [] },
        entities: { expected: [], generated: [], missing: [] },
      },
      validation: {
        sourcePolicy: true,
        dependencyPolicy: true,
        routeValidation: true,
        mockDataIntegrity: true,
        typecheck: true,
        tests: true,
        build: true,
        securityScan: true,
      },
      build: { command: [] },
      repairAttempts: [],
      mockRecordTotal: 12,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    const result = await services.generation.generateFromExisting("زر ماکارون", {
      force: false,
    });
    expect(result.ok).toBe(true);
    expect(result.reused).toBe(true);
    expect(result.generationId).toBe(generationId);
    expect(result.message).toMatch(/reused|مجدداً استفاده/i);
  });
});

describe("Phase 4 pipeline guards", () => {
  it("throws BLUEPRINT_NOT_READY when quality.readyForCodeGeneration is false", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p4-notready-"));
    const { config, services, resolved, blueprint } = await seedBlueprintWorkspace(root);
    const notReady = {
      ...blueprint,
      quality: {
        ...blueprint.quality,
        readyForCodeGeneration: false,
        blockingReasons: ["test blocker"],
      },
    };
    const knowledge = await services.knowledge.get(resolved.company.slug);
    await expect(
      services.generation.generateWithArtifacts({
        knowledgeHash: knowledge!.contentHash ?? "",
        specificationHash: notReady.sourceArtifacts.masterBuildSpecificationHash ?? "x",
        masterPromptHash: notReady.sourceArtifacts.masterPromptHash ?? "x",
        blueprint: notReady,
        companyId: resolved.company.id,
        projectId: resolved.project.id,
        force: true,
      }),
    ).rejects.toMatchObject({ code: "BLUEPRINT_NOT_READY" });
  });

  it("keeps production src free of Zar Macaron brand strings", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      "rg -n 'زر ماکارون|زرماکارون|Zar Macaron|ZarMacaron|zarmacaron\\.com' src || true",
      { encoding: "utf8" },
    );
    expect(out.trim()).toBe("");
  });
});

describe("Stub /demo through generation", () => {
  it("createStubGenerationService + executeCommand demo expects generation success and no deploy", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p4-demo-"));
    const config = loadConfig(
      {
        DATA_ROOT: root,
        PROJECTS_ROOT: join(root, "projects"),
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
      },
      { cwd: root, requireTelegramToken: false },
    );
    const services = await createAppServices(config, createLogger({ level: "silent" }), {
      synthesis: new DeterministicKnowledgeSynthesisProvider(),
      fetcher: fixtureFetcher({
        "https://www.zarmacaron.com/": zarHome,
        "*": zarHome,
      }),
      generation: createStubGenerationService(),
      quality: createStubQualityService(),
    });
    const result = await executeCommand(
      {
        kind: "demo",
        companyName: "زر ماکارون",
        websiteHint: "https://www.zarmacaron.com/",
      },
      services.commandContext,
    );
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Blueprint سیستم‌عامل شرکتی تکمیل شد/);
    expect(result.message).toMatch(/Application generated and build verified/);
    expect(result.message).toMatch(/has not been deployed|Deploy نشده/);
    expect(result.message).not.toMatch(/Deployment Complete|public URL: https?:\/\//i);
  });
});
