import { createHash } from "node:crypto";
import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { IndustryPack } from "../industries/industry-pack-schema.js";
import type { IndustryResolution } from "../industries/industry-resolver.js";
import {
  parseMasterBuildSpecification,
  type MasterBuildSpecification,
} from "./master-build-specification-schema.js";
import { nowIso, shortStableHash } from "../shared/ids.js";

export type SpecLimits = {
  maxHighDashboards: number;
  maxHighWorkflows: number;
  maxInitialAgents: number;
  maxInitialKpis: number;
};

const DEFAULT_LIMITS: SpecLimits = {
  maxHighDashboards: 8,
  maxHighWorkflows: 15,
  maxInitialAgents: 10,
  maxInitialKpis: 30,
};

function relevanceCorpus(knowledge: CompanyKnowledge): string {
  return [
    knowledge.industry.primary,
    ...knowledge.industry.secondary,
    knowledge.identity.description,
    ...knowledge.products.map((p) => p.name),
    ...knowledge.painPoints.map((p) => `${p.title} ${p.description}`),
    ...knowledge.processes.map((p) => p.name),
    ...knowledge.aiUseCases.map((a) => a.title),
  ]
    .join(" ")
    .toLowerCase();
}

function scoreText(haystack: string, needle: string): number {
  const tokens = needle
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/)
    .filter((t) => t.length > 2);
  if (!tokens.length) return 0;
  let hits = 0;
  for (const t of tokens) if (haystack.includes(t)) hits += 1;
  let score = hits / tokens.length;
  // Boost operational keywords that appear in company evidence
  const boostTerms = [
    "production",
    "quality",
    "inventory",
    "warehouse",
    "sales",
    "demand",
    "procurement",
    "distribution",
    "maintenance",
    "finance",
    "food",
    "safety",
    "packaging",
    "fulfillment",
    "تولید",
    "کیفیت",
    "انبار",
    "فروش",
    "توزیع",
  ];
  for (const term of boostTerms) {
    if (needle.toLowerCase().includes(term) && haystack.includes(term)) {
      score += 0.2;
    }
  }
  return Math.min(1, score);
}

function priorityFromScore(score: number, defaultHigh = false): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 0.35 || defaultHigh) return "HIGH";
  if (score >= 0.15) return "MEDIUM";
  return "LOW";
}

export function buildMasterBuildSpecification(input: {
  knowledge: CompanyKnowledge;
  pack: IndustryPack;
  resolution: IndustryResolution;
  limits?: Partial<SpecLimits>;
}): MasterBuildSpecification {
  const limits = { ...DEFAULT_LIMITS, ...input.limits };
  const knowledge = input.knowledge;
  const pack = input.pack;
  const now = nowIso();
  const corpus = relevanceCorpus(knowledge);

  const deptMap = new Map<string, MasterBuildSpecification["departments"][number]>();
  for (const d of knowledge.departments) {
    deptMap.set(d.name.toLowerCase(), {
      id: d.id,
      name: d.name,
      source: d.inferred ? "INFERRED" : "CONFIRMED",
    });
  }
  for (const d of pack.departments) {
    const key = d.name.toLowerCase();
    if (!deptMap.has(key)) {
      deptMap.set(key, {
        id: d.id,
        name: d.name,
        description: d.description,
        source: "INDUSTRY_DEFAULT",
      });
    }
  }

  const roles: MasterBuildSpecification["roles"] = [];
  for (const r of knowledge.roles) {
    roles.push({
      id: r.id,
      title: r.title,
      departmentId: r.departmentId ?? "unknown",
      source: r.inferred ? "INFERRED" : "CONFIRMED",
    });
  }
  for (const r of pack.roles) {
    if (!roles.some((x) => x.title.toLowerCase() === r.title.toLowerCase())) {
      roles.push({
        id: r.id,
        title: r.title,
        departmentId: r.departmentId,
        source: "INDUSTRY_DEFAULT",
      });
    }
  }

  const scoredKpis = pack.kpis
    .map((k) => {
      const score = scoreText(corpus, `${k.name} ${k.description} ${k.department ?? ""}`);
      return { k, score, priority: priorityFromScore(score) };
    })
    .sort((a, b) => b.score - a.score);
  let highKpi = 0;
  const kpis = scoredKpis.slice(0, limits.maxInitialKpis).map(({ k, score, priority }) => {
    let p = priority;
    if (p === "HIGH") {
      highKpi += 1;
      if (highKpi > Math.ceil(limits.maxInitialKpis / 3)) p = "MEDIUM";
    }
    return {
      id: k.id,
      name: k.name,
      description: k.description,
      department: k.department,
      unit: k.unit,
      direction: k.direction,
      priority: p,
      source: score > 0.2 ? ("COMBINED" as const) : ("INDUSTRY_DEFAULT" as const),
    };
  });

  const scoredWorkflows = pack.workflowBlueprints
    .map((w) => {
      const score = scoreText(corpus, `${w.name} ${w.purpose} ${w.department}`);
      return { w, score, priority: priorityFromScore(score) };
    })
    .sort((a, b) => b.score - a.score);
  let highWf = 0;
  const workflows = scoredWorkflows.map(({ w, score, priority }) => {
    let p = priority;
    if (p === "HIGH") {
      highWf += 1;
      if (highWf > limits.maxHighWorkflows) p = "MEDIUM";
    }
    return {
      id: w.id,
      name: w.name,
      department: w.department,
      purpose: w.purpose,
      stages: w.stages,
      priority: p,
      source: score > 0.2 ? ("COMBINED" as const) : ("INDUSTRY_DEFAULT" as const),
    };
  });

  const scoredDashboards = pack.dashboardBlueprints
    .map((d) => {
      const score = scoreText(corpus, `${d.name} ${d.purpose} ${d.sections.join(" ")}`);
      return { d, score, priority: priorityFromScore(score, d.name.toLowerCase().includes("ceo")) };
    })
    .sort((a, b) => b.score - a.score);
  let highDash = 0;
  const dashboards = scoredDashboards.map(({ d, priority }) => {
    let p = priority;
    if (p === "HIGH") {
      highDash += 1;
      if (highDash > limits.maxHighDashboards) p = "MEDIUM";
    }
    return {
      id: d.id,
      name: d.name,
      audience: d.audience,
      purpose: d.purpose,
      kpiIds: d.kpiIds.filter((id) => kpis.some((k) => k.id === id)),
      sections: d.sections,
      priority: p,
    };
  });

  const scoredAgents = pack.aiAgentRoster
    .map((a) => {
      const score = scoreText(corpus, `${a.name} ${a.mission} ${a.department ?? ""}`);
      return { a, score, priority: priorityFromScore(score, a.name.toLowerCase().includes("ceo")) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limits.maxInitialAgents);
  const agents = scoredAgents.map(({ a, priority }) => ({
    id: a.id,
    name: a.name,
    mission: a.mission,
    department: a.department,
    inputs: a.inputs,
    outputs: a.outputs,
    permissions: a.permissions,
    priority,
  }));

  const objectives = [
    ...knowledge.painPoints.slice(0, 8).map((p) => ({
      id: `obj_${shortStableHash(p.title)}`,
      title: p.title,
      description: p.description,
      source: "COMPANY_KNOWLEDGE" as const,
      priority: "HIGH" as const,
    })),
    ...pack.ceoConcerns.slice(0, 6).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      source: "INDUSTRY_DEFAULT" as const,
      priority: c.priority,
    })),
  ];

  const integrations = [
    ...knowledge.integrations.map((i) => ({
      name: i.name,
      category: i.category,
      status:
        i.status === "CONFIRMED"
          ? ("CONFIRMED" as const)
          : i.status === "INFERRED"
            ? ("INFERRED" as const)
            : ("RECOMMENDED" as const),
      purpose: undefined,
    })),
    ...pack.recommendedIntegrations.map((i) => ({
      name: i.name,
      category: i.category,
      status: "RECOMMENDED" as const,
      purpose: i.purpose,
    })),
  ];

  const assumptions = [
    {
      id: "asm_pack",
      field: "industryPack",
      assumption: `Industry pack "${pack.id}" is an appropriate planning default`,
      reason: input.resolution.requiresReview
        ? "Industry resolution requires review"
        : "Resolved from company evidence signals",
      requiresConfirmation: input.resolution.requiresReview,
    },
  ];

  const unresolvedQuestions = [
    ...knowledge.gaps.map((g) => ({
      id: `q_${shortStableHash(g.field)}`,
      question: g.requiredUserInput ?? `Clarify ${g.field}`,
      reason: g.reason,
      blocking: g.field === "officialWebsite" || g.field === "products",
    })),
    {
      id: "q_erp",
      question: "Which ERP or accounting system is currently used?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
    },
    {
      id: "q_sites",
      question: "How many production sites or production lines are in scope?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
    },
    {
      id: "q_channels",
      question: "Which sales channels should be connected?",
      reason: "Not confirmed in CompanyKnowledge",
      blocking: false,
    },
  ];

  const blockingReasons: string[] = [];
  if (knowledge.status !== "READY") {
    blockingReasons.push(`CompanyKnowledge status is ${knowledge.status}`);
  }
  if (input.resolution.requiresReview) {
    blockingReasons.push("Industry resolution requires review");
  }
  if (unresolvedQuestions.some((q) => q.blocking)) {
    blockingReasons.push("Blocking unresolved questions remain");
  }

  const specificationConfidence = Number(
    Math.max(
      0,
      Math.min(
        1,
        knowledge.overallConfidence * 0.55 +
          input.resolution.confidence * 0.35 +
          (blockingReasons.length ? -0.1 : 0.1),
      ),
    ).toFixed(3),
  );

  const primaryLanguage =
    knowledge.branding.languages[0] ??
    (/[\u0600-\u06FF]/.test(knowledge.displayName) ? "fa" : "en");

  const draft: MasterBuildSpecification = {
    schemaVersion: "1.0",
    company: {
      id: knowledge.companyId,
      slug: knowledge.companySlug,
      displayName: knowledge.displayName,
      description: knowledge.identity.description,
      officialWebsite: knowledge.identity.officialWebsite,
      primaryLanguage,
      rtl: knowledge.branding.rtlRecommended,
    },
    industry: {
      selectedPackId: pack.id,
      selectedPackName: pack.name,
      confidence: input.resolution.confidence,
      matchedSignals: input.resolution.matchedSignals.map(
        (s) => `${s.field}:${s.matchedAlias}`,
      ),
      alternatives: input.resolution.alternatives.map((a) => a.packId),
      requiresReview: input.resolution.requiresReview,
    },
    objectives,
    departments: [...deptMap.values()],
    roles,
    kpis,
    workflows,
    dashboards,
    agents,
    dataModel: {
      entities: pack.mockSchema.entities,
      relationships: pack.mockSchema.relationships,
    },
    branding: {
      primaryColor: knowledge.branding.primaryColor,
      secondaryColors: knowledge.branding.secondaryColors,
      logoUrl: knowledge.branding.logoUrl,
      tone: knowledge.branding.tone,
      languages: knowledge.branding.languages,
      rtl: knowledge.branding.rtlRecommended,
    },
    integrations,
    constraints: pack.risks.slice(0, 8).map((risk, idx) => ({
      id: `risk_${idx + 1}`,
      title: "Industry risk",
      description: risk,
      severity: "WARNING" as const,
    })),
    assumptions,
    unresolvedQuestions,
    quality: {
      companyKnowledgeConfidence: knowledge.overallConfidence,
      industryResolutionConfidence: input.resolution.confidence,
      specificationConfidence,
      readyForBlueprintGeneration:
        knowledge.status === "READY" &&
        !input.resolution.requiresReview &&
        blockingReasons.length === 0 &&
        specificationConfidence >= 0.65,
      blockingReasons,
    },
    generatedAt: now,
    updatedAt: now,
  };

  const parsed = parseMasterBuildSpecification(draft);
  const contentHash = createHash("sha256")
    .update(
      JSON.stringify({
        ...parsed,
        contentHash: undefined,
        updatedAt: undefined,
        generatedAt: undefined,
      }),
    )
    .digest("hex");
  return { ...parsed, contentHash };
}
