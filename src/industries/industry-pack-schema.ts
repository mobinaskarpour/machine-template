import { z } from "zod";
import { AppError } from "../shared/errors.js";

const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const IndustryPackSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  aliases: z.array(z.string()),
  ceoConcerns: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      priority: PrioritySchema,
    }),
  ),
  kpis: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1),
      department: z.string().optional(),
      unit: z.enum([
        "NUMBER",
        "PERCENT",
        "CURRENCY",
        "DURATION",
        "RATE",
        "QUANTITY",
        "SCORE",
      ]),
      direction: z.enum(["HIGHER_IS_BETTER", "LOWER_IS_BETTER", "TARGET"]),
      formulaDescription: z.string().optional(),
      recommendedVisualization: z.string().optional(),
    }),
  ),
  departments: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1),
      core: z.boolean(),
    }),
  ),
  roles: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      departmentId: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  workflowBlueprints: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      department: z.string().min(1),
      purpose: z.string().min(1),
      trigger: z.string().min(1),
      stages: z.array(z.string().min(1)).min(1),
      outputs: z.array(z.string().min(1)).min(1),
    }),
  ),
  dashboardBlueprints: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      audience: z.array(z.string().min(1)).min(1),
      purpose: z.string().min(1),
      kpiIds: z.array(z.string().min(1)),
      sections: z.array(z.string().min(1)).min(1),
    }),
  ),
  aiAgentRoster: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      department: z.string().optional(),
      mission: z.string().min(1),
      inputs: z.array(z.string()),
      outputs: z.array(z.string()),
      permissions: z.enum(["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"]),
    }),
  ),
  mockSchema: z.object({
    entities: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        fields: z.array(
          z.object({
            name: z.string().min(1),
            type: z.enum([
              "STRING",
              "NUMBER",
              "BOOLEAN",
              "DATE",
              "DATETIME",
              "CURRENCY",
              "ENUM",
              "REFERENCE",
            ]),
            required: z.boolean(),
            referenceEntityId: z.string().optional(),
            enumValues: z.array(z.string()).optional(),
          }),
        ),
      }),
    ),
    relationships: z.array(
      z.object({
        fromEntityId: z.string().min(1),
        toEntityId: z.string().min(1),
        type: z.enum(["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_MANY"]),
        description: z.string().min(1),
      }),
    ),
  }),
  terminology: z.record(z.array(z.string())),
  risks: z.array(z.string()),
  recommendedIntegrations: z.array(
    z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      purpose: z.string().min(1),
    }),
  ),
});

export type IndustryPack = z.infer<typeof IndustryPackSchema>;

export function parseIndustryPack(data: unknown): IndustryPack {
  const parsed = IndustryPackSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid IndustryPack", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  validateIndustryPackReferences(parsed.data);
  return parsed.data;
}

export function validateIndustryPackReferences(pack: IndustryPack): void {
  const deptIds = new Set(pack.departments.map((d) => d.id));
  const kpiIds = new Set(pack.kpis.map((k) => k.id));
  const entityIds = new Set(pack.mockSchema.entities.map((e) => e.id));

  const assertUnique = (ids: string[], label: string) => {
    if (new Set(ids).size !== ids.length) {
      throw new AppError("VALIDATION_ERROR", `Duplicate IDs in ${label} for pack ${pack.id}`);
    }
  };
  assertUnique(pack.ceoConcerns.map((c) => c.id), "ceoConcerns");
  assertUnique(pack.kpis.map((k) => k.id), "kpis");
  assertUnique(pack.departments.map((d) => d.id), "departments");
  assertUnique(pack.roles.map((r) => r.id), "roles");
  assertUnique(pack.workflowBlueprints.map((w) => w.id), "workflows");
  assertUnique(pack.dashboardBlueprints.map((d) => d.id), "dashboards");
  assertUnique(pack.aiAgentRoster.map((a) => a.id), "agents");
  assertUnique(pack.mockSchema.entities.map((e) => e.id), "entities");

  for (const role of pack.roles) {
    if (!deptIds.has(role.departmentId)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Role ${role.id} references missing department ${role.departmentId}`,
      );
    }
  }
  for (const dash of pack.dashboardBlueprints) {
    for (const kpiId of dash.kpiIds) {
      if (!kpiIds.has(kpiId)) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Dashboard ${dash.id} references missing KPI ${kpiId}`,
        );
      }
    }
  }
  for (const entity of pack.mockSchema.entities) {
    for (const field of entity.fields) {
      if (field.type === "REFERENCE" && field.referenceEntityId) {
        if (!entityIds.has(field.referenceEntityId)) {
          throw new AppError(
            "VALIDATION_ERROR",
            `Entity ${entity.id}.${field.name} references missing entity`,
          );
        }
      }
    }
  }
  for (const rel of pack.mockSchema.relationships) {
    if (!entityIds.has(rel.fromEntityId) || !entityIds.has(rel.toEntityId)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Relationship references missing entity in pack ${pack.id}`,
      );
    }
  }
}
