import { z } from "zod";
import { AppError } from "../shared/errors.js";

export const GenerationPlanSchema = z.object({
  schemaVersion: z.literal("1.0"),
  generationId: z.string(),
  companyId: z.string(),
  companySlug: z.string(),
  sourceHashes: z.object({
    companyKnowledgeHash: z.string(),
    masterBuildSpecificationHash: z.string(),
    masterPromptHash: z.string(),
    companyOSBlueprintHash: z.string(),
  }),
  template: z.object({
    id: z.string(),
    version: z.string(),
    sourcePath: z.string(),
    contentHash: z.string(),
  }),
  provider: z.object({
    id: z.enum(["DETERMINISTIC_TEMPLATE", "CODEX_CLI", "FIXTURE"]),
    model: z.string().optional(),
    providerVersion: z.string().optional(),
  }),
  application: z.object({
    framework: z.string(),
    language: z.string(),
    packageManager: z.string(),
    rtl: z.boolean(),
    primaryLanguage: z.string(),
  }),
  tasks: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "COPY_TEMPLATE",
        "CLEAN_TEMPLATE",
        "GENERATE_BRANDING",
        "GENERATE_NAVIGATION",
        "GENERATE_DASHBOARDS",
        "GENERATE_MODULES",
        "GENERATE_WORKFLOWS",
        "GENERATE_AGENTS",
        "GENERATE_MOCK_DATA",
        "GENERATE_TESTS",
        "VALIDATE_SOURCE",
        "INSTALL_DEPENDENCIES",
        "TYPECHECK",
        "TEST",
        "BUILD",
      ]),
      description: z.string(),
      allowedPaths: z.array(z.string()),
      dependencies: z.array(z.string()),
      required: z.boolean(),
    }),
  ),
  expectedCoverage: z.object({
    dashboardIds: z.array(z.string()),
    moduleIds: z.array(z.string()),
    workflowIds: z.array(z.string()),
    agentIds: z.array(z.string()),
    entityIds: z.array(z.string()),
    roleIds: z.array(z.string()),
  }),
  policies: z.object({
    allowedDependencies: z.array(z.string()),
    forbiddenDependencies: z.array(z.string()),
    maximumGeneratedFiles: z.number().int().positive(),
    maximumTotalBytes: z.number().int().positive(),
    allowNetworkDuringBuild: z.boolean(),
    allowPostinstallScripts: z.boolean(),
  }),
  generatedAt: z.string().datetime(),
});

export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;

export function parseGenerationPlan(data: unknown): GenerationPlan {
  const parsed = GenerationPlanSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid GenerationPlan", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  const taskIds = parsed.data.tasks.map((t) => t.id);
  const seen = new Set<string>();
  for (const id of taskIds) {
    if (seen.has(id)) {
      throw new AppError("GENERATION_PLAN_INVALID", `Duplicate GenerationPlan task id: ${id}`, {
        details: { taskId: id },
      });
    }
    seen.add(id);
  }
  return parsed.data;
}
