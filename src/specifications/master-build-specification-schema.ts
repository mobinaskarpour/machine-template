import { z } from "zod";
import { AppError } from "../shared/errors.js";

const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const SourceSchema = z.enum([
  "COMPANY_KNOWLEDGE",
  "INDUSTRY_DEFAULT",
  "COMBINED",
  "CONFIRMED",
  "INFERRED",
]);

export const MasterBuildSpecificationSchema = z.object({
  schemaVersion: z.literal("1.0"),
  company: z.object({
    id: z.string(),
    slug: z.string(),
    displayName: z.string(),
    description: z.string(),
    officialWebsite: z.string().optional(),
    primaryLanguage: z.string(),
    rtl: z.boolean(),
  }),
  industry: z.object({
    selectedPackId: z.string(),
    selectedPackName: z.string(),
    confidence: z.number().min(0).max(1),
    matchedSignals: z.array(z.string()),
    alternatives: z.array(z.string()),
    requiresReview: z.boolean(),
  }),
  objectives: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      source: z.enum(["COMPANY_KNOWLEDGE", "INDUSTRY_DEFAULT", "COMBINED"]),
      priority: PrioritySchema,
    }),
  ),
  departments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      source: z.enum(["CONFIRMED", "INFERRED", "INDUSTRY_DEFAULT"]),
    }),
  ),
  roles: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      departmentId: z.string(),
      source: z.enum(["CONFIRMED", "INFERRED", "INDUSTRY_DEFAULT"]),
    }),
  ),
  kpis: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      department: z.string().optional(),
      unit: z.string(),
      direction: z.string(),
      priority: PrioritySchema,
      source: z.enum(["COMPANY_KNOWLEDGE", "INDUSTRY_DEFAULT", "COMBINED"]),
    }),
  ),
  workflows: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      department: z.string(),
      purpose: z.string(),
      stages: z.array(z.string()),
      priority: PrioritySchema,
      source: z.enum(["COMPANY_KNOWLEDGE", "INDUSTRY_DEFAULT", "COMBINED"]),
    }),
  ),
  dashboards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      audience: z.array(z.string()),
      purpose: z.string(),
      kpiIds: z.array(z.string()),
      sections: z.array(z.string()),
      priority: PrioritySchema,
    }),
  ),
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mission: z.string(),
      department: z.string().optional(),
      inputs: z.array(z.string()),
      outputs: z.array(z.string()),
      permissions: z.enum(["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"]),
      priority: PrioritySchema,
    }),
  ),
  dataModel: z.object({
    entities: z.array(z.any()),
    relationships: z.array(z.any()),
  }),
  branding: z.object({
    primaryColor: z.string().optional(),
    secondaryColors: z.array(z.string()),
    logoUrl: z.string().optional(),
    tone: z.string().optional(),
    languages: z.array(z.string()),
    rtl: z.boolean(),
  }),
  integrations: z.array(
    z.object({
      name: z.string(),
      category: z.string().optional(),
      status: z.enum(["CONFIRMED", "INFERRED", "RECOMMENDED"]),
      purpose: z.string().optional(),
    }),
  ),
  constraints: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
    }),
  ),
  assumptions: z.array(
    z.object({
      id: z.string(),
      field: z.string(),
      assumption: z.string(),
      reason: z.string(),
      requiresConfirmation: z.boolean(),
    }),
  ),
  unresolvedQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      reason: z.string(),
      blocking: z.boolean(),
    }),
  ),
  quality: z.object({
    companyKnowledgeConfidence: z.number().min(0).max(1),
    industryResolutionConfidence: z.number().min(0).max(1),
    specificationConfidence: z.number().min(0).max(1),
    readyForBlueprintGeneration: z.boolean(),
    blockingReasons: z.array(z.string()),
  }),
  contentHash: z.string().optional(),
  generatedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MasterBuildSpecification = z.infer<
  typeof MasterBuildSpecificationSchema
>;

export function parseMasterBuildSpecification(
  data: unknown,
): MasterBuildSpecification {
  const parsed = MasterBuildSpecificationSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid MasterBuildSpecification", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}

void SourceSchema;
