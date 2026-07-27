import { z } from "zod";
import { AppError } from "../shared/errors.js";
import { assertSafePublicUrlSync } from "../security/safe-url.js";

const ConfidenceSchema = z.number().min(0).max(1);
const HexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid CSS hex color");

const SourceTypeSchema = z.enum([
  "OFFICIAL_WEBSITE",
  "BUSINESS_REGISTRY",
  "SOCIAL_PROFILE",
  "NEWS",
  "DIRECTORY",
  "SEARCH_RESULT",
  "USER_INPUT",
  "OTHER",
]);

const SourceStatusSchema = z.enum([
  "DISCOVERED",
  "FETCHED",
  "REJECTED",
  "FAILED",
]);

export const KnowledgeSourceSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().optional(),
  sourceType: SourceTypeSchema,
  authorityScore: ConfidenceSchema,
  fetchedAt: z.string().datetime(),
  contentHash: z.string().optional(),
  status: SourceStatusSchema,
  rejectionReason: z.string().optional(),
});

export const CompanyKnowledgeSchema = z.object({
  schemaVersion: z.literal("1.0"),
  companyId: z.string().min(1),
  companySlug: z.string().min(1),
  displayName: z.string().min(1),
  status: z.enum(["DRAFT", "READY", "NEEDS_INPUT", "FAILED_VALIDATION"]),
  identity: z.object({
    legalName: z.string().optional(),
    tradingNames: z.array(z.string()),
    description: z.string(),
    country: z.string().optional(),
    city: z.string().optional(),
    foundedYear: z.number().int().min(1800).max(2100).optional(),
    employeeRange: z.string().optional(),
    officialWebsite: z.string().url().optional(),
    contact: z
      .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
  }),
  industry: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
    confidence: ConfidenceSchema,
    evidenceSourceIds: z.array(z.string()),
  }),
  products: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      category: z.string().optional(),
      description: z.string().optional(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  departments: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  roles: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      departmentId: z.string().optional(),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  businessModel: z.object({
    summary: z.string(),
    type: z.enum([
      "B2B",
      "B2C",
      "B2G",
      "B2B2C",
      "MARKETPLACE",
      "MIXED",
      "UNKNOWN",
    ]),
    confidence: ConfidenceSchema,
    evidenceSourceIds: z.array(z.string()),
  }),
  customers: z.array(
    z.object({
      segment: z.string().min(1),
      examples: z.array(z.string()),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  suppliers: z.array(
    z.object({
      segment: z.string().min(1),
      examples: z.array(z.string()),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  painPoints: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      department: z.string().optional(),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  revenueModel: z.object({
    streams: z.array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        inferred: z.boolean(),
        confidence: ConfidenceSchema,
        evidenceSourceIds: z.array(z.string()),
      }),
    ),
    summary: z.string(),
  }),
  processes: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      department: z.string().optional(),
      description: z.string().optional(),
      inferred: z.boolean(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  integrations: z.array(
    z.object({
      name: z.string().min(1),
      category: z.string().optional(),
      status: z.enum(["CONFIRMED", "INFERRED", "POTENTIAL"]),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  aiUseCases: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      department: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
      inferred: z.literal(true),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      website: z.string().url().optional(),
      reason: z.string().optional(),
      confidence: ConfidenceSchema,
      evidenceSourceIds: z.array(z.string()),
    }),
  ),
  branding: z.object({
    primaryColor: HexColorSchema.optional(),
    secondaryColors: z.array(HexColorSchema),
    logoUrl: z.string().url().optional(),
    tagline: z.string().optional(),
    tone: z.string().optional(),
    languages: z.array(z.string()),
    rtlRecommended: z.boolean(),
    evidenceSourceIds: z.array(z.string()),
  }),
  sources: z.array(KnowledgeSourceSchema),
  gaps: z.array(
    z.object({
      field: z.string().min(1),
      reason: z.string().min(1),
      requiredUserInput: z.string().optional(),
    }),
  ),
  overallConfidence: ConfidenceSchema,
  contentHash: z.string().optional(),
  discoveredAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CompanyKnowledge = z.infer<typeof CompanyKnowledgeSchema>;
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

export function parseCompanyKnowledge(data: unknown): CompanyKnowledge {
  const result = CompanyKnowledgeSchema.safeParse(data);
  if (!result.success) {
    throw new AppError("KNOWLEDGE_INVALID", "Invalid CompanyKnowledge schema", {
      details: { issues: result.error.issues.slice(0, 20) },
    });
  }
  // URL credential / private host checks on sources and official website
  for (const source of result.data.sources) {
    try {
      assertSafePublicUrlSync(source.url);
    } catch (error) {
      throw new AppError("KNOWLEDGE_INVALID", `Unsafe source URL: ${source.url}`, {
        cause: error,
      });
    }
  }
  if (result.data.identity.officialWebsite) {
    try {
      assertSafePublicUrlSync(result.data.identity.officialWebsite);
    } catch (error) {
      throw new AppError(
        "KNOWLEDGE_INVALID",
        `Unsafe officialWebsite: ${result.data.identity.officialWebsite}`,
        { cause: error },
      );
    }
  }
  return result.data;
}
