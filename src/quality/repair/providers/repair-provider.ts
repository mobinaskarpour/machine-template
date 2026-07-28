import type { CompanyOSBlueprint } from "../../../blueprints/company-os-blueprint-schema.js";
import type { QualityIssue } from "../../quality-issue-schema.js";
import type { RepairPlan } from "../repair-plan-schema.js";

export type RepairProviderInput = {
  stagingAppDir: string;
  plan: RepairPlan;
  issues: QualityIssue[];
  blueprint: CompanyOSBlueprint;
};

export type RepairProviderResult = {
  filesChanged: string[];
  notes: string;
};

export interface RepairProvider {
  readonly providerId: string;
  repair(input: RepairProviderInput): Promise<RepairProviderResult>;
}
