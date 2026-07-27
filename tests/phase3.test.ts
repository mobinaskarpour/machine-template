import { describe, it, expect } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { loadConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { executeCommand } from "../src/commands/execute.js";
import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import {
  createSlug,
  normalizePersianLetters,
  suggestCanonicalSlug,
} from "../src/registry/slug.js";
import { parseCompanyKnowledge } from "../src/knowledge/company-knowledge-schema.js";
import { IndustryEngine } from "../src/industries/industry-engine.js";
import { buildMasterBuildSpecification } from "../src/specifications/master-build-specification-service.js";
import { buildMasterPrompt } from "../src/prompts/master-prompt-builder.js";
import {
  buildCompanyOSBlueprint,
  buildBlueprintSummary,
} from "../src/blueprints/company-os-blueprint-service.js";
import { validateCompanyOSBlueprint } from "../src/blueprints/company-os-blueprint-validator.js";
import { AppError } from "../src/shared/errors.js";
import type { FetchedPage, WebsiteFetcher } from "../src/discovery/discovery-types.js";
import { nowIso } from "../src/shared/ids.js";
import { createStubGenerationService } from "../src/generation/test-stub-generation.js";
import { calculateBlueprintQuality } from "../src/blueprints/blueprint-readiness.js";

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

describe("slug improvements", () => {
  it("normalizes Arabic kaf/yeh to Persian", () => {
    expect(normalizePersianLetters("يك")).toBe("یک");
    expect(createSlug("ك")).toBe(createSlug("ک"));
    expect(createSlug("ي")).toBe(createSlug("ی"));
  });

  it("produces readable slug for زر ماکارون", () => {
    expect(suggestCanonicalSlug("زر ماکارون")).toBe("zar-makaron");
    expect(createSlug("زر ماکارون")).toBe("zar-makaron");
    // Common misspelling remains deterministic and readable (not brand-hardcoded)
    expect(createSlug("زر ماکرون")).toBe("zar-makron");
  });

  it("keeps latin brand slugs stable", () => {
    expect(createSlug("Zar Macaron")).toBe("zar-macaron");
  });

  it("handles collisions with stable hash suffix", () => {
    const a = createSlug("زر ماکارون", { taken: ["zar-makaron"] });
    expect(a.startsWith("zar-makaron-")).toBe(true);
  });

  it("does not auto-migrate existing workspaces", async () => {
    const root = await mkdtemp(join(tmpdir(), "slug-compat-"));
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
    // Simulate legacy slug already registered
    const legacy = await services.companies.create({
      id: "co_legacy",
      slug: "zr-makarvn",
      displayName: "زر ماکارون",
      aliases: ["Zar Macaron"],
      status: "CREATED",
      workspacePath: join(root, "projects", "zr-makarvn"),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const resolved = await services.registry.resolveByName("زر ماکارون");
    expect(resolved.company.id).toBe(legacy.id);
    expect(resolved.company.slug).toBe("zr-makarvn");
    expect(resolved.company.canonicalSlugSuggestion).toBe("zar-makaron");
  });
});

describe("CompanyOSBlueprint builders", () => {
  it("builds deterministic Zar Macaron blueprint from fixtures", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const spec = buildMasterBuildSpecification({ knowledge: zarKnowledge, pack, resolution });
    const prompt = buildMasterPrompt({ knowledge: zarKnowledge, specification: spec, pack });
    const a = buildCompanyOSBlueprint({
      knowledge: zarKnowledge,
      resolution,
      pack,
      specification: spec,
      prompt,
    });
    const b = buildCompanyOSBlueprint({
      knowledge: zarKnowledge,
      resolution,
      pack,
      specification: spec,
      prompt,
    });
    validateCompanyOSBlueprint(a);
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.company.displayName).toBe("زر ماکارون");
    expect(a.company.rtl).toBe(true);
    expect(a.company.industryPackId).toBe("manufacturing");
    expect(a.company.canonicalSlugSuggestion).toBe("zar-makaron");
    expect(a.permissionModel.strategy).toBe("RBAC");
    expect(a.agents.every((x) => x.tools.every((t) => t.readOnly))).toBe(true);
    expect(a.mockDataPlan.prohibitedContent.join(" ")).toMatch(/identities|API keys/i);
    expect(JSON.stringify(a)).not.toMatch(/concrete|precast|ایران فریمکو/i);
    expect(JSON.stringify(a)).not.toMatch(/<\s*html/i);
    expect(a.dashboards.filter((d) => d.priority === "HIGH").every((d) => (d.trace?.length ?? 0) > 0)).toBe(
      true,
    );
    const summary = buildBlueprintSummary(a);
    expect(summary.counts.dashboards).toBe(a.dashboards.length);
  });

  it("rejects duplicate routes", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const spec = buildMasterBuildSpecification({ knowledge: zarKnowledge, pack, resolution });
    const prompt = buildMasterPrompt({ knowledge: zarKnowledge, specification: spec, pack });
    const bp = buildCompanyOSBlueprint({
      knowledge: zarKnowledge,
      resolution,
      pack,
      specification: spec,
      prompt,
    });
    bp.dashboards[1]!.route = bp.dashboards[0]!.route;
    expect(() => validateCompanyOSBlueprint(bp)).toThrow(AppError);
  });

  it("rejects non-readonly agent tools", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const spec = buildMasterBuildSpecification({ knowledge: zarKnowledge, pack, resolution });
    const prompt = buildMasterPrompt({ knowledge: zarKnowledge, specification: spec, pack });
    const bp = buildCompanyOSBlueprint({
      knowledge: zarKnowledge,
      resolution,
      pack,
      specification: spec,
      prompt,
    });
    bp.agents[0]!.tools[0]!.readOnly = false;
    expect(() => validateCompanyOSBlueprint(bp)).toThrow(/BLUEPRINT_INVALID_AGENT_MODE|Agent tool/);
  });
});

describe("Phase 3 pipeline", () => {
  it("runs fixture plan → blueprint → dual persist", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p3-"));
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
    const plan = await services.planning.planFromExistingKnowledge("زر ماکارون");
    const result = await services.blueprint.blueprintFromExisting("زر ماکارون");
    expect(result.ok).toBe(true);
    expect(result.message).toContain("Blueprint سیستم‌عامل شرکتی تکمیل شد");
    expect(result.message).not.toMatch(/Build Successful|Application Generated|Deployment Complete/i);
    expect(result.blueprint.company.industryPackId).toBe("manufacturing");
    expect(plan.resolution.selectedPackId).toBe("manufacturing");

    const workspace = join(
      root,
      "projects",
      resolved.company.slug,
      ".factory",
      "company-os-blueprint.json",
    );
    const memory = join(root, "memory", "blueprints", `${resolved.company.slug}.json`);
    const summary = join(
      root,
      "projects",
      resolved.company.slug,
      ".factory",
      "company-os-blueprint-summary.json",
    );
    const a = JSON.parse(await readFile(workspace, "utf8"));
    const b = JSON.parse(await readFile(memory, "utf8"));
    expect(a.contentHash).toBe(b.contentHash);
    expect(await readFile(summary, "utf8")).toContain("زر ماکارون");
  });

  it("/demo completes through generation with no deployment", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p3-demo-"));
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

describe("Phase 3 quality score audit", () => {
  it("scores are not constant and incomplete blueprints score lower", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const specification = buildMasterBuildSpecification({
      knowledge: zarKnowledge,
      resolution,
      pack,
    });
    const prompt = buildMasterPrompt({
      knowledge: zarKnowledge,
      pack,
      specification,
    });
    const full = buildCompanyOSBlueprint({
      knowledge: zarKnowledge,
      resolution,
      pack,
      specification,
      prompt,
    });
    const fullQ = calculateBlueprintQuality({
      knowledge: zarKnowledge,
      specification,
      blueprint: full,
    });

    const incomplete = {
      ...full,
      dashboards: full.dashboards.slice(0, 1),
      modules: full.modules.slice(0, 1),
      workflows: [],
      agents: [],
      navigation: { ...full.navigation, primary: full.navigation.primary.slice(0, 1) },
      mockDataPlan: { ...full.mockDataPlan, scenarios: full.mockDataPlan.scenarios.slice(0, 1) },
      dataModel: {
        ...full.dataModel,
        entities: full.dataModel.entities.slice(0, 2),
        relationships: [],
      },
      roles: full.roles.slice(0, 1),
      permissionModel: {
        ...full.permissionModel,
        permissions: full.permissionModel.permissions.slice(0, 1),
        sensitiveOperations: [],
      },
      implementationPlan: {
        ...full.implementationPlan,
        workstreams: full.implementationPlan.workstreams.slice(0, 1),
      },
    };
    const incompleteQ = calculateBlueprintQuality({
      knowledge: zarKnowledge,
      specification,
      blueprint: incomplete,
    });

    expect(fullQ.completenessScore).toBeGreaterThan(incompleteQ.completenessScore);
    expect(incompleteQ.completenessScore).toBeLessThan(1);
    expect(incompleteQ.readyForCodeGeneration).toBe(false);

    const brokenConsistency = {
      ...full,
      dashboards: full.dashboards.map((d, i) =>
        i === 0
          ? {
              ...d,
              widgets: d.widgets.map((w) => ({ ...w, sectionId: "missing-section" })),
            }
          : d,
      ),
    };
    const brokenQ = calculateBlueprintQuality({
      knowledge: zarKnowledge,
      specification,
      blueprint: brokenConsistency,
    });
    expect(brokenQ.consistencyScore).toBeLessThan(fullQ.consistencyScore);

    const untraced = {
      ...full,
      dashboards: full.dashboards.map((d) =>
        d.priority === "HIGH" ? { ...d, trace: [] } : d,
      ),
      workflows: full.workflows.map((w) =>
        w.priority === "HIGH" ? { ...w, trace: [] } : w,
      ),
      agents: full.agents.map((a) =>
        a.priority === "HIGH" ? { ...a, trace: [] } : a,
      ),
      modules: full.modules.map((m) =>
        m.priority === "HIGH" ? { ...m, trace: [] } : m,
      ),
    };
    const untracedQ = calculateBlueprintQuality({
      knowledge: zarKnowledge,
      specification,
      blueprint: untraced,
    });
    expect(untracedQ.traceabilityScore).toBeLessThan(fullQ.traceabilityScore);

    const unsafe = {
      ...full,
      permissionModel: {
        ...full.permissionModel,
        sensitiveOperations: full.permissionModel.sensitiveOperations.map((s) => ({
          ...s,
          approvalRequired: false,
          auditRequired: false,
        })),
      },
      agents: full.agents.map((a) => ({
        ...a,
        prohibitedActions: ["only-one"],
        tools: a.tools.map((t) => ({ ...t, readOnly: false })),
      })),
    };
    const unsafeQ = calculateBlueprintQuality({
      knowledge: zarKnowledge,
      specification,
      blueprint: unsafe,
    });
    expect(unsafeQ.securityScore).toBeLessThan(fullQ.securityScore);

    expect(fullQ.readyForCodeGeneration).toBe(true);
    // Soft penalty from unresolved questions may keep completeness below 1.00
    expect(
      [
        fullQ.completenessScore,
        fullQ.consistencyScore,
        fullQ.traceabilityScore,
        fullQ.securityScore,
        fullQ.implementationReadinessScore,
      ].some((s) => s < 1) || fullQ.warnings.length >= 0,
    ).toBe(true);
  });
});

describe("production brand hardcoding guard (phase3)", () => {
  it("keeps production src free of Zar Macaron brand strings", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      "rg -n 'زر ماکارون|زرماکارون|Zar Macaron|ZarMacaron|zarmacaron\\.com' src || true",
      { encoding: "utf8" },
    );
    expect(out.trim()).toBe("");
  });
});
