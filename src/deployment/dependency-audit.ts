import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { AppError, isAppError } from "../shared/errors.js";

const NPM_BIN = "/usr/bin/npm";
const ENV_ALLOWLIST = ["PATH", "HOME", "LANG"];

export type AdvisorySummary = {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
  total: number;
  packages: Array<{ name: string; severity: string; via: string[] }>;
};

function coerceVia(via: unknown): string[] {
  if (!Array.isArray(via)) return [];
  return via.map((entry) => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      const obj = entry as { title?: string; name?: string; source?: unknown };
      return String(obj.title ?? obj.name ?? "advisory");
    }
    return "advisory";
  });
}

function parseAuditJson(stdout: string): AdvisorySummary {
  let data: unknown;
  try {
    data = JSON.parse(stdout);
  } catch (error) {
    throw new AppError("PREDEPLOY_DEPENDENCY_BLOCKER", "Failed to parse npm audit output", {
      cause: error,
    });
  }
  const root = data as {
    metadata?: { vulnerabilities?: Record<string, number> };
    vulnerabilities?: Record<string, { severity?: string; via?: unknown }>;
  };
  const meta = root.metadata?.vulnerabilities ?? {};
  const vulnerabilities = root.vulnerabilities ?? {};
  const packages = Object.entries(vulnerabilities).map(([name, value]) => ({
    name,
    severity: String(value?.severity ?? "unknown"),
    via: coerceVia(value?.via),
  }));
  return {
    critical: Number(meta.critical ?? 0),
    high: Number(meta.high ?? 0),
    moderate: Number(meta.moderate ?? 0),
    low: Number(meta.low ?? 0),
    info: Number(meta.info ?? 0),
    total: Number(meta.total ?? packages.length),
    packages,
  };
}

/**
 * Run `npm audit --omit=dev --json` against a release directory's own
 * package-lock.json. Never prints raw stdout/stderr — only parsed, structured
 * counts and package names are returned.
 */
export async function runProductionNpmAudit(
  appDir: string,
  runner: SafeCommandRunner,
): Promise<AdvisorySummary> {
  try {
    const result = await runner.runExecutable({
      executable: NPM_BIN,
      args: ["audit", "--omit=dev", "--json"],
      cwd: appDir,
      timeoutMs: 120_000,
      envAllowlist: ENV_ALLOWLIST,
      maxStdoutBytes: 2_000_000,
      maxStderrBytes: 200_000,
    });
    return parseAuditJson(result.stdout);
  } catch (error) {
    // npm audit exits non-zero when advisories are found; the JSON body is
    // still present on stdout inside the command-failure details.
    if (isAppError(error) && error.code === "COMMAND_EXIT_NON_ZERO") {
      const details = error.details as { stdout?: string } | undefined;
      if (details?.stdout) {
        try {
          return parseAuditJson(details.stdout);
        } catch {
          // fall through to hard failure below
        }
      }
    }
    throw new AppError("PREDEPLOY_DEPENDENCY_BLOCKER", "npm audit failed to run", {
      cause: error,
    });
  }
}
