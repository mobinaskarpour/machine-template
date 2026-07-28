import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { SafeCommandRunner } from "../runners/safe-command-runner.js";
import { AppError } from "../shared/errors.js";
import { normalizeRoot } from "../security/paths.js";

const NPM_BIN = "/usr/bin/npm";

/**
 * Ensure a promoted release can actually start.
 *
 * Releases intentionally omit `node_modules` from the immutable copy (hash
 * excludes that tree). Production install into the release directory is
 * therefore a runtime preparation step — it does not rewrite source files
 * and does not change `hashDirectory` results.
 */
export async function ensureReleaseRuntimeInstalled(input: {
  releaseAppDir: string;
  runner: SafeCommandRunner;
  timeoutMs?: number;
}): Promise<{ installed: boolean }> {
  const appDir = normalizeRoot(input.releaseAppDir);
  const nextBin = join(appDir, "node_modules", "next", "package.json");
  try {
    await access(nextBin, constants.R_OK);
    return { installed: false };
  } catch {
    // need install
  }

  try {
    await input.runner.runExecutable({
      executable: NPM_BIN,
      args: ["ci", "--omit=dev", "--no-audit", "--no-fund"],
      cwd: appDir,
      timeoutMs: input.timeoutMs ?? 300_000,
      envAllowlist: ["PATH", "HOME", "LANG", "NODE_ENV", "npm_config_cache"],
    });
  } catch (error) {
    throw new AppError(
      "DEPLOYMENT_FAILED",
      "Failed to install production dependencies for release runtime",
      { cause: error, details: { releaseAppDir: appDir } },
    );
  }

  try {
    await access(nextBin, constants.R_OK);
  } catch (error) {
    throw new AppError(
      "DEPLOYMENT_FAILED",
      "Production install completed but next package is still missing",
      { cause: error },
    );
  }

  return { installed: true };
}
