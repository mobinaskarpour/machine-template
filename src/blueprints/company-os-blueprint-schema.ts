import { z } from "zod";
import { AppError } from "../shared/errors.js";

const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const TraceRefSchema = z.object({
  sourceType: z.enum(["COMPANY_KNOWLEDGE", "INDUSTRY_PACK", "MASTER_SPECIFICATION"]),
  sourceId: z.string(),
  reason: z.string(),
});

export const CompanyOSBlueprintSchema = z.object({
  schemaVersion: z.literal("1.0"),
  blueprintId: z.string().min(1),
  company: z.object({
    id: z.string(),
    slug: z.string(),
    displayName: z.string(),
    description: z.string(),
    officialWebsite: z.string().optional(),
    industryPackId: z.string(),
    language: z.string(),
    supportedLanguages: z.array(z.string()),
    rtl: z.boolean(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    canonicalSlugSuggestion: z.string().optional(),
  }),
  sourceArtifacts: z.object({
    companyKnowledgeHash: z.string(),
    industryResolutionHash: z.string(),
    masterBuildSpecificationHash: z.string(),
    masterPromptHash: z.string(),
  }),
  productDefinition: z.object({
    name: z.string(),
    type: z.enum([
      "COMPANY_OS",
      "ERP",
      "CRM",
      "OPERATIONS_PLATFORM",
      "MANAGEMENT_DASHBOARD",
      "HYBRID",
    ]),
    objective: z.string(),
    primaryUsers: z.array(z.string()),
    primaryBusinessOutcomes: z.array(z.string()),
    scopeSummary: z.string(),
    outOfScope: z.array(z.string()),
  }),
  experience: z.object({
    uiLanguage: z.string(),
    rtl: z.boolean(),
    designDirection: z.object({
      style: z.enum(["ENTERPRISE", "MODERN", "MINIMAL", "DATA_DENSE", "OPERATIONAL"]),
      theme: z.enum(["LIGHT", "DARK", "SYSTEM", "BRAND_DRIVEN"]),
      density: z.enum(["COMFORTABLE", "COMPACT", "MIXED"]),
      brandingNotes: z.array(z.string()),
    }),
    globalPatterns: z.array(
      z.object({
        id: z.string(),
        type: z.enum([
          "GLOBAL_SEARCH",
          "NOTIFICATIONS",
          "COMMAND_PALETTE",
          "FILTER_BAR",
          "DATE_RANGE",
          "EXPORT",
          "APPROVAL_INBOX",
          "AI_ASSISTANT",
        ]),
        description: z.string(),
        priority: PrioritySchema,
      }),
    ),
  }),
  navigation: z.object({
    primary: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        iconHint: z.string().optional(),
        route: z.string(),
        type: z.enum(["DASHBOARD", "MODULE", "WORKFLOW", "REPORT", "SETTINGS", "AI_AGENT"]),
        requiredPermissions: z.array(z.string()),
        children: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            route: z.string(),
            type: z.enum(["PAGE", "LIST", "DETAIL", "FORM", "REPORT", "AGENT"]),
            requiredPermissions: z.array(z.string()),
          }),
        ),
      }),
    ),
    utility: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        route: z.string(),
        requiredPermissions: z.array(z.string()),
      }),
    ),
  }),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      departmentId: z.string().optional(),
      scope: z.enum(["EXECUTIVE", "MANAGER", "OPERATOR", "ANALYST", "ADMIN", "VIEWER"]),
      permissions: z.array(z.string()),
      defaultDashboardId: z.string().optional(),
      approvalCapabilities: z.array(z.string()),
      dataAccessScope: z.array(z.string()),
    }),
  ),
  permissionModel: z.object({
    strategy: z.literal("RBAC"),
    permissions: z.array(
      z.object({
        id: z.string(),
        resource: z.string(),
        actions: z.array(
          z.enum(["VIEW", "CREATE", "UPDATE", "DELETE", "APPROVE", "EXPORT", "MANAGE"]),
        ),
        description: z.string(),
      }),
    ),
    sensitiveOperations: z.array(
      z.object({
        operation: z.string(),
        requiredPermissionIds: z.array(z.string()),
        approvalRequired: z.boolean(),
        auditRequired: z.boolean(),
        trace: z.array(TraceRefSchema).optional(),
      }),
    ),
  }),
  dashboards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      route: z.string(),
      audienceRoleIds: z.array(z.string()),
      purpose: z.string(),
      priority: PrioritySchema,
      layout: z.object({
        columns: z.number().int().positive(),
        sections: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            order: z.number().int(),
            width: z.enum(["FULL", "HALF", "THIRD", "QUARTER"]),
          }),
        ),
      }),
      widgets: z.array(
        z.object({
          id: z.string(),
          sectionId: z.string(),
          title: z.string(),
          type: z.enum([
            "KPI_CARD",
            "LINE_CHART",
            "BAR_CHART",
            "AREA_CHART",
            "PIE_CHART",
            "DONUT_CHART",
            "GAUGE",
            "TABLE",
            "TIMELINE",
            "KANBAN",
            "MAP",
            "HEATMAP",
            "STATUS_LIST",
            "ALERT_LIST",
            "AI_INSIGHT",
          ]),
          kpiIds: z.array(z.string()),
          dataEntityIds: z.array(z.string()),
          filters: z.array(z.string()),
          description: z.string(),
          priority: PrioritySchema,
        }),
      ),
      trace: z.array(TraceRefSchema).optional(),
    }),
  ),
  modules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      routePrefix: z.string(),
      department: z.string().optional(),
      description: z.string(),
      priority: PrioritySchema,
      pages: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          route: z.string(),
          type: z.enum([
            "LIST",
            "DETAIL",
            "CREATE",
            "EDIT",
            "DASHBOARD",
            "BOARD",
            "CALENDAR",
            "REPORT",
            "SETTINGS",
          ]),
          entityId: z.string().optional(),
          requiredPermissionIds: z.array(z.string()),
          components: z.array(z.string()),
          actions: z.array(z.string()),
        }),
      ),
      trace: z.array(TraceRefSchema).optional(),
    }),
  ),
  workflows: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      department: z.string(),
      purpose: z.string(),
      priority: PrioritySchema,
      trigger: z.object({
        type: z.enum([
          "MANUAL",
          "RECORD_CREATED",
          "RECORD_UPDATED",
          "STATUS_CHANGED",
          "SCHEDULED",
          "THRESHOLD",
          "EXTERNAL_EVENT",
        ]),
        description: z.string(),
      }),
      stages: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          order: z.number().int(),
          responsibleRoleIds: z.array(z.string()),
          requiredInputs: z.array(z.string()),
          outputs: z.array(z.string()),
          allowedActions: z.array(z.string()),
          approvalRequired: z.boolean(),
          slaHours: z.number().optional(),
        }),
      ),
      states: z.array(z.string()),
      transitions: z.array(
        z.object({
          from: z.string(),
          to: z.string(),
          action: z.string(),
          requiredRoleIds: z.array(z.string()),
          conditions: z.array(z.string()),
        }),
      ),
      notifications: z.array(
        z.object({
          event: z.string(),
          recipientRoleIds: z.array(z.string()),
          channel: z.enum(["IN_APP", "EMAIL", "TELEGRAM"]),
          messagePurpose: z.string(),
        }),
      ),
      auditRequired: z.boolean(),
      trace: z.array(TraceRefSchema).optional(),
    }),
  ),
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      department: z.string().optional(),
      mission: z.string(),
      priority: PrioritySchema,
      executionMode: z.enum(["READ_ONLY", "SUGGEST", "APPROVAL_REQUIRED"]),
      inputs: z.array(
        z.object({
          sourceType: z.enum(["ENTITY", "KPI", "WORKFLOW", "DOCUMENT", "USER_QUERY"]),
          sourceId: z.string().optional(),
          description: z.string(),
        }),
      ),
      outputs: z.array(
        z.object({
          type: z.enum(["INSIGHT", "ALERT", "FORECAST", "RECOMMENDATION", "SUMMARY", "DRAFT"]),
          description: z.string(),
        }),
      ),
      tools: z.array(
        z.object({
          id: z.string(),
          type: z.enum([
            "DATA_QUERY",
            "REPORTING",
            "CALCULATOR",
            "DOCUMENT_SEARCH",
            "NOTIFICATION_DRAFT",
          ]),
          readOnly: z.boolean(),
        }),
      ),
      approvalBoundary: z.string(),
      prohibitedActions: z.array(z.string()),
      visibilityRoleIds: z.array(z.string()),
      trace: z.array(TraceRefSchema).optional(),
    }),
  ),
  dataModel: z.object({
    entities: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        source: z.enum(["COMPANY_SPECIFIC", "INDUSTRY_DEFAULT", "COMBINED"]),
        fields: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            label: z.string(),
            type: z.enum([
              "STRING",
              "TEXT",
              "NUMBER",
              "BOOLEAN",
              "DATE",
              "DATETIME",
              "CURRENCY",
              "PERCENT",
              "ENUM",
              "REFERENCE",
              "JSON",
            ]),
            required: z.boolean(),
            unique: z.boolean(),
            indexed: z.boolean(),
            referenceEntityId: z.string().optional(),
            enumValues: z.array(z.string()).optional(),
            defaultValueDescription: z.string().optional(),
            validationRules: z.array(z.string()),
            sensitive: z.boolean(),
          }),
        ),
        statusField: z
          .object({
            fieldId: z.string(),
            allowedValues: z.array(z.string()),
            initialValue: z.string(),
          })
          .optional(),
        auditFieldsRequired: z.boolean(),
        trace: z.array(TraceRefSchema).optional(),
      }),
    ),
    relationships: z.array(
      z.object({
        id: z.string(),
        fromEntityId: z.string(),
        toEntityId: z.string(),
        type: z.enum(["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_MANY"]),
        name: z.string(),
        required: z.boolean(),
        cascadeBehavior: z.enum(["RESTRICT", "CASCADE", "SET_NULL"]),
      }),
    ),
    calculatedFields: z.array(
      z.object({
        id: z.string(),
        entityId: z.string(),
        name: z.string(),
        description: z.string(),
        formulaDescription: z.string(),
        sourceFieldIds: z.array(z.string()),
      }),
    ),
  }),
  mockDataPlan: z.object({
    strategy: z.enum(["DETERMINISTIC", "SEEDED_RANDOM", "HYBRID"]),
    locale: z.string(),
    currency: z.string().optional(),
    timeRange: z.object({ start: z.string(), end: z.string() }),
    entityVolumes: z.array(
      z.object({
        entityId: z.string(),
        targetCount: z.number().int().nonnegative(),
        notes: z.string().optional(),
      }),
    ),
    scenarios: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        affectedEntityIds: z.array(z.string()),
        expectedDashboardEffects: z.array(z.string()),
      }),
    ),
    consistencyRules: z.array(z.string()),
    prohibitedContent: z.array(z.string()),
  }),
  integrations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      status: z.enum(["CONFIRMED", "INFERRED", "RECOMMENDED", "FUTURE"]),
      purpose: z.string(),
      direction: z.enum(["INBOUND", "OUTBOUND", "BIDIRECTIONAL"]),
      authenticationType: z.enum([
        "NONE",
        "API_KEY",
        "OAUTH2",
        "BASIC",
        "CUSTOM",
        "UNKNOWN",
      ]),
      requiredForMvp: z.boolean(),
      implementationNotes: z.array(z.string()),
    }),
  ),
  notifications: z.object({
    channels: z.array(z.enum(["IN_APP", "EMAIL", "TELEGRAM"])),
    eventCatalog: z.array(
      z.object({
        id: z.string(),
        event: z.string(),
        recipients: z.array(z.string()),
        severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
        defaultChannels: z.array(z.enum(["IN_APP", "EMAIL", "TELEGRAM"])),
      }),
    ),
  }),
  reports: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      audienceRoleIds: z.array(z.string()),
      dataEntityIds: z.array(z.string()),
      kpiIds: z.array(z.string()),
      filters: z.array(z.string()),
      exportFormats: z.array(z.enum(["CSV", "XLSX", "PDF"])),
      scheduleSupported: z.boolean(),
    }),
  ),
  implementationPlan: z.object({
    recommendedStack: z.object({
      frontend: z.string(),
      backend: z.string(),
      database: z.string(),
      orm: z.string(),
      authentication: z.string(),
      charts: z.string(),
      ui: z.string(),
      deploymentTarget: z.string(),
    }),
    workstreams: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        objective: z.string(),
        dependencies: z.array(z.string()),
        outputs: z.array(z.string()),
        priority: PrioritySchema,
        trace: z.array(TraceRefSchema).optional(),
      }),
    ),
    phases: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        objective: z.string(),
        workstreamIds: z.array(z.string()),
        acceptanceCriteria: z.array(z.string()),
      }),
    ),
    generationOrder: z.array(z.string()),
  }),
  quality: z.object({
    completenessScore: z.number().min(0).max(1),
    consistencyScore: z.number().min(0).max(1),
    traceabilityScore: z.number().min(0).max(1),
    securityScore: z.number().min(0).max(1),
    implementationReadinessScore: z.number().min(0).max(1),
    readyForCodeGeneration: z.boolean(),
    blockingReasons: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
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
      category: z.enum([
        "BUSINESS",
        "DATA",
        "INTEGRATION",
        "SECURITY",
        "DEPLOYMENT",
        "DESIGN",
      ]),
    }),
  ),
  contentHash: z.string().optional(),
  generatedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CompanyOSBlueprint = z.infer<typeof CompanyOSBlueprintSchema>;

export const BlueprintSummarySchema = z.object({
  schemaVersion: z.literal("1.0"),
  companySlug: z.string(),
  displayName: z.string(),
  industryPackId: z.string(),
  counts: z.object({
    modules: z.number().int(),
    dashboards: z.number().int(),
    workflows: z.number().int(),
    roles: z.number().int(),
    agents: z.number().int(),
    entities: z.number().int(),
    pages: z.number().int(),
  }),
  quality: z.object({
    completenessScore: z.number(),
    consistencyScore: z.number(),
    traceabilityScore: z.number(),
    securityScore: z.number(),
    implementationReadinessScore: z.number(),
    readyForCodeGeneration: z.boolean(),
  }),
  blockingReasons: z.array(z.string()),
  warnings: z.array(z.string()),
  generatedAt: z.string().datetime(),
  contentHash: z.string().optional(),
});

export type BlueprintSummary = z.infer<typeof BlueprintSummarySchema>;

export function parseCompanyOSBlueprint(data: unknown): CompanyOSBlueprint {
  const parsed = CompanyOSBlueprintSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Invalid CompanyOSBlueprint", {
      details: { issues: parsed.error.issues.slice(0, 25) },
    });
  }
  return parsed.data;
}

export function parseBlueprintSummary(data: unknown): BlueprintSummary {
  const parsed = BlueprintSummarySchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("BLUEPRINT_VALIDATION_FAILED", "Invalid BlueprintSummary", {
      details: { issues: parsed.error.issues.slice(0, 20) },
    });
  }
  return parsed.data;
}
