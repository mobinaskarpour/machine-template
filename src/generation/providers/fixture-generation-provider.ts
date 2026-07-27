import type {
  CodeGenerationProvider,
  CodeGenerationResult,
} from "./code-generation-provider.js";
import { DeterministicTemplateProvider } from "./deterministic-template-provider.js";

/**
 * Thin fixture wrapper around the deterministic provider for tests.
 */
export class FixtureGenerationProvider implements CodeGenerationProvider {
  readonly providerId = "FIXTURE";

  constructor(
    private readonly inner: DeterministicTemplateProvider = new DeterministicTemplateProvider(),
  ) {}

  async generate(input: {
    generationPlan: import("../generation-plan-schema.js").GenerationPlan;
    blueprint: import("../../blueprints/company-os-blueprint-schema.js").CompanyOSBlueprint;
    stagingDirectory: string;
  }): Promise<CodeGenerationResult> {
    const result = await this.inner.generate(input);
    return {
      ...result,
      providerId: this.providerId,
      notes: result.notes
        ? `${result.notes} (fixture wrapper)`
        : "Fixture provider delegated to deterministic template provider",
    };
  }
}
