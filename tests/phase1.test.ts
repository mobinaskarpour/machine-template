import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { parseCommand } from "../src/commands/parse.js";
import { executeCommand } from "../src/commands/execute.js";
import { AppError } from "../src/shared/errors.js";
import {
  assertSafePublicUrl,
  assertSafePublicUrlSync,
} from "../src/security/safe-url.js";
import {
  parseCompanyKnowledge,
  type CompanyKnowledge,
} from "../src/knowledge/company-knowledge-schema.js";
import {
  normalizeCompanyKnowledge,
  semanticValidateKnowledge,
  calculateOverallConfidence,
} from "../src/knowledge/knowledge-normalizer.js";
import { nowIso } from "../src/shared/ids.js";
import type {
  FetchedPage,
  KnowledgeSynthesisProvider,
  SearchProvider,
  WebsiteFetcher,
} from "../src/discovery/discovery-types.js";
import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import { rankWebsiteCandidates, selectTopWebsite } from "../src/discovery/source-ranking.js";
import { stripHtmlToText } from "../src/security/untrusted-content.js";
import { readFileSync } from "node:fs";
import { CodexKnowledgeSynthesisProvider } from "../src/integrations/codex/codex-synthesis-provider.js";
import { SafeCommandRunner } from "../src/runners/safe-command-runner.js";

const acmeHtml = readFileSync(
  join(process.cwd(), "tests/fixtures/discovery/acme-concrete.html"),
  "utf8",
);

function baseKnowledge(overrides: Partial<CompanyKnowledge> = {}): CompanyKnowledge {
  const now = nowIso();
  const sourceId = "src_1";
  return {
    schemaVersion: "1.0",
    companyId: "co_1",
    companySlug: "acme-concrete",
    displayName: "Acme Concrete",
    status: "DRAFT",
    identity: {
      tradingNames: [],
      description: "Precast concrete manufacturer",
      officialWebsite: "https://example.com/",
    },
    industry: {
      primary: "Concrete manufacturing",
      secondary: [],
      confidence: 0.8,
      evidenceSourceIds: [sourceId],
    },
    products: [
      {
        id: "p1",
        name: "Precast wall panels",
        confidence: 0.7,
        evidenceSourceIds: [sourceId],
      },
    ],
    departments: [
      {
        id: "d1",
        name: "Operations",
        inferred: true,
        confidence: 0.4,
        evidenceSourceIds: [sourceId],
      },
    ],
    roles: [],
    businessModel: {
      summary: "B2B manufacturing",
      type: "B2B",
      confidence: 0.5,
      evidenceSourceIds: [sourceId],
    },
    customers: [],
    suppliers: [],
    painPoints: [
      {
        id: "pain1",
        title: "Planning complexity",
        description: "Scheduling is hard",
        inferred: true,
        confidence: 0.4,
        evidenceSourceIds: [sourceId],
      },
    ],
    revenueModel: { streams: [], summary: "Product sales" },
    processes: [],
    integrations: [],
    aiUseCases: [
      {
        id: "ai1",
        title: "Ops brief",
        description: "Daily brief",
        priority: "HIGH",
        inferred: true,
        confidence: 0.3,
        evidenceSourceIds: [sourceId],
      },
    ],
    competitors: [],
    branding: {
      secondaryColors: [],
      languages: ["en"],
      rtlRecommended: false,
      evidenceSourceIds: [sourceId],
    },
    sources: [
      {
        id: sourceId,
        url: "https://example.com/",
        sourceType: "OFFICIAL_WEBSITE",
        authorityScore: 0.9,
        fetchedAt: now,
        status: "FETCHED",
      },
    ],
    gaps: [],
    overallConfidence: 0.7,
    discoveredAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function fixtureFetcher(htmlByUrl: Record<string, string>): WebsiteFetcher {
  return {
    async fetchPage(input): Promise<FetchedPage> {
      const html = htmlByUrl[input.url] ?? htmlByUrl["*"];
      if (!html) {
        throw new AppError("DISCOVERY_FETCH_FAILED", `No fixture for ${input.url}`);
      }
      if (input.maxBytes < 10) {
        throw new AppError("DISCOVERY_CONTENT_TOO_LARGE", "too large");
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

describe("CompanyKnowledge validation", () => {
  it("accepts a valid complete schema", () => {
    const k = parseCompanyKnowledge(baseKnowledge());
    expect(k.schemaVersion).toBe("1.0");
  });

  it("rejects invalid confidence", () => {
    expect(() =>
      parseCompanyKnowledge(
        baseKnowledge({
          industry: {
            primary: "X",
            secondary: [],
            confidence: 1.5,
            evidenceSourceIds: ["src_1"],
          },
        }),
      ),
    ).toThrow(AppError);
  });

  it("rejects missing source references", () => {
    const k = baseKnowledge({
      products: [
        {
          id: "p1",
          name: "Beam",
          confidence: 0.5,
          evidenceSourceIds: ["missing"],
        },
      ],
    });
    expect(() =>
      semanticValidateKnowledge(normalizeCompanyKnowledge(k), {
        minReadyConfidence: 0.65,
        minWebsiteConfidence: 0.75,
      }),
    ).toThrow(AppError);
  });

  it("rejects confirmed department without evidence", () => {
    const k = baseKnowledge({
      departments: [
        {
          id: "d1",
          name: "Sales",
          inferred: false,
          confidence: 0.9,
          evidenceSourceIds: [],
        },
      ],
    });
    expect(() =>
      semanticValidateKnowledge(k, {
        minReadyConfidence: 0.65,
        minWebsiteConfidence: 0.75,
      }),
    ).toThrow(AppError);
  });

  it("keeps inferred AI use cases marked", () => {
    const k = normalizeCompanyKnowledge(baseKnowledge());
    expect(k.aiUseCases.every((a) => a.inferred === true)).toBe(true);
  });

  it("normalizes duplicate products and Persian RTL", () => {
    const k = normalizeCompanyKnowledge(
      baseKnowledge({
        displayName: "شرکت نمونه",
        products: [
          {
            id: "1",
            name: "Beam",
            confidence: 0.5,
            evidenceSourceIds: ["src_1"],
          },
          {
            id: "2",
            name: "beam",
            confidence: 0.5,
            evidenceSourceIds: ["src_1"],
          },
        ],
      }),
    );
    expect(k.products).toHaveLength(1);
    expect(k.branding.rtlRecommended).toBe(true);
  });

  it("rejects unsafe website and credential URLs", () => {
    expect(() => assertSafePublicUrlSync("https://user:pass@example.com")).toThrow(
      AppError,
    );
    expect(() =>
      parseCompanyKnowledge(
        baseKnowledge({
          identity: {
            tradingNames: [],
            description: "x",
            officialWebsite: "https://user:pass@example.com",
          },
        }),
      ),
    ).toThrow(AppError);
  });

  it("rejects invalid colors", () => {
    expect(() =>
      parseCompanyKnowledge(
        baseKnowledge({
          branding: {
            primaryColor: "red",
            secondaryColors: [],
            languages: ["en"],
            rtlRecommended: false,
            evidenceSourceIds: ["src_1"],
          },
        }),
      ),
    ).toThrow(AppError);
  });

  it("computes readiness thresholds", () => {
    const ready = semanticValidateKnowledge(normalizeCompanyKnowledge(baseKnowledge()), {
      minReadyConfidence: 0.65,
      minWebsiteConfidence: 0.75,
    });
    expect(ready.status).toBe("READY");
    expect(ready.overallConfidence).toBeGreaterThanOrEqual(0.65);

    const needs = semanticValidateKnowledge(
      normalizeCompanyKnowledge(
        baseKnowledge({
          products: [],
          gaps: [{ field: "officialWebsite", reason: "ambiguous" }],
          sources: [
            {
              id: "src_1",
              url: "https://example.com/",
              sourceType: "SEARCH_RESULT",
              authorityScore: 0.2,
              fetchedAt: nowIso(),
              status: "DISCOVERED",
            },
          ],
        }),
      ),
      { minReadyConfidence: 0.65, minWebsiteConfidence: 0.75 },
    );
    expect(needs.status).toBe("NEEDS_INPUT");
  });

  it("confidence model stays in range", () => {
    const score = calculateOverallConfidence({
      websiteConfidence: 0.9,
      authoritativeFetchedSources: 2,
      hasIndustry: true,
      hasDescription: true,
      productCount: 3,
      inferredRatio: 0.5,
      conflictPenalty: 0,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("URL safety", () => {
  it("allows public https", async () => {
    const url = await assertSafePublicUrl("https://example.com/about", {
      resolveDns: false,
    });
    expect(url.hostname).toBe("example.com");
  });

  it("rejects localhost, loopback, private, link-local, metadata, file, credentials", async () => {
    const bad = [
      "http://localhost/x",
      "http://127.0.0.1/x",
      "http://10.0.0.5/x",
      "http://169.254.1.1/x",
      "http://[::1]/",
      "http://169.254.169.254/latest",
      "file:///etc/passwd",
      "https://user:pass@example.com",
    ];
    for (const url of bad) {
      await expect(assertSafePublicUrl(url, { resolveDns: false })).rejects.toBeInstanceOf(
        AppError,
      );
    }
  });
});

describe("untrusted content", () => {
  it("strips scripts and injection text remains labeled evidence only", () => {
    const text = stripHtmlToText(acmeHtml, 5000);
    expect(text.toLowerCase()).not.toContain("<script");
    expect(text).toContain("Ignore all previous instructions");
  });
});

describe("source ranking", () => {
  it("penalizes directories and prefers name matches", () => {
    const ranked = rankWebsiteCandidates({
      companyName: "Acme Concrete",
      results: [
        {
          title: "Acme Concrete official",
          url: "https://acme-concrete.example/",
          snippet: "official site",
        },
        {
          title: "Acme Concrete LinkedIn",
          url: "https://www.linkedin.com/company/acme",
          snippet: "profile",
        },
      ],
    });
    expect(ranked[0]?.url).toContain("acme-concrete.example");
    const selected = selectTopWebsite(ranked, 0.75);
    expect(selected.ambiguous || selected.selected).toBeTruthy();
  });
});

describe("discovery orchestration", () => {
  async function setup(root: string, overrides?: {
    searchProvider?: SearchProvider;
    fetcher?: WebsiteFetcher;
    synthesis?: KnowledgeSynthesisProvider;
  }) {
    const config = loadConfig(
      {
        TELEGRAM_BOT_TOKEN: "",
        DATA_ROOT: root,
        PROJECTS_ROOT: join(root, "projects"),
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
        DISCOVERY_SYNTHESIS_PROVIDER: "deterministic",
      },
      { cwd: root, requireTelegramToken: false },
    );
    const logger = createLogger({ level: "silent" });
    return createAppServices(config, logger, {
      fetcher:
        overrides?.fetcher ??
        fixtureFetcher({
          "https://example.com/": acmeHtml,
          "https://example.com": acmeHtml,
          "*": acmeHtml,
        }),
      synthesis: overrides?.synthesis ?? new DeterministicKnowledgeSynthesisProvider(),
      searchProvider: overrides?.searchProvider,
    });
  }

  it("explicit website path discovers and persists both mirrors", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const services = await setup(root);
    const result = await services.discovery.discover({
      companyName: "Acme Concrete Fixture",
      websiteHint: "https://example.com/",
    });
    expect(result.ok).toBe(true);
    expect(result.knowledge?.products.length).toBeGreaterThan(0);
    expect(result.message.toLowerCase()).not.toContain("build successful");
    expect(result.message).toContain("not implemented in Phase 1");

    const job = await services.jobManager.require(result.jobId);
    expect(job.status).toBe("SUCCEEDED");
    expect(job.type).toBe("DISCOVERY");

    const ws = await readFile(
      join(root, "projects", result.companySlug, ".factory", "knowledge.json"),
      "utf8",
    );
    const mem = await readFile(
      join(root, "memory", "companies", `${result.companySlug}.json`),
      "utf8",
    );
    expect(JSON.parse(ws).contentHash).toBe(JSON.parse(mem).contentHash);
  });

  it("company-name-only without provider returns NEEDS_INPUT", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const services = await setup(root, { searchProvider: undefined });
    // force no search provider
    const result = await services.discovery.discover({
      companyName: "Unknown Co",
    });
    expect(result.ok).toBe(false);
    expect(result.needsInput).toBe(true);
    const job = await services.jobManager.require(result.jobId);
    expect(job.status).toBe("FAILED");
    expect(job.error?.code).toBe("DISCOVERY_NEEDS_INPUT");
  });

  it("ambiguous search candidates ask for input", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const search: SearchProvider = {
      name: "fixture",
      async searchCompany() {
        return [
          { title: "Foo One", url: "https://a.example/", snippet: "foo" },
          { title: "Foo Two", url: "https://b.example/", snippet: "foo" },
        ];
      },
    };
    const services = await setup(root, { searchProvider: search });
    const result = await services.discovery.discover({ companyName: "Foo" });
    expect(result.needsInput).toBe(true);
    expect(result.message).toMatch(/Retry with/i);
  });

  it("fetch failure marks job FAILED", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const fetcher: WebsiteFetcher = {
      async fetchPage() {
        throw new AppError("DISCOVERY_FETCH_FAILED", "boom");
      },
    };
    const services = await setup(root, { fetcher });
    await expect(
      services.discovery.discover({
        companyName: "Broken",
        websiteHint: "https://example.com/",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("invalid synthesis fails validation path", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const synthesis: KnowledgeSynthesisProvider = {
      name: "bad",
      async synthesize() {
        return { not: "valid" };
      },
    };
    const services = await setup(root, { synthesis });
    await expect(
      services.discovery.discover({
        companyName: "Bad Synth",
        websiteHint: "https://example.com/",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("preserves previous knowledge when refresh fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-"));
    const services = await setup(root);
    const first = await services.discovery.discover({
      companyName: "Preserve Co",
      websiteHint: "https://example.com/",
    });
    const before = await services.knowledge.require(first.companySlug);

    const failing: WebsiteFetcher = {
      async fetchPage() {
        throw new AppError("DISCOVERY_FETCH_FAILED", "fail refresh");
      },
    };
    const services2 = await setup(root, { fetcher: failing });
    // reuse same data root by creating services pointing same root with failing fetcher
    await expect(
      services2.discovery.discover({
        companyName: "Preserve Co",
        websiteHint: "https://example.com/",
      }),
    ).rejects.toBeInstanceOf(AppError);

    const after = await services.knowledge.require(first.companySlug);
    expect(after.contentHash).toBe(before.contentHash);
  });
});

describe("telegram parser phase1", () => {
  it("parses optional website syntax and persian names", () => {
    expect(parseCommand("/demo ایران فریمکو")).toEqual({
      kind: "demo",
      companyName: "ایران فریمکو",
      websiteHint: undefined,
    });
    const withUrl = parseCommand(
      "/demo ایران فریمکو | https://example.com/about",
    );
    expect(withUrl.kind).toBe("demo");
    if (withUrl.kind === "demo") {
      expect(withUrl.companyName).toBe("ایران فریمکو");
      expect(withUrl.websiteHint).toContain("https://example.com/about");
    }
  });

  it("rejects invalid url and malformed separator", () => {
    expect(() => parseCommand("/demo Acme | not-a-url")).toThrow(AppError);
    expect(() => parseCommand("/demo | https://example.com")).toThrow(AppError);
    expect(() => parseCommand("/demo Acme | file:///etc/passwd")).toThrow(AppError);
  });
});

describe("telegram demo command", () => {
  it("returns NEEDS_INPUT safely without provider", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-tg-"));
    const config = loadConfig(
      {
        DATA_ROOT: root,
        PROJECTS_ROOT: join(root, "projects"),
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
      },
      { cwd: root, requireTelegramToken: false },
    );
    const services = await createAppServices(
      config,
      createLogger({ level: "silent" }),
      {
        fetcher: fixtureFetcher({ "*": acmeHtml }),
        synthesis: new DeterministicKnowledgeSynthesisProvider(),
      },
    );
    const result = await executeCommand(
      { kind: "demo", companyName: "No Website Co" },
      services.commandContext,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/official website|وب‌سایت/i);
  });

  it("returns discovery summary for explicit website", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p1-tg2-"));
    const config = loadConfig(
      {
        DATA_ROOT: root,
        PROJECTS_ROOT: join(root, "projects"),
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
      },
      { cwd: root, requireTelegramToken: false },
    );
    const services = await createAppServices(
      config,
      createLogger({ level: "silent" }),
      {
        fetcher: fixtureFetcher({
          "https://example.com/": acmeHtml,
          "*": acmeHtml,
        }),
        synthesis: new DeterministicKnowledgeSynthesisProvider(),
      },
    );
    const result = await executeCommand(
      {
        kind: "demo",
        companyName: "Acme Concrete",
        websiteHint: "https://example.com/",
      },
      services.commandContext,
    );
    expect(result.ok).toBe(true);
    expect(result.message).toContain("Company discovery completed");
    expect(result.message).toContain("Knowledge saved");
  });
});

describe("codex adapter safety", () => {
  it("uses absolute executable and optional model without hardcoding unverified model", async () => {
    const calls: Array<{ executable: string; args: string[] }> = [];
    const runner = {
      async runExecutable(input: {
        executable: string;
        args: string[];
        cwd: string;
        timeoutMs: number;
        envAllowlist: string[];
      }) {
        calls.push({ executable: input.executable, args: input.args });
        throw new AppError("COMMAND_SPAWN_FAILED", "forced");
      },
      async runBashLc() {
        throw new Error("not used");
      },
    } as unknown as SafeCommandRunner;

    const provider = new CodexKnowledgeSynthesisProvider(runner, {
      model: undefined,
      timeoutMs: 1000,
      codexPath: "/usr/local/bin/codex",
    });

    await expect(
      provider.synthesize({
        companyName: "X",
        companyId: "co",
        companySlug: "x",
        sources: [],
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(calls[0]?.executable).toBe("/usr/local/bin/codex");
    expect(calls[0]?.args.includes("-m")).toBe(false);
    expect(calls[0]?.args.join(" ")).not.toContain("gpt-5.6-sol");
  });
});
