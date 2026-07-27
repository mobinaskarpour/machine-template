import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { AppError } from "../../shared/errors.js";
import type { SafeCommandRunner } from "../../runners/safe-command-runner.js";
import type {
  CodeGenerationProvider,
  CodeGenerationResult,
} from "./code-generation-provider.js";

export async function isCodexGenerationAvailable(
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
 * Optional Codex CLI generation provider.
 * Phase 4 default path uses DeterministicTemplateProvider.
 *
 * When enableCodex is false (default), generate() throws CODEX_NOT_AVAILABLE.
 * When enabled but Codex is missing, throws CODEX_NOT_AVAILABLE.
 * When enabled and available, currently returns empty filesWritten with a note
 * that scoped Codex codegen is not the default Phase 4 path (safe no-op stub
 * that refuses to write outside staging by never writing).
 */
export class CodexCliGenerationProvider implements CodeGenerationProvider {
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

  async generate(input: {
    generationPlan: import("../generation-plan-schema.js").GenerationPlan;
    blueprint: import("../../blueprints/company-os-blueprint-schema.js").CompanyOSBlueprint;
    stagingDirectory: string;
  }): Promise<CodeGenerationResult> {
    void this.runner;
    void input;

    if (!this.options.enableCodex) {
      throw new AppError(
        "CODEX_NOT_AVAILABLE",
        "Codex generation is disabled; use DETERMINISTIC_TEMPLATE (Phase 4 default)",
        { details: { providerId: this.providerId } },
      );
    }

    const available = await isCodexGenerationAvailable(this.options.codexPath);
    if (!available) {
      throw new AppError(
        "CODEX_NOT_AVAILABLE",
        "Codex CLI is not available for application generation",
      );
    }

    // Safe stub: refuse unconstrained writes. Orchestrator should rely on
    // DeterministicTemplateProvider for Phase 4 success path.
    return {
      filesWritten: [],
      providerId: this.providerId,
      notes:
        "Codex generation enabled but deferred; deterministic provider remains the Phase 4 default",
    };
  }
}
