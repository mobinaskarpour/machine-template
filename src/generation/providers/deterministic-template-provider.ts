import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeJsonAtomic } from "../../persistence/atomic.js";
import { assertInsideRoot, normalizeRoot } from "../../security/paths.js";
import { AppError } from "../../shared/errors.js";
import { hashBuffer } from "../generation-types.js";
import { renderBlueprintRuntime } from "../renderers/runtime-renderer.js";
import { generateMockDataBundle } from "../renderers/mock-data-renderer.js";
import type {
  CodeGenerationProvider,
  CodeGenerationResult,
} from "./code-generation-provider.js";

function assertStagingFile(stagingDirectory: string, relativePath: string): string {
  const root = normalizeRoot(stagingDirectory);
  const full = join(root, ...relativePath.split("/"));
  return assertInsideRoot(root, full);
}

async function patchGlobalsCss(path: string, brand: string, foreground: string, muted: string): Promise<void> {
  let css = await readFile(path, "utf8");
  css = css
    .replace(/--brand:\s*#[0-9a-fA-F]{3,8};/, `--brand: ${brand};`)
    .replace(
      /--brand-foreground:\s*#[0-9a-fA-F]{3,8};/,
      `--brand-foreground: ${foreground};`,
    )
    .replace(/--brand-muted:\s*#[0-9a-fA-F]{3,8};/, `--brand-muted: ${muted};`);
  await writeFile(path, css, "utf8");
}

/**
 * Deterministic provider: assumes template already copied into staging.
 * Writes blueprint-runtime.json, mock-data.json, optional brand CSS, README.
 */
export class DeterministicTemplateProvider implements CodeGenerationProvider {
  readonly providerId = "DETERMINISTIC_TEMPLATE";

  async generate(input: {
    generationPlan: import("../generation-plan-schema.js").GenerationPlan;
    blueprint: import("../../blueprints/company-os-blueprint-schema.js").CompanyOSBlueprint;
    stagingDirectory: string;
  }): Promise<CodeGenerationResult> {
    const staging = normalizeRoot(input.stagingDirectory);
    const filesWritten: string[] = [];

    const runtime = renderBlueprintRuntime(input.blueprint);
    const runtimePath = assertStagingFile(staging, "src/data/blueprint-runtime.json");
    await writeJsonAtomic(runtimePath, runtime);
    filesWritten.push("src/data/blueprint-runtime.json");

    const seed = hashBuffer(
      `${input.generationPlan.generationId}:${input.generationPlan.sourceHashes.companyOSBlueprintHash}:${input.blueprint.company.slug}`,
    ).slice(0, 24);
    const mock = generateMockDataBundle(input.blueprint, seed);
    const mockPath = assertStagingFile(staging, "src/data/mock-data.json");
    await writeJsonAtomic(mockPath, mock);
    filesWritten.push("src/data/mock-data.json");

    const cssPath = assertStagingFile(staging, "src/app/globals.css");
    try {
      await patchGlobalsCss(
        cssPath,
        runtime.brandCssVars.brand,
        runtime.brandCssVars.brandForeground,
        runtime.brandCssVars.brandMuted,
      );
      filesWritten.push("src/app/globals.css");
    } catch (error) {
      throw new AppError(
        "GENERATION_VALIDATION_FAILED",
        "Failed to patch globals.css brand variables",
        { cause: error },
      );
    }

    const readmePath = assertStagingFile(staging, "README.md");
    const readme = [
      `# ${input.blueprint.company.displayName} Company OS`,
      "",
      `Generated deterministically for \`${input.blueprint.company.slug}\`.`,
      "Demo access and role simulation only — not production authentication.",
      "",
      `Generation id: ${input.generationPlan.generationId}`,
      `Provider: ${this.providerId}`,
      "",
    ].join("\n");
    await writeFile(readmePath, readme, "utf8");
    filesWritten.push("README.md");

    return {
      filesWritten,
      providerId: this.providerId,
      notes: "Deterministic template configuration complete",
    };
  }
}
