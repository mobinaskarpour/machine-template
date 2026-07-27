import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { IndustryPack } from "./industry-pack-schema.js";
import {
  ALL_INDUSTRY_PACKS,
  getIndustryPack,
  listIndustryPackIds,
} from "./industry-pack-registry.js";
import {
  resolveIndustryPack,
  type IndustryResolution,
} from "./industry-resolver.js";

export class IndustryEngine {
  listPackIds(): string[] {
    return listIndustryPackIds();
  }

  getPack(id: string): IndustryPack {
    return getIndustryPack(id);
  }

  resolveFromKnowledge(knowledge: CompanyKnowledge): IndustryResolution {
    return resolveIndustryPack({
      packs: ALL_INDUSTRY_PACKS.map((p) => ({
        packId: p.id,
        aliases: [p.id, p.name, ...p.aliases, ...Object.values(p.terminology).flat()],
      })),
      primaryIndustry: knowledge.industry.primary,
      secondaryIndustries: knowledge.industry.secondary,
      products: knowledge.products.map((p) => `${p.name} ${p.category ?? ""} ${p.description ?? ""}`),
      processes: knowledge.processes.map((p) => `${p.name} ${p.description ?? ""}`),
      description: knowledge.identity.description,
      painPoints: knowledge.painPoints.map((p) => `${p.title} ${p.description}`),
    });
  }
}
