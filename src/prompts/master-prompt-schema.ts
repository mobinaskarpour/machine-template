import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const MASTER_PROMPT_VERSION = "1.0";

export const MASTER_PROMPT_SECTION_IDS = [
  "MACHINE_CONTEXT",
  "COMPANY_IDENTITY",
  "EVIDENCE_QUALITY",
  "INDUSTRY_CONTEXT",
  "BUSINESS_OBJECTIVES",
  "DEPARTMENTS_AND_ROLES",
  "DASHBOARDS",
  "KPIS",
  "WORKFLOWS",
  "AI_AGENTS",
  "DATA_MODEL",
  "BRANDING_AND_LANGUAGE",
  "UX_REQUIREMENTS",
  "INTEGRATIONS",
  "ASSUMPTIONS",
  "UNRESOLVED_QUESTIONS",
  "SAFETY_BOUNDARIES",
  "FUTURE_GENERATION_REQUIREMENTS",
  "QUALITY_GATES",
  "OUTPUT_CONTRACT",
] as const;

export type MasterPromptSectionId = (typeof MASTER_PROMPT_SECTION_IDS)[number];

export const MasterPromptArtifactSchema = z.object({
  schemaVersion: z.literal("1.0"),
  companyId: z.string(),
  companySlug: z.string(),
  specificationHash: z.string(),
  promptVersion: z.string(),
  prompt: z.string().min(1),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      contentHash: z.string(),
    }),
  ),
  contentHash: z.string().optional(),
  generatedAt: z.string().datetime(),
});

export type MasterPromptArtifact = z.infer<typeof MasterPromptArtifactSchema>;

export function parseMasterPromptArtifact(data: unknown): MasterPromptArtifact {
  const parsed = MasterPromptArtifactSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid MasterPromptArtifact", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
