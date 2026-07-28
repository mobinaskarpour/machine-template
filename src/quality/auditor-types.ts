import type { CompanyOSBlueprint } from "../blueprints/company-os-blueprint-schema.js";
import type { QualityIssue } from "./quality-issue-schema.js";

export type QualityAuditContext = {
  companySlug: string;
  generationId: string;
  qualityRunId: string;
  releaseAppDir: string;
  blueprint: CompanyOSBlueprint;
  runtime: any;
  mockData: any;
  browserAvailable: boolean;
};

export type AuditorResult = {
  auditorId: string;
  score: number | null;
  issues: QualityIssue[];
  skipped?: string;
};
