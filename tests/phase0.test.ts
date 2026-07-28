import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSlug, assertSafeSlug } from "../src/registry/slug.js";
import { resolveUnderRoot } from "../src/security/paths.js";
import { AppError } from "../src/shared/errors.js";
import { FsCompanyRepository } from "../src/persistence/fs-company-repository.js";
import { FsProjectRepository } from "../src/persistence/fs-project-repository.js";
import { FsJobRepository } from "../src/persistence/fs-job-repository.js";
import { WorkspaceManager } from "../src/workspaces/workspace-manager.js";
import { CompanyRegistry } from "../src/registry/company-registry.js";
import { JobManager } from "../src/jobs/job-manager.js";
import { parseCommand } from "../src/commands/parse.js";
import { executeCommand } from "../src/commands/execute.js";
import { createLogger } from "../src/logging/logger.js";
import { SafeCommandRunner, BASH_PATH } from "../src/runners/safe-command-runner.js";
import { writeJsonAtomic, readJsonFile } from "../src/persistence/atomic.js";
import { parseCompanyRecord } from "../src/shared/schemas.js";
import { loadConfig } from "../src/config/env.js";
import { nowIso, newId } from "../src/shared/ids.js";
import { redactSecrets } from "../src/security/redact.js";

async function tempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "machine-phase0-"));
}

describe("slug service", () => {
  it("creates filesystem-safe slugs for latin names", () => {
    expect(createSlug("Acme Corp!")).toBe("acme-corp");
  });

  it("supports Persian company names with transliteration", () => {
    const slug = createSlug("ایران فریمکو");
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(slug.includes("..") || slug.includes("/") || slug.includes("\\")).toBe(
      false,
    );
    // Either transliterated latin segments or stable company-<hash> fallback
    expect(/[a-z0-9]/.test(slug)).toBe(true);
  });

  it("falls back to stable hash when no latin characters remain", () => {
    const slug = createSlug("。。。");
    expect(slug.startsWith("company-")).toBe(true);
  });

  it("resolves collisions deterministically", () => {
    const a = createSlug("Acme", { taken: ["acme"] });
    const b = createSlug("Acme", { taken: ["acme"] });
    expect(a).toBe(b);
    expect(a).not.toBe("acme");
  });

  it("rejects unsafe slug assertion", () => {
    expect(() => assertSafeSlug("../etc")).toThrow(AppError);
    expect(() => assertSafeSlug("")).toThrow(AppError);
  });
});

describe("path safety", () => {
  it("rejects path traversal", () => {
    const root = "/tmp/machine-root-test";
    expect(() => resolveUnderRoot(root, "..", "etc")).toThrow(AppError);
    expect(() => resolveUnderRoot(root, "ok", "..", "..", "etc")).toThrow(AppError);
  });

  it("allows nested safe paths", () => {
    const root = "/tmp/machine-root-test";
    const resolved = resolveUnderRoot(root, "acme", "source");
    expect(resolved.startsWith(root)).toBe(true);
  });
});

describe("persistence and registry", () => {
  let root: string;

  beforeEach(async () => {
    root = await tempRoot();
  });

  it("creates company, reopens workspace, resolves duplicates by name", async () => {
    const companies = new FsCompanyRepository(join(root, "companies"));
    const projects = new FsProjectRepository(join(root, "projects-meta"));
    const workspaces = new WorkspaceManager(join(root, "projects"));
    const registry = new CompanyRegistry(companies, projects, workspaces);

    const first = await registry.resolveByName("FrameCo");
    expect(first.workspaceCreated).toBe(true);
    expect(first.company.slug).toBe("frameco");

    const second = await registry.resolveByName("FrameCo");
    expect(second.company.id).toBe(first.company.id);
    expect(second.workspaceCreated).toBe(false);

    const listed = await companies.list();
    expect(listed).toHaveLength(1);
  });

  it("atomic persistence round-trips JSON", async () => {
    const file = join(root, "x.json");
    await writeJsonAtomic(file, { ok: true, n: 1 });
    const raw = await readJsonFile(file);
    expect(raw).toEqual({ ok: true, n: 1 });
  });

  it("rejects invalid persisted company JSON", async () => {
    const dir = join(root, "companies");
    await mkdir(dir, { recursive: true });
    const id = "bad";
    await writeFile(join(dir, `${id}.json`), "{not-json", "utf8");
    const repo = new FsCompanyRepository(dir);
    await expect(repo.getById(id)).rejects.toBeInstanceOf(AppError);
  });

  it("validates company schema", () => {
    expect(() =>
      parseCompanyRecord({
        id: "x",
        slug: "x",
        displayName: "X",
        aliases: [],
        status: "NOPE",
        workspacePath: "/tmp",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    ).toThrow(AppError);
  });
});

describe("job manager", () => {
  it("allows valid transitions and rejects invalid ones", async () => {
    const root = await tempRoot();
    const jobs = new FsJobRepository(join(root, "jobs"));
    const manager = new JobManager(jobs, createLogger({ level: "silent" }));
    const job = await manager.create({
      type: "DEMO",
      input: {},
    });
    expect(job.status).toBe("QUEUED");
    await manager.transition(job.id, "RUNNING");
    await expect(manager.transition(job.id, "QUEUED")).rejects.toBeInstanceOf(
      AppError,
    );
    const done = await manager.succeed(job.id, { ok: true });
    expect(done.status).toBe("SUCCEEDED");
    expect(done.progress).toBe(100);
  });
});

describe("command parsing", () => {
  it("parses demo with Persian name and extra whitespace", () => {
    const parsed = parseCommand("  /demo   ایران فریمکو  ");
    expect(parsed).toEqual({ kind: "demo", companyName: "ایران فریمکو" });
  });

  it("parses edit and ops with colon delimiter", () => {
    expect(parseCommand("/edit Acme: add dashboard")).toEqual({
      kind: "edit",
      companyName: "Acme",
      request: "add dashboard",
    });
    expect(parseCommand("/ops Acme: status")).toEqual({
      kind: "ops",
      companyName: "Acme",
      action: "status",
    });
  });

  it("rejects malformed delimiters and empty names", () => {
    expect(() => parseCommand("/edit : foo")).toThrow(AppError);
    expect(() => parseCommand("/demo")).toThrow(AppError);
    expect(() => parseCommand("/ops Acme: reboot")).toThrow(AppError);
  });

  it("parses status for job ids and company names", () => {
    const job = parseCommand("/status job_11111111-1111-1111-1111-111111111111");
    expect(job.kind).toBe("status");
    if (job.kind === "status") expect(job.targetType).toBe("job");
    const company = parseCommand("/status Acme Corp");
    expect(company.kind).toBe("status");
    if (company.kind === "status") expect(company.targetType).toBe("company");
  });
});

describe("command handlers", () => {
  async function ctx(root: string) {
    const { loadConfig } = await import("../src/config/env.js");
    const { createAppServices } = await import("../src/app/create-app.js");
    const { DeterministicKnowledgeSynthesisProvider } = await import(
      "../src/discovery/providers/deterministic-synthesis.js"
    );
    const config = loadConfig(
      {
        DATA_ROOT: root,
        PROJECTS_ROOT: `${root}/projects`,
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
      },
      { cwd: root, requireTelegramToken: false },
    );
    const services = await createAppServices(config, createLogger({ level: "silent" }), {
      synthesis: new DeterministicKnowledgeSynthesisProvider(),
      fetcher: {
        async fetchPage() {
          throw new (await import("../src/shared/errors.js")).AppError(
            "DISCOVERY_FETCH_FAILED",
            "phase0 fixture fetch disabled",
          );
        },
      },
    });
    return services.commandContext;
  }

  it("runs /demo and requests website when no search provider", async () => {
    const root = await tempRoot();
    const context = await ctx(root);
    const result = await executeCommand(
      { kind: "demo", companyName: "ایران فریمکو" },
      context,
    );
    expect(result.ok).toBe(false);
    expect(result.message.toLowerCase()).not.toContain("build successful");
    expect(result.jobId).toBeTruthy();
  });

  it("marks /edit as FAILED with NOT_IMPLEMENTED", async () => {
    const root = await tempRoot();
    const context = await ctx(root);
    const result = await executeCommand(
      { kind: "edit", companyName: "Acme", request: "change color" },
      context,
    );
    expect(result.ok).toBe(false);
    const job = await context.jobs.require(result.jobId!);
    expect(job.status).toBe("FAILED");
    expect(job.error?.code).toBe("NOT_IMPLEMENTED");
  });

  it("ops allowlist: deployment actions report cleanly for a never-deployed company", async () => {
    const root = await tempRoot();
    const context = await ctx(root);
    // create company via edit path resolve
    await executeCommand(
      { kind: "edit", companyName: "Acme", request: "noop" },
      context,
    );

    // "status" and "logs" are implemented (Phase 6), but Acme has never been
    // deployed, so both report a clean "no deployment" failure rather than
    // throwing or hanging.
    const status = await executeCommand(
      { kind: "ops", companyName: "Acme", action: "status" },
      context,
    );
    expect(status.ok).toBe(false);
    expect(status.message.toLowerCase()).toContain("deployment");

    const logs = await executeCommand(
      { kind: "ops", companyName: "Acme", action: "logs" },
      context,
    );
    expect(logs.ok).toBe(false);
    expect(logs.message.toLowerCase()).toContain("deployment");

    // Deferred actions (ssl/domain/deploy) are recognized but never allowed from chat.
    await expect(
      executeCommand({ kind: "ops", companyName: "Acme", action: "ssl" }, context),
    ).rejects.toThrow(AppError);
  });
});

describe("safe command runner", () => {
  it("uses absolute /bin/bash for runBashLc", async () => {
    const runner = new SafeCommandRunner();
    const result = await runner.runBashLc({
      command: "echo test",
      cwd: process.cwd(),
      timeoutMs: 5_000,
      envAllowlist: [],
    });
    expect(result.executable).toBe(BASH_PATH);
    expect(result.executable).toBe("/bin/bash");
    expect(result.stdout.trim()).toBe("test");
  });

  it("handles non-zero exit", async () => {
    const runner = new SafeCommandRunner();
    await expect(
      runner.runBashLc({
        command: "exit 7",
        cwd: process.cwd(),
        timeoutMs: 5_000,
        envAllowlist: [],
      }),
    ).rejects.toMatchObject({ code: "COMMAND_EXIT_NON_ZERO" });
  });

  it("handles timeout and kills child", async () => {
    const runner = new SafeCommandRunner();
    await expect(
      runner.runBashLc({
        command: "sleep 5",
        cwd: process.cwd(),
        timeoutMs: 200,
        envAllowlist: [],
      }),
    ).rejects.toMatchObject({ code: "COMMAND_TIMEOUT" });
  });

  it("handles spawn failure for missing executable", async () => {
    const runner = new SafeCommandRunner();
    await expect(
      runner.runExecutable({
        executable: "/nonexistent/bin/thing",
        args: [],
        cwd: process.cwd(),
        timeoutMs: 2_000,
        envAllowlist: [],
      }),
    ).rejects.toMatchObject({ code: "COMMAND_SPAWN_FAILED" });
  });

  it("limits stdout size", async () => {
    const runner = new SafeCommandRunner();
    const result = await runner.runBashLc({
      command: "python3 -c \"print('x'*10000)\"",
      cwd: process.cwd(),
      timeoutMs: 5_000,
      envAllowlist: [],
      maxStdoutBytes: 100,
    });
    expect(result.stdout.includes("[truncated]")).toBe(true);
    expect(Buffer.byteLength(result.stdout, "utf8")).toBeLessThan(200);
  });

  it("rejects bare bash executable", async () => {
    const runner = new SafeCommandRunner();
    await expect(
      runner.runExecutable({
        executable: "bash",
        args: ["-lc", "echo hi"],
        cwd: process.cwd(),
        timeoutMs: 2_000,
        envAllowlist: [],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("config and redaction", () => {
  it("loads injectable config without production .env", () => {
    const cfg = loadConfig(
      {
        TELEGRAM_BOT_TOKEN: "123456789:AADummyTokenForTestsOnly_xxxxxxxx",
        DATA_ROOT: "./data",
        PROJECTS_ROOT: "./data/projects",
        LOG_LEVEL: "silent",
        NODE_ENV: "test",
      },
      { cwd: "/tmp", requireTelegramToken: true },
    );
    expect(cfg.dataRoot).toBe("/tmp/data");
    expect(cfg.projectsRoot).toBe("/tmp/data/projects");
  });

  it("fails clearly when token missing", () => {
    expect(() =>
      loadConfig(
        { TELEGRAM_BOT_TOKEN: "", DATA_ROOT: "./data" },
        { requireTelegramToken: true },
      ),
    ).toThrow(AppError);
  });

  it("redacts telegram and github token patterns", () => {
    const sample =
      "token 123456789:AAExampleTelegramBotTokenValue_xxxxx and ghp_ExampleGitHubPatValue0000000000";
    const redacted = redactSecrets(sample);
    expect(redacted).not.toContain("AAExampleTelegramBotTokenValue_xxxxx");
    expect(redacted).not.toContain("ghp_ExampleGitHubPatValue0000000000");
    expect(redacted).toContain("REDACTED");
  });
});

describe("ids", () => {
  it("creates prefixed ids", () => {
    expect(newId("job").startsWith("job_")).toBe(true);
  });
});
