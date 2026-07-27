import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { AppError } from "../shared/errors.js";
import { normalizeRoot } from "../security/paths.js";

const BASH_ABSOLUTE = "/bin/bash";

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  executable: string;
  args: string[];
};

export type RunExecutableInput = {
  executable: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
  envAllowlist: string[];
  maxStdoutBytes?: number;
  maxStderrBytes?: number;
};

export type RunBashLcInput = {
  command: string;
  cwd: string;
  timeoutMs: number;
  envAllowlist: string[];
  maxStdoutBytes?: number;
  maxStderrBytes?: number;
};

function buildEnv(allowlist: string[]): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    PATH: "/usr/bin:/bin",
    LANG: process.env.LANG ?? "C.UTF-8",
    HOME: process.env.HOME,
  };
  for (const key of allowlist) {
    if (key === "TELEGRAM_BOT_TOKEN" || key.includes("SECRET") || key.includes("TOKEN") || key.includes("API_KEY")) {
      // Never copy secrets into child env unless explicitly required later.
      continue;
    }
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }
  return env;
}

async function assertCwd(cwd: string): Promise<string> {
  const normalized = normalizeRoot(cwd);
  try {
    await access(normalized, constants.F_OK);
  } catch (error) {
    throw new AppError("VALIDATION_ERROR", `cwd does not exist: ${normalized}`, {
      cause: error,
    });
  }
  return normalized;
}

function runSpawn(input: {
  executable: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
  env: NodeJS.ProcessEnv;
  maxStdoutBytes: number;
  maxStderrBytes: number;
}): Promise<RunResult> {
  return new Promise((resolvePromise, reject) => {
    let child;
    try {
      child = spawn(input.executable, input.args, {
        cwd: input.cwd,
        env: input.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      reject(
        new AppError("COMMAND_SPAWN_FAILED", `Failed to spawn ${input.executable}`, {
          cause: error,
          details: { executable: input.executable, args: input.args },
        }),
      );
      return;
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutSize = 0;
    let stderrSize = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, input.timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdoutSize >= input.maxStdoutBytes) {
        stdoutTruncated = true;
        return;
      }
      const remaining = input.maxStdoutBytes - stdoutSize;
      const slice = chunk.subarray(0, remaining);
      stdoutChunks.push(slice);
      stdoutSize += slice.length;
      if (chunk.length > remaining) stdoutTruncated = true;
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderrSize >= input.maxStderrBytes) {
        stderrTruncated = true;
        return;
      }
      const remaining = input.maxStderrBytes - stderrSize;
      const slice = chunk.subarray(0, remaining);
      stderrChunks.push(slice);
      stderrSize += slice.length;
      if (chunk.length > remaining) stderrTruncated = true;
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new AppError("COMMAND_SPAWN_FAILED", `Spawn error for ${input.executable}`, {
          cause: error,
          details: { executable: input.executable },
        }),
      );
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      let stdout = Buffer.concat(stdoutChunks).toString("utf8");
      let stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (stdoutTruncated) stdout += "\n…[truncated]";
      if (stderrTruncated) stderr += "\n…[truncated]";
      const result: RunResult = {
        stdout,
        stderr,
        exitCode: code,
        signal,
        timedOut,
        executable: input.executable,
        args: input.args,
      };

      if (timedOut) {
        reject(
          new AppError("COMMAND_TIMEOUT", `Command timed out after ${input.timeoutMs}ms`, {
            details: result as unknown as Record<string, unknown>,
          }),
        );
        return;
      }
      if (signal) {
        reject(
          new AppError("COMMAND_SIGNAL", `Command terminated by signal ${signal}`, {
            details: result as unknown as Record<string, unknown>,
          }),
        );
        return;
      }
      if (code !== 0) {
        reject(
          new AppError(
            "COMMAND_EXIT_NON_ZERO",
            `Command exited with code ${code}`,
            { details: result as unknown as Record<string, unknown> },
          ),
        );
        return;
      }
      resolvePromise(result);
    });
  });
}

export class SafeCommandRunner {
  async runExecutable(input: RunExecutableInput): Promise<RunResult> {
    if (!input.executable.startsWith("/")) {
      throw new AppError(
        "VALIDATION_ERROR",
        "executable must be an absolute path",
        { details: { executable: input.executable } },
      );
    }
    if (
      input.executable === "bash" ||
      (input.executable.endsWith("/bash") && input.executable !== BASH_ABSOLUTE)
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Use runBashLc for bash; never spawn bare 'bash'",
      );
    }
    const cwd = await assertCwd(input.cwd);
    return runSpawn({
      executable: input.executable,
      args: input.args,
      cwd,
      timeoutMs: input.timeoutMs,
      env: buildEnv(input.envAllowlist),
      maxStdoutBytes: input.maxStdoutBytes ?? 64_000,
      maxStderrBytes: input.maxStderrBytes ?? 64_000,
    });
  }

  async runBashLc(input: RunBashLcInput): Promise<RunResult> {
    const cwd = await assertCwd(input.cwd);
    return runSpawn({
      executable: BASH_ABSOLUTE,
      args: ["-lc", input.command],
      cwd,
      timeoutMs: input.timeoutMs,
      env: buildEnv(input.envAllowlist),
      maxStdoutBytes: input.maxStdoutBytes ?? 64_000,
      maxStderrBytes: input.maxStderrBytes ?? 64_000,
    });
  }
}

export const BASH_PATH = BASH_ABSOLUTE;
