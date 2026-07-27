import type { CompanyOSBlueprint } from "../../blueprints/company-os-blueprint-schema.js";
import type { GenerationPlan } from "../generation-plan-schema.js";

export type CodeGenerationResult = {
  filesWritten: string[];
  providerId: string;
  notes?: string;
};

export interface CodeGenerationProvider {
  generate(input: {
    generationPlan: GenerationPlan;
    blueprint: CompanyOSBlueprint;
    stagingDirectory: string; // app root
  }): Promise<CodeGenerationResult>;
}
