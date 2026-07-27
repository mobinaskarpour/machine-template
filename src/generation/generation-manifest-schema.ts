import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const GenerationManifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  generationId: z.string(),
  companyId: z.string(),
  companySlug: z.string(),
  status: z.enum([
    "STAGING",
    "GENERATED",
    "VALIDATED",
    "BUILD_PASSED",
    "PROMOTED",
    "FAILED",
  ]),
  sourceHashes: z.object({
    blueprintHash: z.string(),
    specificationHash: z.string(),
    masterPromptHash: z.string(),
    templateHash: z.string(),
  }),
  provider: z.object({
    id: z.string(),
    model: z.string().optional(),
    version: z.string().optional(),
  }),
  releasePath: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      hash: z.string(),
      size: z.number(),
      source: z.enum(["TEMPLATE", "DETERMINISTIC", "CODEX", "REPAIR"]),
    }),
  ),
  coverage: z.object({
    dashboards: z.object({
      expected: z.array(z.string()),
      generated: z.array(z.string()),
      missing: z.array(z.string()),
    }),
    modules: z.object({
      expected: z.array(z.string()),
      generated: z.array(z.string()),
      missing: z.array(z.string()),
    }),
    workflows: z.object({
      expected: z.array(z.string()),
      generated: z.array(z.string()),
      missing: z.array(z.string()),
    }),
    agents: z.object({
      expected: z.array(z.string()),
      generated: z.array(z.string()),
      missing: z.array(z.string()),
    }),
    entities: z.object({
      expected: z.array(z.string()),
      generated: z.array(z.string()),
      missing: z.array(z.string()),
    }),
  }),
  validation: z.object({
    sourcePolicy: z.boolean(),
    dependencyPolicy: z.boolean(),
    routeValidation: z.boolean(),
    mockDataIntegrity: z.boolean(),
    typecheck: z.boolean(),
    tests: z.boolean(),
    build: z.boolean(),
    securityScan: z.boolean(),
  }),
  build: z.object({
    command: z.array(z.string()),
    startedAt: z.string().optional(),
    finishedAt: z.string().optional(),
    exitCode: z.number().optional(),
    durationMs: z.number().optional(),
    sanitizedSummary: z.string().optional(),
  }),
  repairAttempts: z.array(
    z.object({
      attempt: z.number(),
      provider: z.string(),
      errorCategory: z.string(),
      affectedFiles: z.array(z.string()),
      result: z.enum(["SUCCEEDED", "FAILED"]),
    }),
  ),
  mockRecordTotal: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GenerationManifest = z.infer<typeof GenerationManifestSchema>;

export function parseGenerationManifest(data: unknown): GenerationManifest {
  const parsed = GenerationManifestSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid GenerationManifest", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
