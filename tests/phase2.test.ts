import { describe, it, expect } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { loadConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { parseCommand } from "../src/commands/parse.js";
import { executeCommand } from "../src/commands/execute.js";
import { ALL_INDUSTRY_PACKS, getIndustryPack, listIndustryPackIds } from "../src/industries/industry-pack-registry.js";
import { IndustryEngine } from "../src/industries/industry-engine.js";
import { resolveIndustryPack } from "../src/industries/industry-resolver.js";
import { parseCompanyKnowledge } from "../src/knowledge/company-knowledge-schema.js";
import { buildMasterBuildSpecification } from "../src/specifications/master-build-specification-service.js";
import { buildMasterPrompt } from "../src/prompts/master-prompt-builder.js";
import { MASTER_PROMPT_SECTION_IDS } from "../src/prompts/master-prompt-schema.js";
import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import type { FetchedPage, WebsiteFetcher } from "../src/discovery/discovery-types.js";
import { nowIso } from "../src/shared/ids.js";
import { AppError } from "../src/shared/errors.js";
import { createStubGenerationService } from "../src/generation/test-stub-generation.js";

const fixtureRoot = join(process.cwd(), "tests/fixtures/zar-macaron");
const zarKnowledge = parseCompanyKnowledge(
  JSON.parse(readFileSync(join(fixtureRoot, "company-knowledge.json"), "utf8")),
);
const zarHome = readFileSync(join(fixtureRoot, "homepage.html"), "utf8");
const zarProducts = readFileSync(join(fixtureRoot, "products.html"), "utf8");
const zarAbout = readFileSync(join(fixtureRoot, "about.html"), "utf8");
const expectedSections = JSON.parse(
  readFileSync(join(fixtureRoot, "expected-master-prompt-sections.json"), "utf8"),
) as {
  sections: string[];
  mustContain: string[];
  mustNotContain: string[];
};

function fixtureFetcher(htmlByUrl: Record<string, string>): WebsiteFetcher {
  return {
    async fetchPage(input): Promise<FetchedPage> {
      const html = htmlByUrl[input.url] ?? htmlByUrl["*"];
      if (!html) {
        throw new AppError("DISCOVERY_FETCH_FAILED", `No fixture for ${input.url}`);
      }
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

describe("industry packs", () => {
  it("validates all required packs with unique references", () => {
    const ids = listIndustryPackIds().sort();
    expect(ids).toEqual(
      [
        "banking",
        "construction",
        "education",
        "general",
        "legal",
        "manufacturing",
        "medical",
        "oil-gas",
        "real-estate",
        "steel",
      ].sort(),
    );
    for (const pack of ALL_INDUSTRY_PACKS) {
      expect(pack.schemaVersion).toBe("1.0");
      expect(pack.kpis.length).toBeGreaterThan(3);
      expect(pack.workflowBlueprints.length).toBeGreaterThan(2);
      expect(pack.dashboardBlueprints.length).toBeGreaterThan(2);
      expect(pack.aiAgentRoster.length).toBeGreaterThan(2);
      expect(pack.mockSchema.entities.length).toBeGreaterThan(2);
      for (const agent of pack.aiAgentRoster) {
        expect(["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"]).toContain(agent.permissions);
      }
    }
  });

  it("manufacturing packs differ from construction and include food-capable concepts", () => {
    const m = getIndustryPack("manufacturing");
    const c = getIndustryPack("construction");
    expect(m.kpis.map((k) => k.name)).not.toEqual(c.kpis.map((k) => k.name));
    const names = [
      ...m.kpis.map((k) => k.name),
      ...m.workflowBlueprints.map((w) => w.name),
      ...m.dashboardBlueprints.map((d) => d.name),
      ...m.aiAgentRoster.map((a) => a.name),
    ].join(" ");
    expect(names).toMatch(/OEE|Production yield|Food Safety|Demand Forecasting/i);
    expect(m.aliases.join(" ")).toMatch(/pasta|ماکارون|صنایع غذایی/i);
  });

  it("restricted packs emphasize approval and human review", () => {
    for (const id of ["medical", "legal", "banking"] as const) {
      const pack = getIndustryPack(id);
      const text = [
        ...pack.risks,
        ...pack.aiAgentRoster.map((a) => `${a.mission} ${a.permissions}`),
      ].join(" ");
      expect(text.toLowerCase()).toMatch(/approval|human|privacy|audit|review/);
    }
  });
});

describe("industry resolution", () => {
  const engine = new IndustryEngine();

  it("resolves Zar Macaron food manufacturing to manufacturing", () => {
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    expect(resolution.selectedPackId).toBe("manufacturing");
    expect(resolution.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("resolves Persian manufacturing terms", () => {
    const r = resolveIndustryPack({
      packs: ALL_INDUSTRY_PACKS.map((p) => ({
        packId: p.id,
        aliases: [p.id, p.name, ...p.aliases],
      })),
      primaryIndustry: "تولید صنعتی",
      products: ["پاستا", "ماکارون"],
      description: "کارخانه صنایع غذایی",
    });
    expect(r.selectedPackId).toBe("manufacturing");
  });

  it("prefers manufacturing for concrete products with construction as alternative", () => {
    const r = resolveIndustryPack({
      packs: ALL_INDUSTRY_PACKS.map((p) => ({
        packId: p.id,
        aliases: [p.id, p.name, ...p.aliases],
      })),
      primaryIndustry: "Concrete manufacturing",
      products: ["precast panels"],
      description: "factory production of precast concrete",
    });
    expect(r.selectedPackId).toBe("manufacturing");
    expect(r.alternatives.some((a) => a.packId === "construction" || a.packId === "general")).toBe(
      true,
    );
  });

  it("falls back to general for unknown companies", () => {
    const r = resolveIndustryPack({
      packs: ALL_INDUSTRY_PACKS.map((p) => ({
        packId: p.id,
        aliases: [p.id, p.name, ...p.aliases],
      })),
      primaryIndustry: "Unknown niche widgets",
      description: "something unrelated xyzzy",
    });
    expect(r.selectedPackId).toBe("general");
    expect(r.requiresReview).toBe(true);
  });
});

describe("MasterBuildSpecification + Master Prompt", () => {
  it("builds deterministic Zar Macaron specification and prompt", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const spec1 = buildMasterBuildSpecification({
      knowledge: zarKnowledge,
      pack,
      resolution,
    });
    const spec2 = buildMasterBuildSpecification({
      knowledge: zarKnowledge,
      pack,
      resolution,
    });
    expect(spec1.company.displayName).toBe("زر ماکارون");
    expect(spec1.company.rtl).toBe(true);
    expect(spec1.industry.selectedPackId).toBe("manufacturing");
    expect(spec1.contentHash).toBe(spec2.contentHash);
    expect(spec1.dashboards.filter((d) => d.priority === "HIGH").length).toBeLessThanOrEqual(8);
    expect(spec1.workflows.filter((w) => w.priority === "HIGH").length).toBeLessThanOrEqual(15);
    expect(spec1.agents.length).toBeLessThanOrEqual(10);
    expect(spec1.unresolvedQuestions.length).toBeGreaterThan(0);
    expect(spec1.assumptions.length).toBeGreaterThan(0);

    const prompt = buildMasterPrompt({ knowledge: zarKnowledge, specification: spec1, pack });
    expect(prompt.sections.map((s) => s.id)).toEqual([...MASTER_PROMPT_SECTION_IDS]);
    expect(prompt.sections.map((s) => s.id)).toEqual(expectedSections.sections);
    expect(prompt.specificationHash).toBe(spec1.contentHash);
    for (const needle of expectedSections.mustContain) {
      expect(prompt.prompt.toLowerCase()).toContain(needle.toLowerCase());
    }
    for (const banned of expectedSections.mustNotContain) {
      expect(prompt.prompt).not.toContain(banned);
    }
    expect(prompt.prompt.toLowerCase()).not.toContain("concrete");
    expect(prompt.prompt).not.toMatch(/<\s*html/i);
  });

  it("changes prompt hash when specification changes", () => {
    const engine = new IndustryEngine();
    const resolution = engine.resolveFromKnowledge(zarKnowledge);
    const pack = engine.getPack(resolution.selectedPackId);
    const spec = buildMasterBuildSpecification({ knowledge: zarKnowledge, pack, resolution });
    const p1 = buildMasterPrompt({ knowledge: zarKnowledge, specification: spec, pack });
    const mutated = {
      ...spec,
      objectives: [
        ...spec.objectives,
        {
          id: "extra",
          title: "Extra objective",
          description: "Changed",
          source: "INDUSTRY_DEFAULT" as const,
          priority: "LOW" as const,
        },
      ],
      contentHash: "different",
    };
    const p2 = buildMasterPrompt({ knowledge: zarKnowledge, specification: mutated, pack });
    expect(p1.contentHash).not.toBe(p2.contentHash);
  });
});

describe("Zar Macaron aliases and parser", () => {
  const aliases = [
    "/demo زر ماکارون",
    "/demo زرماکارون",
    "/demo زر ماکرون",
    "/demo Zar Macaron",
    "/demo ZarMacaron",
    "/demo زر ماکارون | https://www.zarmacaron.com/",
  ];

  it("parses all aliases", () => {
    for (const raw of aliases) {
      const parsed = parseCommand(raw);
      expect(parsed.kind).toBe("demo");
      if (parsed.kind === "demo") {
        expect(parsed.companyName.length).toBeGreaterThan(2);
      }
    }
  });

  it("resolves aliases to one company record", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-alias-"));
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
    const first = await services.registry.resolveByName("زر ماکارون");
    const spaced = await services.registry.resolveByName("زرماکارون");
    const variant = await services.registry.resolveByName("زر ماکرون");
    expect(spaced.company.id).toBe(first.company.id);
    expect(variant.company.id).toBe(first.company.id);

    await services.companies.update(first.company.id, {
      aliases: [
        ...first.company.aliases,
        "Zar Macaron",
        "ZarMacaron",
        "Zarmacaron",
        "Zar Macaroni",
      ],
    });
    const english = await services.registry.resolveByName("Zar Macaron");
    const compact = await services.registry.resolveByName("ZarMacaron");
    expect(english.company.id).toBe(first.company.id);
    expect(compact.company.id).toBe(first.company.id);
  });
});

describe("Phase 2 pipeline persistence", () => {
  it("runs fixture knowledge → manufacturing → spec → prompt → dual persist", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p2-"));
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
    const knowledge = {
      ...zarKnowledge,
      companyId: resolved.company.id,
      companySlug: resolved.company.slug,
      displayName: "زر ماکارون",
    };
    await services.knowledge.save(knowledge);
    const result = await services.planning.planFromExistingKnowledge("زر ماکارون");
    expect(result.ok).toBe(true);
    expect(result.resolution.selectedPackId).toBe("manufacturing");
    expect(result.message).toContain("برنامه‌ریزی شرکت با موفقیت تکمیل شد");
    expect(result.message).not.toMatch(/Build Successful|Application Generated|Deployment Complete/i);

    const workspaceSpec = join(
      root,
      "projects",
      resolved.company.slug,
      ".factory",
      "master-build-specification.json",
    );
    const memorySpec = join(root, "memory", "specifications", `${resolved.company.slug}.json`);
    const promptJson = join(
      root,
      "projects",
      resolved.company.slug,
      ".factory",
      "master-prompt.json",
    );
    const promptTxt = join(
      root,
      "projects",
      resolved.company.slug,
      ".factory",
      "master-prompt.txt",
    );
    const a = JSON.parse(await readFile(workspaceSpec, "utf8"));
    const b = JSON.parse(await readFile(memorySpec, "utf8"));
    expect(a.contentHash).toBe(b.contentHash);
    expect(await readFile(promptJson, "utf8")).toContain("زر ماکارون");
    expect(await readFile(promptTxt, "utf8")).toContain("manufacturing");

    const job = await services.jobManager.require(result.jobId);
    expect(job.status).toBe("SUCCEEDED");
    expect(job.currentStage).toBe("PLANNING_COMPLETE");
  });

  it("stops Phase 2 when knowledge is NEEDS_INPUT", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p2-needs-"));
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
    const resolved = await services.registry.resolveByName("Needs Input Co");
    await expect(
      services.planning.planWithKnowledge(
        {
          ...zarKnowledge,
          companyId: resolved.company.id,
          companySlug: resolved.company.slug,
          displayName: "Needs Input Co",
          status: "NEEDS_INPUT",
          branding: { ...zarKnowledge.branding, rtlRecommended: false, languages: ["en"] },
        },
        resolved.company.id,
        resolved.project.id,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("/demo with explicit Zar website completes planning", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p2-demo-"));
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
        "https://www.zarmacaron.com/products": zarProducts,
        "https://www.zarmacaron.com/about": zarAbout,
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
    expect(result.message).toMatch(
      /Blueprint سیستم‌عامل شرکتی تکمیل شد|Company OS blueprint completed/,
    );
    expect(result.message).toMatch(/Application generated and build verified/);
    expect(result.message).toMatch(/has not been deployed/i);
    expect(result.message).not.toMatch(/Deployment Complete/i);
  });
});

describe("production brand hardcoding guard", () => {
  it("does not embed Zar Macaron strings in production src modules", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      "rg -n 'زر ماکارون|زرماکارون|Zar Macaron|ZarMacaron|zarmacaron\\.com' src || true",
      { encoding: "utf8" },
    );
    expect(out.trim()).toBe("");
  });
});
