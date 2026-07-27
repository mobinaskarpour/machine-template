import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { isAppError, AppError } from "../shared/errors.js";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { nowIso } from "../shared/ids.js";

const NPM_BIN = "/usr/bin/npm";

const ENV_ALLOWLIST = ["PATH", "HOME", "LANG", "NODE_ENV", "npm_config_cache"];

export type GeneratedAppBuildStep =
  | "install"
  | "typecheck"
  | "test"
  | "build";

export type GeneratedAppBuildReport = {
  steps: Array<{
    step: GeneratedAppBuildStep;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    exitCode: number;
  }>;
  finishedAt: string;
};

async function npmExists(): Promise<void> {
  try {
    await access(NPM_BIN, constants.X_OK);
  } catch (error) {
    throw new AppError("CONFIGURATION_ERROR", `npm not found at ${NPM_BIN}`, {
      cause: error,
    });
  }
}

async function withNodeEnv<T>(value: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = value;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

function mapStepError(step: GeneratedAppBuildStep, error: unknown): AppError {
  const code =
    step === "install"
      ? "GENERATION_INSTALL_FAILED"
      : step === "typecheck"
        ? "GENERATION_TYPECHECK_FAILED"
        : step === "test"
          ? "GENERATION_TEST_FAILED"
          : "GENERATION_BUILD_FAILED";
  if (isAppError(error) && error.code.startsWith("GENERATION_")) {
    return error;
  }
  return new AppError(code, `Generated app ${step} failed`, {
    cause: error,
    details: isAppError(error)
      ? { underlyingCode: error.code, ...(error.details ?? {}) }
      : undefined,
  });
}

export class GeneratedAppBuildService {
  constructor(private readonly runner: SafeCommandRunner) {}

  async install(stagingAppDir: string): Promise<void> {
    await npmExists();
    const lockfile = join(stagingAppDir, "package-lock.json");
    let hasLock = false;
    try {
      await access(lockfile, constants.F_OK);
      hasLock = true;
    } catch {
      hasLock = false;
    }

    try {
      await withNodeEnv("development", () =>
        this.runner.runExecutable({
          executable: NPM_BIN,
          args: hasLock ? ["ci", "--no-audit", "--no-fund"] : ["install", "--no-audit", "--no-fund"],
          cwd: stagingAppDir,
          timeoutMs: 600_000,
          envAllowlist: ENV_ALLOWLIST,
          maxStdoutBytes: 200_000,
          maxStderrBytes: 200_000,
        }),
      );
    } catch (error) {
      throw mapStepError("install", error);
    }
  }

  async typecheck(stagingAppDir: string): Promise<void> {
    await npmExists();
    try {
      await withNodeEnv("development", () =>
        this.runner.runExecutable({
          executable: NPM_BIN,
          args: ["run", "typecheck"],
          cwd: stagingAppDir,
          timeoutMs: 180_000,
          envAllowlist: ENV_ALLOWLIST,
          maxStdoutBytes: 200_000,
          maxStderrBytes: 200_000,
        }),
      );
    } catch (error) {
      throw mapStepError("typecheck", error);
    }
  }

  async test(stagingAppDir: string): Promise<void> {
    await npmExists();
    try {
      await withNodeEnv("development", () =>
        this.runner.runExecutable({
          executable: NPM_BIN,
          args: ["run", "test"],
          cwd: stagingAppDir,
          timeoutMs: 180_000,
          envAllowlist: ENV_ALLOWLIST,
          maxStdoutBytes: 200_000,
          maxStderrBytes: 200_000,
        }),
      );
    } catch (error) {
      throw mapStepError("test", error);
    }
  }

  async build(stagingAppDir: string): Promise<void> {
    await npmExists();
    try {
      await withNodeEnv("production", () =>
        this.runner.runExecutable({
          executable: NPM_BIN,
          args: ["run", "build"],
          cwd: stagingAppDir,
          timeoutMs: 600_000,
          envAllowlist: ENV_ALLOWLIST,
          maxStdoutBytes: 200_000,
          maxStderrBytes: 200_000,
        }),
      );
    } catch (error) {
      throw mapStepError("build", error);
    }
  }

  async runAll(stagingAppDir: string): Promise<GeneratedAppBuildReport> {
    const steps: GeneratedAppBuildReport["steps"] = [];
    const run = async (step: GeneratedAppBuildStep, fn: () => Promise<void>) => {
      const startedAt = nowIso();
      const t0 = Date.now();
      await fn();
      const finishedAt = nowIso();
      steps.push({
        step,
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
        exitCode: 0,
      });
    };

    await run("install", () => this.install(stagingAppDir));
    await run("typecheck", () => this.typecheck(stagingAppDir));
    await run("test", () => this.test(stagingAppDir));
    await run("build", () => this.build(stagingAppDir));

    return { steps, finishedAt: nowIso() };
  }
}
