import { createHash } from "node:crypto";
import type { CompanyKnowledge } from "./company-knowledge-schema.js";
import { AppError } from "../shared/errors.js";
import { parseCompanyKnowledge } from "./company-knowledge-schema.js";

function hasPersian(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function normalizeCompanyKnowledge(
  input: CompanyKnowledge,
): CompanyKnowledge {
  const sources = uniqueBy(input.sources, (s) => s.id);
  const products = uniqueBy(input.products, (p) => p.name);
  const departments = uniqueBy(input.departments, (d) => d.name);

  const rtlRecommended =
    input.branding.rtlRecommended ||
    hasPersian(input.displayName) ||
    input.branding.languages.some((l) => /^(fa|ar|he|ur)/i.test(l));

  return parseCompanyKnowledge({
    ...input,
    sources,
    products,
    departments,
    roles: uniqueBy(input.roles, (r) => r.title),
    customers: uniqueBy(input.customers, (c) => c.segment),
    suppliers: uniqueBy(input.suppliers, (s) => s.segment),
    painPoints: uniqueBy(input.painPoints, (p) => p.title),
    processes: uniqueBy(input.processes, (p) => p.name),
    integrations: uniqueBy(input.integrations, (i) => i.name),
    aiUseCases: uniqueBy(input.aiUseCases, (a) => a.title).map((a) => ({
      ...a,
      inferred: true as const,
    })),
    competitors: uniqueBy(input.competitors, (c) => c.name),
    branding: {
      ...input.branding,
      rtlRecommended,
      secondaryColors: [...new Set(input.branding.secondaryColors)],
      languages: [...new Set(input.branding.languages)],
    },
  });
}

export type ValidationOptions = {
  minReadyConfidence: number;
  minWebsiteConfidence: number;
};

export function semanticValidateKnowledge(
  knowledge: CompanyKnowledge,
  options: ValidationOptions,
): CompanyKnowledge {
  const sourceIds = new Set(knowledge.sources.map((s) => s.id));

  const assertRefs = (refs: string[], context: string) => {
    for (const id of refs) {
      if (!sourceIds.has(id)) {
        throw new AppError(
          "DISCOVERY_VALIDATION_FAILED",
          `Missing source reference in ${context}: ${id}`,
        );
      }
    }
  };

  assertRefs(knowledge.industry.evidenceSourceIds, "industry");
  assertRefs(knowledge.businessModel.evidenceSourceIds, "businessModel");
  assertRefs(knowledge.branding.evidenceSourceIds, "branding");

  for (const product of knowledge.products) {
    if (!product.name.trim()) {
      throw new AppError("DISCOVERY_VALIDATION_FAILED", "Empty product name");
    }
    assertRefs(product.evidenceSourceIds, `product:${product.name}`);
  }
  for (const dept of knowledge.departments) {
    assertRefs(dept.evidenceSourceIds, `department:${dept.name}`);
    if (!dept.inferred && dept.evidenceSourceIds.length === 0) {
      throw new AppError(
        "DISCOVERY_VALIDATION_FAILED",
        `Confirmed department lacks evidence: ${dept.name}`,
      );
    }
  }
  for (const role of knowledge.roles) {
    if (!role.inferred && role.evidenceSourceIds.length === 0) {
      throw new AppError(
        "DISCOVERY_VALIDATION_FAILED",
        `Confirmed role lacks evidence: ${role.title}`,
      );
    }
  }
  for (const customer of knowledge.customers) {
    if (!customer.inferred && customer.evidenceSourceIds.length === 0) {
      throw new AppError(
        "DISCOVERY_VALIDATION_FAILED",
        `Confirmed customer segment lacks evidence: ${customer.segment}`,
      );
    }
  }
  for (const useCase of knowledge.aiUseCases) {
    if (useCase.inferred !== true) {
      throw new AppError(
        "DISCOVERY_VALIDATION_FAILED",
        "AI use cases must be marked inferred",
      );
    }
  }

  if (knowledge.identity.officialWebsite) {
    const websiteSources = knowledge.sources.filter(
      (s) =>
        s.sourceType === "OFFICIAL_WEBSITE" ||
        s.sourceType === "USER_INPUT" ||
        s.url.startsWith(knowledge.identity.officialWebsite!),
    );
    if (websiteSources.length === 0) {
      throw new AppError(
        "DISCOVERY_VALIDATION_FAILED",
        "officialWebsite claimed without matching source",
      );
    }
  }

  const discovered = new Date(knowledge.discoveredAt).getTime();
  const updated = new Date(knowledge.updatedAt).getTime();
  if (!Number.isFinite(discovered) || !Number.isFinite(updated)) {
    throw new AppError("DISCOVERY_VALIDATION_FAILED", "Invalid timestamps");
  }
  if (updated < discovered) {
    throw new AppError(
      "DISCOVERY_VALIDATION_FAILED",
      "updatedAt earlier than discoveredAt",
    );
  }

  return applyReadiness(knowledge, options);
}

export function calculateOverallConfidence(input: {
  websiteConfidence: number;
  authoritativeFetchedSources: number;
  hasIndustry: boolean;
  hasDescription: boolean;
  productCount: number;
  inferredRatio: number;
  conflictPenalty: number;
}): number {
  let score = 0;
  score += input.websiteConfidence * 0.4;
  score += Math.min(1, input.authoritativeFetchedSources / 2) * 0.25;
  score += input.hasIndustry ? 0.1 : 0;
  score += input.hasDescription ? 0.1 : 0;
  score += Math.min(1, input.productCount / 1) * 0.2;
  score -= Math.min(0.12, input.inferredRatio * 0.12);
  score -= input.conflictPenalty;
  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

export function applyReadiness(
  knowledge: CompanyKnowledge,
  options: ValidationOptions,
): CompanyKnowledge {
  const fetchedOfficial = knowledge.sources.filter(
    (s) =>
      (s.sourceType === "OFFICIAL_WEBSITE" || s.sourceType === "USER_INPUT") &&
      s.status === "FETCHED",
  );
  const websiteConfidence = fetchedOfficial[0]?.authorityScore ?? 0;
  const hasIndustry = Boolean(knowledge.industry.primary.trim());
  const hasDescription = Boolean(knowledge.identity.description.trim());
  const productCount = knowledge.products.length;

  const inferredCount =
    knowledge.departments.filter((d) => d.inferred).length +
    knowledge.roles.filter((r) => r.inferred).length +
    knowledge.customers.filter((c) => c.inferred).length +
    knowledge.painPoints.filter((p) => p.inferred).length;
  const totalInferable =
    knowledge.departments.length +
    knowledge.roles.length +
    knowledge.customers.length +
    knowledge.painPoints.length;
  const inferredRatio = totalInferable === 0 ? 0 : inferredCount / totalInferable;

  const overallConfidence = calculateOverallConfidence({
    websiteConfidence,
    authoritativeFetchedSources: fetchedOfficial.length,
    hasIndustry,
    hasDescription,
    productCount,
    inferredRatio,
    conflictPenalty: knowledge.gaps.some((g) => g.field === "identity") ? 0.15 : 0,
  });

  const ready =
    websiteConfidence >= options.minWebsiteConfidence &&
    fetchedOfficial.length >= 1 &&
    hasIndustry &&
    hasDescription &&
    productCount >= 1 &&
    overallConfidence >= options.minReadyConfidence &&
    !knowledge.gaps.some((g) => g.field === "officialWebsite");

  const status = ready
    ? "READY"
    : knowledge.status === "FAILED_VALIDATION"
      ? "FAILED_VALIDATION"
      : "NEEDS_INPUT";

  return {
    ...knowledge,
    overallConfidence,
    status,
  };
}

export function hashKnowledgeContent(knowledge: CompanyKnowledge): string {
  const { contentHash: _ignored, updatedAt: _u, discoveredAt: _d, ...rest } =
    knowledge;
  return createHash("sha256").update(JSON.stringify(rest)).digest("hex");
}
