import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { AppError } from "../../../shared/errors.js";
import type { SafeCommandRunner } from "../../../runners/safe-command-runner.js";
import type {
  RepairProvider,
  RepairProviderInput,
  RepairProviderResult,
} from "./repair-provider.js";

export async function isCodexRepairAvailable(
  codexPath?: string,
): Promise<boolean> {
  const candidates = [
    codexPath,
    process.env.CODEX_BIN,
    "/usr/local/bin/codex",
    "/usr/bin/codex",
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

/**
 * Optional Codex CLI repair provider (stub-ready, gated like generation).
 */
export class CodexCliRepairProvider implements RepairProvider {
  readonly providerId = "CODEX_CLI";

  constructor(
    private readonly runner: SafeCommandRunner,
    private readonly options: {
      enableCodex?: boolean;
      model?: string;
      timeoutMs?: number;
      codexPath?: string;
    } = {},
  ) {}

  async repair(input: RepairProviderInput): Promise<RepairProviderResult> {
    void this.runner;
    void input;

    if (!this.options.enableCodex) {
      throw new AppError(
        "CODEX_NOT_AVAILABLE",
        "Codex repair is disabled; use DETERMINISTIC repairs (Phase 5 default)",
        { details: { providerId: this.providerId } },
      );
    }

    const available = await isCodexRepairAvailable(this.options.codexPath);
    if (!available) {
      throw new AppError(
        "CODEX_NOT_AVAILABLE",
        "Codex CLI is not available for quality repair",
      );
    }

    // Safe stub: refuse unconstrained writes until a scoped Codex repair path exists.
    throw new AppError(
      "QUALITY_REPAIR_FAILED",
      "Codex repair is enabled but not implemented for unconstrained writes",
      { details: { providerId: this.providerId } },
    );
  }
}
