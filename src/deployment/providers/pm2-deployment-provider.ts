import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { SafeCommandRunner } from "../../runners/safe-command-runner.js";
import { AppError, isAppError } from "../../shared/errors.js";
import { writeJsonAtomic } from "../../persistence/atomic.js";
import type {
  DeploymentProvider,
  DeploymentProviderLogs,
  DeploymentProviderStartInput,
  DeploymentProviderStatus,
} from "./deployment-provider.js";

const ENV_ALLOWLIST = ["PATH", "HOME", "LANG", "NODE_ENV"];

/**
 * Resolve an absolute path to the pm2 CLI executable without ever spawning a
 * shell or trusting user-controlled text: prefer the pm2 package's declared
 * bin (via createRequire), then the local node_modules/.bin symlink, then a
 * system install.
 */
export function resolvePm2Bin(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkgJsonPath = require.resolve("pm2/package.json");
    const pkg = require(pkgJsonPath) as { bin?: Record<string, string> | string };
    const pkgDir = dirname(pkgJsonPath);
    if (typeof pkg.bin === "string") {
      const candidate = resolve(pkgDir, pkg.bin);
      if (existsSync(candidate)) return candidate;
    } else if (pkg.bin && typeof pkg.bin === "object") {
      const relPath = pkg.bin.pm2 ?? Object.values(pkg.bin)[0];
      if (relPath) {
        const candidate = resolve(pkgDir, relPath);
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch {
    // fall through to filesystem-based fallbacks below
  }
  const localBin = resolve(process.cwd(), "node_modules", ".bin", "pm2");
  if (existsSync(localBin)) return localBin;
  if (existsSync("/usr/bin/pm2")) return "/usr/bin/pm2";
  throw new AppError("PM2_NOT_AVAILABLE", "pm2 executable could not be resolved");
}

type Pm2JlistEntry = {
  name: string;
  pid?: number;
  pm2_env?: { status?: string; restart_time?: number; pm_uptime?: number };
};

function mapJlistEntry(entry: Pm2JlistEntry): DeploymentProviderStatus {
  const statusRaw = entry.pm2_env?.status ?? "unknown";
  const status: DeploymentProviderStatus["status"] =
    statusRaw === "online"
      ? "online"
      : statusRaw === "stopped"
        ? "stopped"
        : statusRaw === "errored"
          ? "errored"
          : "unknown";
  return {
    name: entry.name,
    status,
    pid: entry.pid,
    restarts: entry.pm2_env?.restart_time ?? 0,
    uptimeMs: entry.pm2_env?.pm_uptime ? Date.now() - entry.pm2_env.pm_uptime : undefined,
  };
}

/**
 * pm2-backed DeploymentProvider. Every pm2 invocation goes through
 * SafeCommandRunner (no shell); app configuration is passed via a temporary
 * JSON ecosystem file we write ourselves (never user-supplied text), which is
 * deleted immediately after the start command completes.
 */
export class Pm2DeploymentProvider implements DeploymentProvider {
  private readonly pm2Bin: string;

  constructor(
    private readonly runner: SafeCommandRunner,
    private readonly cwd: string,
    pm2BinOverride?: string,
  ) {
    this.pm2Bin = pm2BinOverride ?? resolvePm2Bin();
  }

  private async run(args: string[], timeoutMs = 60_000): Promise<string> {
    try {
      const result = await this.runner.runExecutable({
        executable: this.pm2Bin,
        args,
        cwd: this.cwd,
        timeoutMs,
        envAllowlist: ENV_ALLOWLIST,
        maxStdoutBytes: 500_000,
        maxStderrBytes: 200_000,
      });
      return result.stdout;
    } catch (error) {
      if (isAppError(error) && error.code === "COMMAND_SPAWN_FAILED") {
        throw new AppError("PM2_NOT_AVAILABLE", "pm2 executable failed to start", {
          cause: error,
        });
      }
      throw new AppError("PM2_PROCESS_FAILED", `pm2 ${args[0] ?? ""} failed`, { cause: error });
    }
  }

  async start(input: DeploymentProviderStartInput): Promise<DeploymentProviderStatus> {
    const workDir = await mkdtemp(join(tmpdir(), "machine-pm2-"));
    const ecosystemPath = join(workDir, "ecosystem.json");
    try {
      await writeJsonAtomic(ecosystemPath, {
        apps: [
          {
            name: input.processName,
            script: "npm",
            args: ["run", "start", "--", "-H", "127.0.0.1", "-p", String(input.port)],
            cwd: input.appDir,
            env: input.env,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            kill_timeout: 5000,
          },
        ],
      });
      await this.run(["start", ecosystemPath]);
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
    const status = await this.describe(input.processName);
    if (!status) {
      throw new AppError(
        "PM2_PROCESS_FAILED",
        `pm2 did not report status for ${input.processName} after start`,
      );
    }
    return status;
  }

  async stop(processName: string): Promise<void> {
    await this.run(["stop", processName]);
  }

  async restart(processName: string): Promise<DeploymentProviderStatus> {
    await this.run(["restart", processName]);
    const status = await this.describe(processName);
    if (!status) {
      throw new AppError(
        "PM2_PROCESS_FAILED",
        `pm2 did not report status for ${processName} after restart`,
      );
    }
    return status;
  }

  async delete(processName: string): Promise<void> {
    await this.run(["delete", processName]).catch(() => undefined);
  }

  async describe(processName: string): Promise<DeploymentProviderStatus | null> {
    const raw = await this.run(["jlist"]);
    let list: Pm2JlistEntry[];
    try {
      list = JSON.parse(raw) as Pm2JlistEntry[];
    } catch (error) {
      throw new AppError("PM2_PROCESS_FAILED", "Failed to parse pm2 jlist output", {
        cause: error,
      });
    }
    const entry = list.find((e) => e.name === processName);
    return entry ? mapJlistEntry(entry) : null;
  }

  async logs(processName: string, lines: number): Promise<DeploymentProviderLogs> {
    const raw = await this.run(
      ["logs", processName, "--lines", String(lines), "--nostream", "--raw"],
      20_000,
    );
    const rows = raw.split("\n").filter((row) => row.length > 0);
    return { out: rows, err: [] };
  }
}
