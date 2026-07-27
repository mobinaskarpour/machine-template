import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { IndustryPack } from "../industries/industry-pack-schema.js";
import type { IndustryResolution } from "../industries/industry-resolver.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import type { MasterPromptArtifact } from "../prompts/master-prompt-schema.js";
import {
  parseCompanyOSBlueprint,
  type CompanyOSBlueprint,
  type BlueprintSummary,
} from "./company-os-blueprint-schema.js";
import { hashJsonStable, hashBlueprintContent } from "./blueprint-hash.js";
import { calculateBlueprintQuality } from "./blueprint-readiness.js";
import {
  DEFAULT_BLUEPRINT_LIMITS,
  type BlueprintLimits,
} from "./blueprint-types.js";
import { suggestCanonicalSlug } from "../registry/slug.js";
import { nowIso, shortStableHash } from "../shared/ids.js";
import { AppError } from "../shared/errors.js";

function kebab(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

function route(...parts: string[]): string {
  const path = "/" + parts.map(kebab).filter(Boolean).join("/");
  if (path.includes("..") || path.includes("//") || path.includes("\\")) {
    throw new AppError("BLUEPRINT_UNSAFE_ROUTE", `Unsafe route: ${path}`);
  }
  return path;
}

function widgetForKpi(name: string, unit: string, direction: string): CompanyOSBlueprint["dashboards"][number]["widgets"][number]["type"] {
  const n = `${name} ${unit} ${direction}`.toLowerCase();
  if (/trend|forecast|attainment|accuracy|aging|dso/.test(n)) return "LINE_CHART";
  if (/rate|percent|oee|yield|efficiency|scrap|waste/.test(n)) return "GAUGE";
  if (/count|quantity|orders|complaints|hold/.test(n)) return "BAR_CHART";
  if (/alert|downtime|incident|non-?conform/.test(n)) return "ALERT_LIST";
  if (/margin|currency|receivable|revenue/.test(n)) return "KPI_CARD";
  return "KPI_CARD";
}

function isSensitiveDept(name: string): boolean {
  return /finance|quality|procurement|food.?safety|hr|legal|medical|bank/i.test(name);
}

export function buildCompanyOSBlueprint(input: {
  knowledge: CompanyKnowledge;
  resolution: IndustryResolution;
  pack: IndustryPack;
  specification: MasterBuildSpecification;
  prompt: MasterPromptArtifact;
  limits?: Partial<BlueprintLimits>;
}): CompanyOSBlueprint {
  const limits = { ...DEFAULT_BLUEPRINT_LIMITS, ...input.limits };
  const { knowledge, specification, pack, resolution, prompt } = input;
  const now = nowIso();

  const knowledgeHash = knowledge.contentHash ?? hashJsonStable({
    id: knowledge.companyId,
    slug: knowledge.companySlug,
    status: knowledge.status,
    industry: knowledge.industry,
    products: knowledge.products.map((p) => p.name),
  });
  const resolutionHash = hashJsonStable(resolution);
  const specHash = specification.contentHash ?? hashJsonStable(specification);
  const promptHash = prompt.contentHash ?? hashJsonStable({ sections: prompt.sections });

  if (prompt.specificationHash && specification.contentHash && prompt.specificationHash !== specification.contentHash) {
    throw new AppError(
      "BLUEPRINT_SOURCE_MISMATCH",
      "Master Prompt specificationHash does not match current MasterBuildSpecification",
    );
  }

  const permissions: CompanyOSBlueprint["permissionModel"]["permissions"] = [
    { id: "perm_overview_view", resource: "overview", actions: ["VIEW"], description: "View executive overview" },
    { id: "perm_dashboard_view", resource: "dashboards", actions: ["VIEW", "EXPORT"], description: "View and export dashboards" },
    { id: "perm_module_manage", resource: "modules", actions: ["VIEW", "CREATE", "UPDATE"], description: "Operate business modules" },
    { id: "perm_workflow_operate", resource: "workflows", actions: ["VIEW", "UPDATE", "APPROVE"], description: "Operate workflows" },
    { id: "perm_finance_view", resource: "finance", actions: ["VIEW", "EXPORT"], description: "View finance data" },
    { id: "perm_finance_approve", resource: "finance", actions: ["APPROVE"], description: "Approve financial actions" },
    { id: "perm_quality_approve", resource: "quality", actions: ["VIEW", "APPROVE"], description: "Approve quality releases" },
    { id: "perm_procurement_approve", resource: "procurement", actions: ["VIEW", "APPROVE"], description: "Approve procurement" },
    { id: "perm_inventory_manage", resource: "inventory", actions: ["VIEW", "CREATE", "UPDATE"], description: "Manage inventory" },
    { id: "perm_agent_view", resource: "ai-agents", actions: ["VIEW"], description: "View AI agent insights" },
    { id: "perm_admin_manage", resource: "settings", actions: ["VIEW", "MANAGE", "DELETE"], description: "Administer platform settings" },
    { id: "perm_reports_export", resource: "reports", actions: ["VIEW", "EXPORT"], description: "Export reports" },
    { id: "perm_sensitive_export", resource: "sensitive-data", actions: ["EXPORT"], description: "Export sensitive datasets" },
  ];

  const sensitiveOperations = [
    {
      operation: "approve-invoice-payment",
      requiredPermissionIds: ["perm_finance_approve"],
      approvalRequired: true,
      auditRequired: true,
      trace: [{ sourceType: "MASTER_SPECIFICATION" as const, sourceId: "finance", reason: "Financial approval boundary" }],
    },
    {
      operation: "release-quality-hold",
      requiredPermissionIds: ["perm_quality_approve"],
      approvalRequired: true,
      auditRequired: true,
      trace: [{ sourceType: "INDUSTRY_PACK" as const, sourceId: pack.id, reason: "Quality release boundary" }],
    },
    {
      operation: "delete-operational-record",
      requiredPermissionIds: ["perm_admin_manage"],
      approvalRequired: true,
      auditRequired: true,
      trace: [{ sourceType: "MASTER_SPECIFICATION" as const, sourceId: "rbac", reason: "Destructive delete restriction" }],
    },
    {
      operation: "export-sensitive-data",
      requiredPermissionIds: ["perm_sensitive_export"],
      approvalRequired: true,
      auditRequired: true,
      trace: [{ sourceType: "MASTER_SPECIFICATION" as const, sourceId: "rbac", reason: "Sensitive export control" }],
    },
  ];

  const viewerPerms = ["perm_overview_view", "perm_dashboard_view", "perm_agent_view"];
  const operatorPerms = [
    ...viewerPerms,
    "perm_module_manage",
    "perm_workflow_operate",
    "perm_inventory_manage",
    "perm_reports_export",
  ];
  const managerPerms = [
    ...operatorPerms,
    "perm_finance_view",
    "perm_quality_approve",
    "perm_procurement_approve",
  ];
  const execPerms = [...managerPerms, "perm_finance_approve", "perm_reports_export"];
  const adminPerms = permissions.map((p) => p.id);

  const roles: CompanyOSBlueprint["roles"] = [
    {
      id: "role_platform_admin",
      name: "Platform Administrator",
      description: "Full platform configuration without bypassing audit",
      scope: "ADMIN",
      permissions: adminPerms,
      approvalCapabilities: ["settings", "user-roles"],
      dataAccessScope: ["all"],
    },
    {
      id: "role_viewer",
      name: "Viewer",
      description: "Read-only operational visibility",
      scope: "VIEWER",
      permissions: viewerPerms,
      approvalCapabilities: [],
      dataAccessScope: ["non-sensitive"],
    },
    ...specification.roles.slice(0, 12).map((r) => {
      const scope =
        /ceo|executive/i.test(r.title)
          ? ("EXECUTIVE" as const)
          : /manager|head|lead/i.test(r.title)
            ? ("MANAGER" as const)
            : /analyst/i.test(r.title)
              ? ("ANALYST" as const)
              : ("OPERATOR" as const);
      return {
        id: r.id.startsWith("role_") ? r.id : `role_${kebab(r.id)}`,
        name: r.title,
        description: `${r.title} from planning specification`,
        departmentId: r.departmentId,
        scope,
        permissions:
          scope === "EXECUTIVE" ? execPerms : scope === "MANAGER" ? managerPerms : operatorPerms,
        approvalCapabilities: isSensitiveDept(r.title) ? ["department-approvals"] : [],
        dataAccessScope: ["department"],
      };
    }),
  ];

  // Deduplicate role ids
  const roleMap = new Map<string, CompanyOSBlueprint["roles"][number]>();
  for (const r of roles) roleMap.set(r.id, r);
  const uniqueRoles = [...roleMap.values()];
  const defaultAudience = uniqueRoles
    .filter((r) => r.scope === "EXECUTIVE" || r.scope === "MANAGER" || r.id === "role_platform_admin")
    .map((r) => r.id)
    .slice(0, 4);
  if (!defaultAudience.length) defaultAudience.push(uniqueRoles[0]!.id);

  const rankedDashboards = [...specification.dashboards]
    .sort((a, b) => {
      const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, limits.maxTotalDashboards);

  let highDashCount = 0;
  const dashboards: CompanyOSBlueprint["dashboards"] = rankedDashboards.map((d, idx) => {
    let priority = d.priority;
    if (priority === "HIGH") {
      highDashCount += 1;
      if (highDashCount > limits.maxHighDashboards) priority = "MEDIUM";
    }
    const sectionId = `sec_${kebab(d.id)}_main`;
    const kpis = specification.kpis.filter((k) => d.kpiIds.includes(k.id)).slice(0, 8);
    const widgets = kpis.slice(0, limits.maxWidgetsPerDashboard).map((k, wIdx) => ({
      id: `w_${kebab(d.id)}_${wIdx}`,
      sectionId,
      title: k.name,
      type: widgetForKpi(k.name, k.unit, k.direction),
      kpiIds: [k.id],
      dataEntityIds: [],
      filters: ["date-range"],
      description: k.description,
      priority: k.priority,
    }));
    if (widgets.length < 2) {
      widgets.push({
        id: `w_${kebab(d.id)}_insight`,
        sectionId,
        title: "AI insight",
        type: "AI_INSIGHT",
        kpiIds: [],
        dataEntityIds: [],
        filters: [],
        description: "Planning-only AI insight panel",
        priority: "LOW",
      });
    }
    return {
      id: d.id,
      name: d.name,
      route: route("dashboards", d.name),
      audienceRoleIds: defaultAudience,
      purpose: d.purpose,
      priority,
      layout: {
        columns: 12,
        sections: [
          { id: sectionId, title: d.name, order: 1, width: "FULL" as const },
          ...(d.sections.slice(0, 3).map((title, i) => ({
            id: `sec_${kebab(d.id)}_${i + 2}`,
            title,
            order: i + 2,
            width: "HALF" as const,
          })) || []),
        ],
      },
      widgets,
      trace: [
        {
          sourceType: "MASTER_SPECIFICATION" as const,
          sourceId: d.id,
          reason: "Prioritized dashboard from MasterBuildSpecification",
        },
      ],
    };
  });

  for (const role of uniqueRoles) {
    if (!role.defaultDashboardId && dashboards[0]) {
      role.defaultDashboardId = dashboards[0].id;
    }
  }

  const manufacturingOrder = [
    "overview",
    "sales",
    "demand",
    "production",
    "quality",
    "inventory",
    "warehouse",
    "procurement",
    "maintenance",
    "distribution",
    "finance",
    "project",
    "complaint",
    "ai",
    "report",
    "setting",
  ];

  const moduleSources = [
    ...dashboards.map((d) => ({ name: d.name, priority: d.priority, from: d.id })),
    ...specification.workflows
      .filter((w) => w.priority !== "LOW")
      .slice(0, 8)
      .map((w) => ({ name: w.department || w.name, priority: w.priority, from: w.id })),
  ];

  const moduleMap = new Map<string, CompanyOSBlueprint["modules"][number]>();
  for (const src of moduleSources) {
    const key = kebab(src.name).split("-")[0] ?? kebab(src.name);
    if (moduleMap.has(key)) continue;
    if (moduleMap.size >= limits.maxModules) break;
    const routePrefix = route(key);
    moduleMap.set(key, {
      id: `mod_${key}`,
      name: src.name,
      routePrefix,
      description: `Module for ${src.name}`,
      priority: src.priority,
      pages: [
        {
          id: `page_${key}_list`,
          name: `${src.name} list`,
          route: `${routePrefix}/list`,
          type: "LIST",
          requiredPermissionIds: ["perm_module_manage"],
          components: ["DataTable", "FilterBar"],
          actions: ["view", "create"],
        },
        {
          id: `page_${key}_detail`,
          name: `${src.name} detail`,
          route: `${routePrefix}/:id`,
          type: "DETAIL",
          requiredPermissionIds: ["perm_module_manage"],
          components: ["DetailPanel", "ActivityTimeline"],
          actions: ["view", "update"],
        },
      ],
      trace: [
        {
          sourceType: "MASTER_SPECIFICATION",
          sourceId: src.from,
          reason: "Derived from prioritized specification item",
        },
      ],
    });
  }

  // Ensure overview + settings modules
  if (!moduleMap.has("overview")) {
    moduleMap.set("overview", {
      id: "mod_overview",
      name: "Overview",
      routePrefix: "/overview",
      description: "Executive overview",
      priority: "HIGH",
      pages: [
        {
          id: "page_overview",
          name: "Overview",
          route: "/overview",
          type: "DASHBOARD",
          requiredPermissionIds: ["perm_overview_view"],
          components: ["KpiStrip"],
          actions: ["view"],
        },
      ],
      trace: [
        {
          sourceType: "MASTER_SPECIFICATION",
          sourceId: "overview",
          reason: "Core shell module",
        },
      ],
    });
  }
  moduleMap.set("settings", {
    id: "mod_settings",
    name: "Settings",
    routePrefix: "/settings",
    description: "Platform settings",
    priority: "MEDIUM",
    pages: [
      {
        id: "page_settings",
        name: "Settings",
        route: "/settings",
        type: "SETTINGS",
        requiredPermissionIds: ["perm_admin_manage"],
        components: ["SettingsForm"],
        actions: ["manage"],
      },
    ],
    trace: [
      {
        sourceType: "MASTER_SPECIFICATION",
        sourceId: "settings",
        reason: "Platform administration",
      },
    ],
  });

  const modules = [...moduleMap.values()].sort((a, b) => {
    const ai = manufacturingOrder.findIndex((k) => a.id.includes(k) || a.routePrefix.includes(k));
    const bi = manufacturingOrder.findIndex((k) => b.id.includes(k) || b.routePrefix.includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const navigation: CompanyOSBlueprint["navigation"] = {
    primary: [
      ...dashboards.slice(0, 8).map((d) => ({
        id: `nav_${d.id}`,
        label: d.name,
        route: d.route,
        type: "DASHBOARD" as const,
        requiredPermissions: ["perm_dashboard_view"],
        children: [],
      })),
      ...modules
        .filter((m) => m.id !== "mod_settings")
        .slice(0, 10)
        .map((m) => ({
          id: `nav_${m.id}`,
          label: m.name,
          route: m.routePrefix,
          type: "MODULE" as const,
          requiredPermissions: ["perm_module_manage"],
          children: m.pages.map((p) => ({
            id: `nav_${p.id}`,
            label: p.name,
            route: p.route,
            type: (p.type === "LIST" ? "LIST" : p.type === "DETAIL" ? "DETAIL" : "PAGE") as
              | "PAGE"
              | "LIST"
              | "DETAIL"
              | "FORM"
              | "REPORT"
              | "AGENT",
            requiredPermissions: p.requiredPermissionIds,
          })),
        })),
      {
        id: "nav_ai",
        label: "AI Assistants",
        route: "/ai-assistants",
        type: "AI_AGENT",
        requiredPermissions: ["perm_agent_view"],
        children: [],
      },
      {
        id: "nav_reports",
        label: "Reports",
        route: "/reports",
        type: "REPORT",
        requiredPermissions: ["perm_reports_export"],
        children: [],
      },
    ],
    utility: [
      {
        id: "nav_settings",
        label: "Settings",
        route: "/settings",
        requiredPermissions: ["perm_admin_manage"],
      },
    ],
  };

  const workflows: CompanyOSBlueprint["workflows"] = specification.workflows
    .slice(0, limits.maxWorkflows)
    .map((w) => {
      const states = ["draft", ...w.stages.map((_, i) => `stage_${i + 1}`), "completed"];
      const stages = w.stages.map((name, i) => ({
        id: `st_${kebab(w.id)}_${i + 1}`,
        name,
        order: i + 1,
        responsibleRoleIds: defaultAudience.slice(0, 2),
        requiredInputs: i === 0 ? ["trigger-context"] : [`stage_${i}_output`],
        outputs: [`stage_${i + 1}_output`],
        allowedActions: ["advance", "reject", "comment"],
        approvalRequired: isSensitiveDept(w.department) || /quality|finance|procurement|release/i.test(w.name),
        slaHours: isSensitiveDept(w.department) ? 24 : 48,
      }));
      const transitions = states.slice(0, -1).map((from, i) => ({
        from,
        to: states[i + 1]!,
        action: i === states.length - 2 ? "complete" : "advance",
        requiredRoleIds: defaultAudience.slice(0, 2),
        conditions: stages[i]?.approvalRequired ? ["approval-granted"] : [],
      }));
      return {
        id: w.id,
        name: w.name,
        department: w.department,
        purpose: w.purpose,
        priority: w.priority,
        trigger: {
          type: "MANUAL" as const,
          description: `Manual or record-driven start for ${w.name}`,
        },
        stages,
        states,
        transitions,
        notifications: [
          {
            event: "stage-advanced",
            recipientRoleIds: defaultAudience.slice(0, 2),
            channel: "IN_APP" as const,
            messagePurpose: "Notify responsible roles of workflow progress",
          },
        ],
        auditRequired: isSensitiveDept(w.department) || /quality|finance|procurement/i.test(w.name),
        trace: [
          {
            sourceType: "MASTER_SPECIFICATION" as const,
            sourceId: w.id,
            reason: "Workflow expanded from MasterBuildSpecification",
          },
        ],
      };
    });

  const agents: CompanyOSBlueprint["agents"] = specification.agents.slice(0, limits.maxAgents).map((a) => ({
    id: a.id,
    name: a.name,
    department: a.department,
    mission: a.mission,
    priority: a.priority,
    executionMode:
      a.permissions === "READ_ONLY"
        ? ("READ_ONLY" as const)
        : a.permissions === "SUGGEST"
          ? ("SUGGEST" as const)
          : ("APPROVAL_REQUIRED" as const),
    inputs: a.inputs.slice(0, 5).map((desc) => ({
      sourceType: "USER_QUERY" as const,
      description: desc,
    })),
    outputs: a.outputs.slice(0, 5).map((desc) => ({
      type: /forecast/i.test(desc)
        ? ("FORECAST" as const)
        : /alert/i.test(desc)
          ? ("ALERT" as const)
          : ("RECOMMENDATION" as const),
      description: desc,
    })),
    tools: [
      { id: `tool_${kebab(a.id)}_query`, type: "DATA_QUERY" as const, readOnly: true },
      { id: `tool_${kebab(a.id)}_report`, type: "REPORTING" as const, readOnly: true },
    ],
    approvalBoundary: "Agents may only draft insights; humans approve operational actions.",
    prohibitedActions: [
      "direct-database-writes",
      "shell-execution",
      "credential-access",
      "automatic-financial-approval",
      "automatic-production-shutdown",
      "automatic-supplier-selection",
    ],
    visibilityRoleIds: defaultAudience,
    trace: [
      {
        sourceType: "MASTER_SPECIFICATION" as const,
        sourceId: a.id,
        reason: "Agent roster from MasterBuildSpecification",
      },
    ],
  }));

  // Data model from pack + food/manufacturing relevance
  const preferredEntityNames = [
    "Customer",
    "Product",
    "ProductCategory",
    "SalesOrder",
    "SalesOrderItem",
    "ProductionPlan",
    "ProductionOrder",
    "ProductionBatch",
    "ProductionLine",
    "Machine",
    "DowntimeIncident",
    "MaintenanceWorkOrder",
    "QualityInspection",
    "QualityNonConformance",
    "RawMaterial",
    "Supplier",
    "PurchaseOrder",
    "GoodsReceipt",
    "InventoryItem",
    "Warehouse",
    "StockMovement",
    "FinishedGoodsLot",
    "Shipment",
    "Invoice",
    "Payment",
    "Employee",
    "Department",
    "Notification",
    "AuditLog",
    "AIInsight",
  ];

  const corpus = [
    knowledge.industry.primary,
    ...knowledge.industry.secondary,
    knowledge.identity.description,
    ...knowledge.products.map((p) => p.name),
    ...specification.workflows.map((w) => w.name),
  ]
    .join(" ")
    .toLowerCase();

  const packEntities = pack.mockSchema.entities.slice(0, limits.maxEntities);
  const entities: CompanyOSBlueprint["dataModel"]["entities"] = packEntities.map((e) => {
    const fields = e.fields.map((f, idx) => ({
      id: `fld_${e.id}_${idx}`,
      name: f.name,
      label: f.name,
      type: (f.type === "REFERENCE"
        ? "REFERENCE"
        : f.type === "ENUM"
          ? "ENUM"
          : f.type === "BOOLEAN"
            ? "BOOLEAN"
            : f.type === "NUMBER"
              ? "NUMBER"
              : f.type === "DATE"
                ? "DATE"
                : f.type === "DATETIME"
                  ? "DATETIME"
                  : f.type === "CURRENCY"
                    ? "CURRENCY"
                    : "STRING") as CompanyOSBlueprint["dataModel"]["entities"][number]["fields"][number]["type"],
      required: f.required,
      unique: false,
      indexed: f.required,
      referenceEntityId: f.referenceEntityId,
      enumValues: f.enumValues,
      validationRules: f.required ? ["required"] : [],
      sensitive: /salary|password|secret|token|iban|national/i.test(f.name),
    }));
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      source: "INDUSTRY_DEFAULT" as const,
      fields,
      auditFieldsRequired: true,
      trace: [
        {
          sourceType: "INDUSTRY_PACK" as const,
          sourceId: e.id,
          reason: "Industry pack mock entity expanded to logical model",
        },
      ],
    };
  });

  // Add missing preferred entities as stubs when manufacturing-relevant
  for (const name of preferredEntityNames) {
    if (entities.length >= limits.maxEntities) break;
    if (entities.some((e) => e.name.toLowerCase() === name.toLowerCase())) continue;
    const relevant =
      /manufactur|food|pasta|production|quality|inventory|sales|distribution/.test(corpus) ||
      pack.id === "manufacturing";
    if (!relevant && !/Notification|AuditLog|AIInsight|Department|Employee/.test(name)) continue;
    if (
      /FinishedGoodsLot|ProductionBatch|RawMaterial|QualityHold|Expiry/.test(name) &&
      !/food|pasta|batch|quality|inventory|manufactur|تولید|غذایی|پاستا|ماکارون/.test(corpus) &&
      pack.id !== "manufacturing"
    ) {
      continue;
    }
    const id = `ent_${kebab(name)}`;
    entities.push({
      id,
      name,
      description: `Logical entity ${name}`,
      source: "COMBINED",
      fields: [
        {
          id: `fld_${id}_id`,
          name: "id",
          label: "ID",
          type: "STRING",
          required: true,
          unique: true,
          indexed: true,
          validationRules: ["required", "unique"],
          sensitive: false,
        },
        {
          id: `fld_${id}_status`,
          name: "status",
          label: "Status",
          type: "ENUM",
          required: true,
          unique: false,
          indexed: true,
          enumValues: ["draft", "active", "closed"],
          validationRules: ["required"],
          sensitive: false,
        },
      ],
      statusField: {
        fieldId: `fld_${id}_status`,
        allowedValues: ["draft", "active", "closed"],
        initialValue: "draft",
      },
      auditFieldsRequired: true,
      trace: [
        {
          sourceType: "INDUSTRY_PACK",
          sourceId: pack.id,
          reason: "Manufacturing-relevant logical entity",
        },
      ],
    });
  }

  const entityIds = new Set(entities.map((e) => e.id));
  const relationships: CompanyOSBlueprint["dataModel"]["relationships"] = pack.mockSchema.relationships
    .filter((r) => entityIds.has(r.fromEntityId) && entityIds.has(r.toEntityId))
    .map((r, idx) => ({
      id: `rel_${idx}_${shortStableHash(`${r.fromEntityId}-${r.toEntityId}`)}`,
      fromEntityId: r.fromEntityId,
      toEntityId: r.toEntityId,
      type: r.type,
      name: r.description.slice(0, 80),
      required: false,
      cascadeBehavior: "RESTRICT" as const,
    }));

  const mockDataPlan: CompanyOSBlueprint["mockDataPlan"] = {
    strategy: "DETERMINISTIC",
    locale: specification.company.primaryLanguage.startsWith("fa") ? "fa-IR" : "en-US",
    currency: undefined,
    timeRange: { start: "2025-01-01", end: "2026-06-30" },
    entityVolumes: entities.slice(0, 20).map((e, i) => ({
      entityId: e.id,
      targetCount: e.name === "Department" ? 8 : e.name === "Product" ? 40 : 20 + (i % 5) * 5,
      notes: "Plan only — no records generated in Phase 3",
    })),
    scenarios: [
      {
        id: "scn_normal_week",
        name: "Normal production week",
        description: "Baseline production and fulfillment",
        affectedEntityIds: entities.slice(0, 6).map((e) => e.id),
        expectedDashboardEffects: ["Stable throughput KPIs"],
      },
      {
        id: "scn_downtime",
        name: "Unplanned downtime event",
        description: "Line stoppage affecting OEE",
        affectedEntityIds: entities.filter((e) => /downtime|machine|production/i.test(e.name)).map((e) => e.id),
        expectedDashboardEffects: ["Elevated downtime alerts"],
      },
      {
        id: "scn_quality_hold",
        name: "Quality hold",
        description: "Batch held pending inspection",
        affectedEntityIds: entities.filter((e) => /quality|batch|lot/i.test(e.name)).map((e) => e.id),
        expectedDashboardEffects: ["Quality hold quantity rises"],
      },
      {
        id: "scn_low_rm",
        name: "Low raw-material stock",
        description: "Shortage risk on critical inputs",
        affectedEntityIds: entities.filter((e) => /raw|inventory|supplier/i.test(e.name)).map((e) => e.id),
        expectedDashboardEffects: ["Stockout risk indicators"],
      },
      {
        id: "scn_overdue_ar",
        name: "Overdue receivables",
        description: "Aging invoices",
        affectedEntityIds: entities.filter((e) => /invoice|payment|customer/i.test(e.name)).map((e) => e.id),
        expectedDashboardEffects: ["AR aging widgets increase"],
      },
    ],
    consistencyRules: [
      "Sales order quantities must reconcile to shipments",
      "Inventory movements must balance lot quantities",
      "Quality holds must block finished-goods release",
    ],
    prohibitedContent: [
      "real personal identities",
      "real API keys",
      "fabricated confidential KPIs presented as facts",
    ],
  };

  const integrations: CompanyOSBlueprint["integrations"] = specification.integrations.slice(0, 12).map((i, idx) => ({
    id: `int_${idx}_${kebab(i.name)}`,
    name: i.name,
    category: i.category ?? "general",
    status:
      i.status === "CONFIRMED"
        ? ("CONFIRMED" as const)
        : i.status === "INFERRED"
          ? ("INFERRED" as const)
          : ("RECOMMENDED" as const),
    purpose: i.purpose ?? "Recommended integration",
    direction: "BIDIRECTIONAL" as const,
    authenticationType: "UNKNOWN" as const,
    requiredForMvp: i.status === "CONFIRMED",
    implementationNotes: ["Planning only — not connected in Phase 3"],
  }));

  const unresolvedQuestions: CompanyOSBlueprint["unresolvedQuestions"] = [
    ...specification.unresolvedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      reason: q.reason,
      blocking: q.blocking,
      category: /erp|system|integrat/i.test(q.question)
        ? ("INTEGRATION" as const)
        : /warehouse|site|line|factory/i.test(q.question)
          ? ("DATA" as const)
          : /role|approval|permission/i.test(q.question)
            ? ("SECURITY" as const)
            : ("BUSINESS" as const),
    })),
    {
      id: "q_currency",
      question: "Which currency should the OS use for financial widgets?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
      category: "DATA",
    },
    {
      id: "q_calendar",
      question: "Should the OS use Gregorian or Persian calendar for planning views?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
      category: "DESIGN",
    },
    {
      id: "q_factories",
      question: "How many factories or production lines are in scope?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
      category: "BUSINESS",
    },
  ];

  const assumptions: CompanyOSBlueprint["assumptions"] = [
    ...specification.assumptions,
    {
      id: "asm_stack",
      field: "recommendedStack",
      assumption: "Future generation may use Next.js + PostgreSQL + Prisma",
      reason: "Repository planning default — not installed in Phase 3",
      requiresConfirmation: true,
    },
  ];

  const implementationPlan: CompanyOSBlueprint["implementationPlan"] = {
    recommendedStack: {
      frontend: "Next.js + TypeScript",
      backend: "Next.js server/API or modular Node service",
      database: "PostgreSQL",
      orm: "Prisma",
      authentication: "Role-based application auth",
      charts: "Recharts",
      ui: "Tailwind CSS + shadcn/ui",
      deploymentTarget: "PM2 initially (planning recommendation only)",
    },
    workstreams: [
      {
        id: "ws_foundation",
        name: "Foundation and application shell",
        objective: "App shell, RTL layout, navigation",
        dependencies: [],
        outputs: ["shell"],
        priority: "HIGH",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "nav", reason: "Shell required for all modules" }],
      },
      {
        id: "ws_rbac",
        name: "Authentication and RBAC",
        objective: "Implement permission model",
        dependencies: ["ws_foundation"],
        outputs: ["rbac"],
        priority: "HIGH",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "rbac", reason: "Security boundary" }],
      },
      {
        id: "ws_data",
        name: "Core data model",
        objective: "Logical entities and relationships",
        dependencies: ["ws_foundation"],
        outputs: ["schema"],
        priority: "HIGH",
        trace: [{ sourceType: "INDUSTRY_PACK", sourceId: pack.id, reason: "Data foundation" }],
      },
      {
        id: "ws_dashboards",
        name: "Dashboard framework",
        objective: "KPI widgets and layouts",
        dependencies: ["ws_data"],
        outputs: ["dashboards"],
        priority: "HIGH",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "dashboards", reason: "Executive visibility" }],
      },
      {
        id: "ws_modules",
        name: "Business modules",
        objective: "CRUD modules for prioritized domains",
        dependencies: ["ws_data", "ws_rbac"],
        outputs: ["modules"],
        priority: "HIGH",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "modules", reason: "Operational modules" }],
      },
      {
        id: "ws_workflows",
        name: "Workflow runtime",
        objective: "State machines for prioritized workflows",
        dependencies: ["ws_modules"],
        outputs: ["workflows"],
        priority: "MEDIUM",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "workflows", reason: "Process automation planning" }],
      },
      {
        id: "ws_mock",
        name: "Mock-data engine",
        objective: "Deterministic fixtures from mock-data plan",
        dependencies: ["ws_data"],
        outputs: ["mock-data"],
        priority: "MEDIUM",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "mock", reason: "Demo data planning" }],
      },
      {
        id: "ws_agents",
        name: "AI agent read-only layer",
        objective: "Insight agents with approval boundaries",
        dependencies: ["ws_dashboards"],
        outputs: ["agents"],
        priority: "MEDIUM",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "agents", reason: "AI planning records" }],
      },
      {
        id: "ws_quality",
        name: "Quality verification",
        objective: "Acceptance tests for generated OS",
        dependencies: ["ws_modules", "ws_dashboards"],
        outputs: ["qa"],
        priority: "HIGH",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "quality", reason: "Readiness gate" }],
      },
      {
        id: "ws_deploy",
        name: "Build and deployment",
        objective: "Future deploy pipeline (not executed in Phase 3)",
        dependencies: ["ws_quality"],
        outputs: ["deploy-plan"],
        priority: "LOW",
        trace: [{ sourceType: "MASTER_SPECIFICATION", sourceId: "deploy", reason: "Deferred deployment" }],
      },
    ],
    phases: [
      {
        id: "phase_a",
        name: "Foundation",
        objective: "Shell + RBAC + data model",
        workstreamIds: ["ws_foundation", "ws_rbac", "ws_data"],
        acceptanceCriteria: ["Navigation renders", "RBAC enforced", "Entities defined"],
      },
      {
        id: "phase_b",
        name: "Operations MVP",
        objective: "Dashboards + modules + workflows",
        workstreamIds: ["ws_dashboards", "ws_modules", "ws_workflows", "ws_mock"],
        acceptanceCriteria: ["Prioritized dashboards live with mock plan"],
      },
      {
        id: "phase_c",
        name: "Intelligence & hardening",
        objective: "Agents + QA",
        workstreamIds: ["ws_agents", "ws_quality"],
        acceptanceCriteria: ["Agents remain non-executing", "QA gates pass"],
      },
    ],
    generationOrder: [
      "foundation",
      "rbac",
      "data-model",
      "dashboards",
      "modules",
      "workflows",
      "mock-data",
      "agents",
      "quality",
    ],
  };

  const draftWithoutQuality = {
    schemaVersion: "1.0" as const,
    blueprintId: `bp_${shortStableHash(`${knowledge.companySlug}:${specHash}:${promptHash}`)}`,
    company: {
      id: knowledge.companyId,
      slug: knowledge.companySlug,
      displayName: knowledge.displayName,
      description: knowledge.identity.description,
      officialWebsite: knowledge.identity.officialWebsite,
      industryPackId: pack.id,
      language: specification.company.primaryLanguage,
      supportedLanguages: specification.branding.languages,
      rtl: specification.company.rtl,
      canonicalSlugSuggestion: suggestCanonicalSlug(knowledge.displayName),
    },
    sourceArtifacts: {
      companyKnowledgeHash: knowledgeHash,
      industryResolutionHash: resolutionHash,
      masterBuildSpecificationHash: specHash,
      masterPromptHash: promptHash,
    },
    productDefinition: {
      name: `${knowledge.displayName} Company OS`,
      type: "COMPANY_OS" as const,
      objective: "Provide operational visibility and controlled workflows for company leaders",
      primaryUsers: uniqueRoles.slice(0, 6).map((r) => r.name),
      primaryBusinessOutcomes: specification.objectives.slice(0, 6).map((o) => o.title),
      scopeSummary: "Blueprint for dashboards, modules, workflows, RBAC, and logical data model",
      outOfScope: [
        "Source-code generation",
        "Live integrations",
        "Executable AI agents",
        "Deployment",
        "Actual mock records",
      ],
    },
    experience: {
      uiLanguage: specification.company.primaryLanguage,
      rtl: specification.company.rtl,
      designDirection: {
        style: "OPERATIONAL" as const,
        theme: "BRAND_DRIVEN" as const,
        density: "MIXED" as const,
        brandingNotes: [
          specification.company.rtl ? "RTL layout required" : "LTR layout",
          `Primary language: ${specification.company.primaryLanguage}`,
        ],
      },
      globalPatterns: [
        { id: "gp_search", type: "GLOBAL_SEARCH" as const, description: "Global search", priority: "HIGH" as const },
        { id: "gp_notify", type: "NOTIFICATIONS" as const, description: "In-app notifications", priority: "HIGH" as const },
        { id: "gp_filters", type: "FILTER_BAR" as const, description: "Shared filter bar", priority: "MEDIUM" as const },
        { id: "gp_approval", type: "APPROVAL_INBOX" as const, description: "Approval inbox", priority: "HIGH" as const },
        { id: "gp_ai", type: "AI_ASSISTANT" as const, description: "AI assistant entry", priority: "MEDIUM" as const },
      ],
    },
    navigation,
    roles: uniqueRoles,
    permissionModel: {
      strategy: "RBAC" as const,
      permissions,
      sensitiveOperations,
    },
    dashboards,
    modules,
    workflows,
    agents,
    dataModel: {
      entities,
      relationships,
      calculatedFields: specification.kpis.slice(0, 5).map((k) => ({
        id: `calc_${k.id}`,
        entityId: entities[0]?.id ?? "ent_unknown",
        name: k.name,
        description: k.description,
        formulaDescription: `Derived from KPI ${k.name} (${k.unit})`,
        sourceFieldIds: [],
      })),
    },
    mockDataPlan,
    integrations,
    notifications: {
      channels: ["IN_APP" as const, "EMAIL" as const, "TELEGRAM" as const],
      eventCatalog: [
        {
          id: "ev_workflow",
          event: "workflow.approval_required",
          recipients: defaultAudience,
          severity: "WARNING" as const,
          defaultChannels: ["IN_APP" as const],
        },
        {
          id: "ev_quality",
          event: "quality.hold_created",
          recipients: defaultAudience,
          severity: "CRITICAL" as const,
          defaultChannels: ["IN_APP" as const, "TELEGRAM" as const],
        },
      ],
    },
    reports: dashboards.slice(0, 5).map((d) => ({
      id: `rpt_${d.id}`,
      name: `${d.name} report`,
      audienceRoleIds: d.audienceRoleIds,
      dataEntityIds: entities.slice(0, 3).map((e) => e.id),
      kpiIds: d.widgets.flatMap((w) => w.kpiIds).slice(0, 5),
      filters: ["date-range"],
      exportFormats: ["CSV" as const, "PDF" as const],
      scheduleSupported: true,
    })),
    implementationPlan,
    assumptions,
    unresolvedQuestions,
    generatedAt: now,
    updatedAt: now,
  };

  const quality = calculateBlueprintQuality({
    knowledge,
    specification,
    blueprint: draftWithoutQuality,
  });

  const withQuality = { ...draftWithoutQuality, quality };
  const contentHash = hashBlueprintContent(withQuality as unknown as Record<string, unknown>);
  return parseCompanyOSBlueprint({ ...withQuality, contentHash });
}

export function buildBlueprintSummary(blueprint: CompanyOSBlueprint): BlueprintSummary {
  const pages = blueprint.modules.reduce((n, m) => n + m.pages.length, 0);
  return {
    schemaVersion: "1.0",
    companySlug: blueprint.company.slug,
    displayName: blueprint.company.displayName,
    industryPackId: blueprint.company.industryPackId,
    counts: {
      modules: blueprint.modules.length,
      dashboards: blueprint.dashboards.length,
      workflows: blueprint.workflows.length,
      roles: blueprint.roles.length,
      agents: blueprint.agents.length,
      entities: blueprint.dataModel.entities.length,
      pages,
    },
    quality: {
      completenessScore: blueprint.quality.completenessScore,
      consistencyScore: blueprint.quality.consistencyScore,
      traceabilityScore: blueprint.quality.traceabilityScore,
      securityScore: blueprint.quality.securityScore,
      implementationReadinessScore: blueprint.quality.implementationReadinessScore,
      readyForCodeGeneration: blueprint.quality.readyForCodeGeneration,
    },
    blockingReasons: blueprint.quality.blockingReasons,
    warnings: blueprint.quality.warnings,
    generatedAt: blueprint.generatedAt,
    contentHash: blueprint.contentHash,
  };
}
