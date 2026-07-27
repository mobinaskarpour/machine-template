import type { CompanyOSBlueprint } from "../../blueprints/company-os-blueprint-schema.js";

export type BrandCssVars = {
  brand: string;
  brandForeground: string;
  brandMuted: string;
};

export type BlueprintRuntimeDocument = {
  schemaVersion: "1.0";
  company: {
    displayName: string;
    slug: string;
    description: string;
    industryPackId: string;
    language: string;
    rtl: boolean;
    officialWebsite: string | null;
  };
  navigation: {
    primary: Array<{ id: string; label: string; route: string }>;
    utility: Array<{ id: string; label: string; route: string }>;
  };
  dashboards: Array<{
    id: string;
    name: string;
    route: string;
    purpose: string;
    priority: string;
    layout: CompanyOSBlueprint["dashboards"][number]["layout"];
    widgets: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      sectionId: string;
      kpiIds: string[];
      dataEntityIds: string[];
    }>;
  }>;
  modules: Array<{
    id: string;
    name: string;
    description: string;
    routePrefix: string;
    priority: string;
    pages: Array<{ id: string; name: string; route: string; type: string }>;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    purpose: string;
    priority: string;
    trigger: CompanyOSBlueprint["workflows"][number]["trigger"];
    stages: CompanyOSBlueprint["workflows"][number]["stages"];
    states: string[];
    transitions: CompanyOSBlueprint["workflows"][number]["transitions"];
    auditRequired: boolean;
  }>;
  agents: Array<{
    id: string;
    name: string;
    mission: string;
    department?: string;
    executionMode: string;
    approvalBoundary: string;
    inputs: CompanyOSBlueprint["agents"][number]["inputs"];
    outputs: CompanyOSBlueprint["agents"][number]["outputs"];
    prohibitedActions: string[];
    tools: CompanyOSBlueprint["agents"][number]["tools"];
  }>;
  roles: Array<{ id: string; name: string; scope: string }>;
  entities: Array<{ id: string; name: string }>;
  assumptions: string[];
  unresolvedQuestions: Array<{ id: string; question: string; blocking: boolean }>;
  demo: {
    authLabel: string;
    currencyAssumption: string;
    calendarAssumption: string;
  };
  brandCssVars: BrandCssVars;
};

const DEFAULT_BRAND: BrandCssVars = {
  brand: "#1b4d3e",
  brandForeground: "#f7f4ef",
  brandMuted: "#e8efe9",
};

const HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

/**
 * Derive brand CSS variables. Blueprint company schema has no primaryColor;
 * fall back to hex hints in brandingNotes, else neutral green.
 */
export function suggestBrandCssVars(blueprint: CompanyOSBlueprint): BrandCssVars {
  const company = blueprint.company as CompanyOSBlueprint["company"] & {
    primaryColor?: string;
    branding?: { primaryColor?: string };
  };
  const candidates = [
    company.primaryColor,
    company.branding?.primaryColor,
    ...blueprint.experience.designDirection.brandingNotes,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = HEX_RE.exec(candidate);
    if (match) {
      return {
        brand: normalizeHex(match[0]),
        brandForeground: DEFAULT_BRAND.brandForeground,
        brandMuted: DEFAULT_BRAND.brandMuted,
      };
    }
  }
  return { ...DEFAULT_BRAND };
}

function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    const r = hex[1]!;
    const g = hex[2]!;
    const b = hex[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

export function renderBlueprintRuntime(blueprint: CompanyOSBlueprint): BlueprintRuntimeDocument {
  const currency =
    blueprint.company.currency ??
    blueprint.mockDataPlan.currency ??
    "IRR";
  const assumptions =
    blueprint.assumptions.length > 0
      ? blueprint.assumptions.map((a) => a.assumption)
      : [
          "Demo data is synthetic and non-authoritative.",
          "Authentication is demo role simulation only.",
        ];

  return {
    schemaVersion: "1.0",
    company: {
      displayName: blueprint.company.displayName,
      slug: blueprint.company.slug,
      description: blueprint.company.description,
      industryPackId: blueprint.company.industryPackId,
      language: blueprint.company.language,
      rtl: blueprint.company.rtl,
      officialWebsite: blueprint.company.officialWebsite ?? null,
    },
    navigation: {
      primary: blueprint.navigation.primary.map((n) => ({
        id: n.id,
        label: n.label,
        route: n.route,
      })),
      utility: blueprint.navigation.utility.map((n) => ({
        id: n.id,
        label: n.label,
        route: n.route,
      })),
    },
    dashboards: blueprint.dashboards.map((d) => ({
      id: d.id,
      name: d.name,
      route: d.route,
      purpose: d.purpose,
      priority: d.priority,
      layout: d.layout,
      widgets: d.widgets.map((w) => ({
        id: w.id,
        type: w.type,
        title: w.title,
        description: w.description,
        sectionId: w.sectionId,
        kpiIds: [...w.kpiIds],
        dataEntityIds: [...w.dataEntityIds],
      })),
    })),
    modules: blueprint.modules.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      routePrefix: m.routePrefix,
      priority: m.priority,
      pages: m.pages.map((p) => ({
        id: p.id,
        name: p.name,
        route: p.route,
        type: p.type,
      })),
    })),
    workflows: blueprint.workflows.map((w) => ({
      id: w.id,
      name: w.name,
      purpose: w.purpose,
      priority: w.priority,
      trigger: w.trigger,
      stages: w.stages,
      states: [...w.states],
      transitions: w.transitions,
      auditRequired: w.auditRequired,
    })),
    agents: blueprint.agents.map((a) => ({
      id: a.id,
      name: a.name,
      mission: a.mission,
      ...(a.department ? { department: a.department } : {}),
      executionMode: a.executionMode,
      approvalBoundary: a.approvalBoundary,
      inputs: a.inputs,
      outputs: a.outputs,
      prohibitedActions: [...a.prohibitedActions],
      tools: a.tools,
    })),
    roles: blueprint.roles.map((r) => ({
      id: r.id,
      name: r.name,
      scope: r.scope,
    })),
    entities: blueprint.dataModel.entities.map((e) => ({
      id: e.id,
      name: e.name,
    })),
    assumptions,
    unresolvedQuestions: blueprint.unresolvedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      blocking: q.blocking,
    })),
    demo: {
      authLabel: "Demo access and role simulation only",
      currencyAssumption: `Demo currency formatting uses ${currency} labels unless confirmed`,
      calendarAssumption: "Demo dates use ISO Gregorian display unless confirmed",
    },
    brandCssVars: suggestBrandCssVars(blueprint),
  };
}
