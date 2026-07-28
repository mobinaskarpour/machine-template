import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config/env.js";
import { createLogger } from "../src/logging/logger.js";
import { createAppServices } from "../src/app/create-app.js";
import { executeCommand } from "../src/commands/execute.js";
import { DeterministicKnowledgeSynthesisProvider } from "../src/discovery/providers/deterministic-synthesis.js";
import { AppError } from "../src/shared/errors.js";
import type { FetchedPage, WebsiteFetcher } from "../src/discovery/discovery-types.js";
import { nowIso } from "../src/shared/ids.js";
import { createStubGenerationService } from "../src/generation/test-stub-generation.js";
import { createStubQualityService } from "../src/quality/test-stub-quality.js";
import { QUALITY_WEIGHTS, ALLOW_SKIPPED_BROWSER_QA } from "../src/quality/quality-thresholds.js";
import { computeOverallScore } from "../src/quality/quality-score.js";
import {
  evaluateAcceptance,
  type AcceptanceValidationFlags,
} from "../src/quality/acceptance-gate.js";
import { computeIssueFingerprint } from "../src/quality/issue-classifier.js";
import { deduplicateIssues } from "../src/quality/issue-deduplicator.js";
import { createQualityIssue } from "../src/quality/quality-issue-schema.js";
import { formatQualityMessage } from "../src/quality/quality-summary.js";
import { prepareRepairStaging } from "../src/quality/repair/repair-workspace.js";
import { DeterministicRepairProvider } from "../src/quality/repair/providers/deterministic-repair-provider.js";
import type { CompanyOSBlueprint } from "../src/blueprints/company-os-blueprint-schema.js";
import type { RepairPlan } from "../src/quality/repair/repair-plan-schema.js";
import { probeHealth } from "../src/quality/runtime/health-probe.js";
import {
  killProcessTree,
  isProcessRunning,
} from "../src/quality/runtime/runtime-cleanup.js";
import { readFileSync } from "node:fs";

const fixtureRoot = join(process.cwd(), "tests/fixtures/zar-macaron");
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

function passingValidation(
  overrides: Partial<AcceptanceValidationFlags> = {},
): AcceptanceValidationFlags {
  return {
    typecheck: true,
    tests: true,
    build: true,
    securityScan: true,
    routeIntegrity: true,
    sourceHashesMatch: true,
    regressionPassed: true,
    requiresRtl: false,
    ...overrides,
  };
}

function baseScores(overrides: Record<string, number | null> = {}) {
  return {
    overall: 0.92,
    blueprintCoverage: 0.95,
    dataIntegrity: 0.95,
    accessibility: 0.9,
    rtlCorrectness: 0.95,
    visualQuality: 0.9,
    responsiveBehavior: 0.85,
    security: 0.95,
    ...overrides,
  };
}

describe("QUALITY_WEIGHTS", () => {
  it("sums to 1.00", () => {
    const sum = Object.values(QUALITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });
});

describe("computeOverallScore", () => {
  it("lowers confidence when dimensions are null", () => {
    const full = computeOverallScore({
      buildIntegrity: 1,
      functionalCorrectness: 1,
      blueprintCoverage: 1,
      dataIntegrity: 1,
      visualQuality: 1,
      responsiveBehavior: 1,
      rtlCorrectness: 1,
      accessibility: 1,
      performance: 1,
      security: 1,
      contentQuality: 1,
    });
    const partial = computeOverallScore({
      buildIntegrity: 1,
      functionalCorrectness: 1,
      blueprintCoverage: 1,
      dataIntegrity: 1,
      visualQuality: null,
      responsiveBehavior: 1,
      rtlCorrectness: 1,
      accessibility: null,
      performance: 1,
      security: 1,
      contentQuality: 1,
    });
    expect(partial.confidence).toBeLessThan(full.confidence);
    expect(full.confidence).toBe(1);
  });

  it("does not treat null as 1.0", () => {
    const withNullVisual = computeOverallScore({
      buildIntegrity: 0.5,
      functionalCorrectness: 0.5,
      blueprintCoverage: 0.5,
      dataIntegrity: 0.5,
      visualQuality: null,
      responsiveBehavior: 0.5,
      rtlCorrectness: 0.5,
      accessibility: 0.5,
      performance: 0.5,
      security: 0.5,
      contentQuality: 0.5,
    });
    const withPerfectVisual = computeOverallScore({
      buildIntegrity: 0.5,
      functionalCorrectness: 0.5,
      blueprintCoverage: 0.5,
      dataIntegrity: 0.5,
      visualQuality: 1,
      responsiveBehavior: 0.5,
      rtlCorrectness: 0.5,
      accessibility: 0.5,
      performance: 0.5,
      security: 0.5,
      contentQuality: 0.5,
    });
    // If null were treated as 1.0, overall would match withPerfectVisual.
    expect(withNullVisual.overall).not.toBe(withPerfectVisual.overall);
    expect(withNullVisual.overall).toBeCloseTo(0.5, 5);
  });

  it("changes overall when scores change", () => {
    const low = computeOverallScore({
      buildIntegrity: 0.2,
      functionalCorrectness: 0.2,
      blueprintCoverage: 0.2,
      dataIntegrity: 0.2,
      visualQuality: 0.2,
      responsiveBehavior: 0.2,
      rtlCorrectness: 0.2,
      accessibility: 0.2,
      performance: 0.2,
      security: 0.2,
      contentQuality: 0.2,
    });
    const high = computeOverallScore({
      buildIntegrity: 0.9,
      functionalCorrectness: 0.9,
      blueprintCoverage: 0.9,
      dataIntegrity: 0.9,
      visualQuality: 0.9,
      responsiveBehavior: 0.9,
      rtlCorrectness: 0.9,
      accessibility: 0.9,
      performance: 0.9,
      security: 0.9,
      contentQuality: 0.9,
    });
    expect(high.overall).toBeGreaterThan(low.overall);
  });
});

describe("evaluateAcceptance", () => {
  it("blocks on unresolved CRITICAL issues", () => {
    const critical = createQualityIssue({
      qualityRunId: "qr_test",
      category: "FUNCTIONAL",
      severity: "CRITICAL",
      title: "Broken core route",
      description: "Home route fails",
      fingerprint: "fp_critical",
      blocking: true,
      status: "OPEN",
    });
    const result = evaluateAcceptance({
      scores: baseScores(),
      issues: [critical],
      validation: passingValidation(),
    });
    expect(result.accepted).toBe(false);
    expect(result.blockingReasons.some((r) => /CRITICAL/i.test(r))).toBe(true);
  });

  it("blocks on HIGH security issues", () => {
    const securityHigh = createQualityIssue({
      qualityRunId: "qr_test",
      category: "SECURITY",
      severity: "HIGH",
      title: "Secret pattern",
      description: "Hardcoded secret",
      fingerprint: "fp_sec",
      blocking: true,
      status: "OPEN",
    });
    const result = evaluateAcceptance({
      scores: baseScores(),
      issues: [securityHigh],
      validation: passingValidation(),
    });
    expect(result.accepted).toBe(false);
    expect(result.blockingReasons.some((r) => /security/i.test(r))).toBe(true);
  });

  it("warns on skipped visual/accessibility when ALLOW_SKIPPED_BROWSER_QA", () => {
    expect(ALLOW_SKIPPED_BROWSER_QA).toBe(true);
    const result = evaluateAcceptance({
      scores: baseScores({ visualQuality: null, accessibility: null }),
      issues: [],
      validation: passingValidation(),
      allowSkippedBrowserQa: true,
    });
    expect(result.accepted).toBe(true);
    expect(result.warnings.some((w) => /Visual QA skipped/i.test(w))).toBe(true);
    expect(result.warnings.some((w) => /Accessibility not fully verified/i.test(w))).toBe(
      true,
    );
  });

  it("blocks build failure even with high visual score", () => {
    const result = evaluateAcceptance({
      scores: baseScores({ visualQuality: 0.99, overall: 0.95 }),
      issues: [],
      validation: passingValidation({ build: false }),
    });
    expect(result.accepted).toBe(false);
    expect(result.blockingReasons.some((r) => /build/i.test(r))).toBe(true);
    expect(
      result.blockingReasons.some((r) => /visual score cannot compensate/i.test(r)),
    ).toBe(true);
  });
});

describe("issue fingerprint and dedupe", () => {
  it("fingerprint is deterministic", () => {
    const a = computeIssueFingerprint({
      category: "ROUTE",
      title: "Missing route",
      affectedFiles: ["src/app/page.tsx", "src/app/layout.tsx"],
      affectedRoutes: ["/b", "/a"],
    });
    const b = computeIssueFingerprint({
      category: "ROUTE",
      title: "Missing route",
      affectedFiles: ["src/app/layout.tsx", "src/app/page.tsx"],
      affectedRoutes: ["/a", "/b"],
    });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("deduplicates by fingerprint keeping higher severity", () => {
    const fp = computeIssueFingerprint({
      category: "CONTENT",
      title: "Lorem ipsum",
      affectedFiles: ["src/app/page.tsx"],
    });
    const low = createQualityIssue({
      qualityRunId: "qr_test",
      category: "CONTENT",
      severity: "LOW",
      title: "Lorem ipsum",
      description: "short",
      affectedFiles: ["src/app/page.tsx"],
      fingerprint: fp,
      blocking: false,
    });
    const high = createQualityIssue({
      qualityRunId: "qr_test",
      category: "CONTENT",
      severity: "HIGH",
      title: "Lorem ipsum",
      description: "longer description of the same issue",
      affectedFiles: ["src/app/settings/page.tsx"],
      fingerprint: fp,
      blocking: false,
    });
    const merged = deduplicateIssues([low, high]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.severity).toBe("HIGH");
    expect(merged[0]!.affectedFiles).toContain("src/app/page.tsx");
    expect(merged[0]!.affectedFiles).toContain("src/app/settings/page.tsx");
  });
});

describe("prepareRepairStaging", () => {
  it("copies release into staging without modifying source", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p5-staging-"));
    const releaseDir = join(root, "release-app");
    const projectsRoot = join(root, "projects");
    await mkdir(join(releaseDir, "src"), { recursive: true });
    await writeFile(join(releaseDir, "package.json"), '{"name":"demo"}\n', "utf8");
    await writeFile(join(releaseDir, "src", "index.ts"), "export const n = 1;\n", "utf8");
    const sourceBefore = await readFile(join(releaseDir, "src", "index.ts"), "utf8");

    const { stagingAppDir } = await prepareRepairStaging({
      projectsRoot,
      slug: "acme-co",
      qualityRunId: "qr_stage01",
      sourceReleaseAppDir: releaseDir,
    });

    const staged = await readFile(join(stagingAppDir, "src", "index.ts"), "utf8");
    expect(staged).toBe(sourceBefore);
    expect(stagingAppDir).toContain(join("acme-co", "generated", "staging", "quality-qr_stage01", "app"));

    await writeFile(join(stagingAppDir, "src", "index.ts"), "export const n = 2;\n", "utf8");
    const sourceAfter = await readFile(join(releaseDir, "src", "index.ts"), "utf8");
    expect(sourceAfter).toBe(sourceBefore);
  });
});

describe("DeterministicRepairProvider", () => {
  it("fixes layout missing lang/dir on a staging copy", async () => {
    const root = await mkdtemp(join(tmpdir(), "machine-p5-repair-"));
    const stagingAppDir = join(root, "app");
    await mkdir(join(stagingAppDir, "src", "app"), { recursive: true });
    await writeFile(
      join(stagingAppDir, "src", "app", "layout.tsx"),
      `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
`,
      "utf8",
    );

    const blueprint = {
      company: {
        displayName: "Acme Co",
        language: "fa",
        rtl: true,
      },
    } as unknown as CompanyOSBlueprint;

    const plan: RepairPlan = {
      schemaVersion: "1.0",
      repairPlanId: "rp_test",
      qualityRunId: "qr_test",
      sourceGenerationId: "gen_test",
      issues: [],
      maximumAttempts: 1,
      generatedAt: nowIso(),
    };

    const provider = new DeterministicRepairProvider();
    const result = await provider.repair({
      stagingAppDir,
      plan,
      issues: [],
      blueprint,
    });

    expect(result.filesChanged).toContain("src/app/layout.tsx");
    const fixed = await readFile(join(stagingAppDir, "src", "app", "layout.tsx"), "utf8");
    expect(fixed).toMatch(/lang="fa"/);
    expect(fixed).toMatch(/dir="rtl"/);
  });
});

describe("health-probe", () => {
  it("probes a tiny local http server on 127.0.0.1", async () => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    });
    await new Promise<void>((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => resolve());
      server.once("error", reject);
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      server.close();
      throw new Error("expected TCP address");
    }
    try {
      const result = await probeHealth({
        port: addr.port,
        host: "127.0.0.1",
        timeoutMs: 2_000,
        retries: 2,
      });
      expect(result.ok).toBe(true);
      expect(result.statusCode).toBe(200);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe("runtime-cleanup", () => {
  it("kills a short-lived process tree", async () => {
    const child = spawn("/bin/sleep", ["30"], {
      shell: false,
      stdio: "ignore",
      detached: true,
    });
    const pid = child.pid;
    expect(pid).toBeTruthy();
    // Detach so we own the tree via killProcessTree
    child.unref();
    expect(isProcessRunning(pid!)).toBe(true);
    await killProcessTree(pid!);
    expect(isProcessRunning(pid!)).toBe(false);
  });
});

describe("formatQualityMessage", () => {
  it("includes not deployed", () => {
    const message = formatQualityMessage({
      companyDisplayName: "Acme Co",
      sourceGenerationId: "gen_abc",
      acceptedGenerationId: "gen_abc",
      baselineScore: 0.7,
      finalScore: 0.9,
      issuesFound: 2,
      issuesRepaired: 1,
      issuesRemaining: 1,
      typecheckOk: true,
      testsOk: true,
      buildOk: true,
      securityStatus: "passed",
      rtlStatus: "passed",
      accessibilityStatus: "partial",
      visualStatus: "skipped",
      accepted: true,
      language: "en",
    });
    expect(message).toMatch(/has not been deployed/i);
    expect(message).toMatch(/Application quality iteration completed/);
  });
});

describe("Brand hardcoding guard", () => {
  it("keeps production src free of Zar Macaron brand strings", () => {
    const out = execSync(
      "rg -n 'زر ماکارون|زرماکارون|Zar Macaron|ZarMacaron|zarmacaron\\.com' src || true",
      { encoding: "utf8", cwd: process.cwd() },
    );
    expect(out.trim()).toBe("");
  });
});

describe("Stub quality + stub generation /demo", () => {
  it("createStubQualityService exists and demo message includes quality completion", async () => {
    expect(typeof createStubQualityService).toBe("function");
    const stub = createStubQualityService();
    const stubResult = await stub.iterateFromExisting("Acme Co");
    expect(stubResult.message).toMatch(/quality iteration completed|quality completed/i);
    expect(stubResult.message).toMatch(/has not been deployed/i);

    const root = await mkdtemp(join(tmpdir(), "machine-p5-demo-"));
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
    expect(result.message).toMatch(/Application generated and build verified/);
    expect(result.message).toMatch(/quality iteration completed|quality completed|کیفیت/i);
    expect(result.message).toMatch(/has not been deployed|Deploy نشده/);
    expect(result.message).not.toMatch(/Deployment Complete|public URL: https?:\/\//i);
  });
});
