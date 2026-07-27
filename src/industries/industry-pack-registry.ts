import type { IndustryPack } from "./industry-pack-schema.js";
import { parseIndustryPack } from "./industry-pack-schema.js";
import { manufacturingPack } from "./packs/manufacturing.js";
import { generalPack } from "./packs/general.js";
import { constructionPack } from "./packs/construction.js";
import { realEstatePack } from "./packs/real-estate.js";
import { medicalPack } from "./packs/medical.js";
import { educationPack } from "./packs/education.js";
import { legalPack } from "./packs/legal.js";
import { oilGasPack } from "./packs/oil-gas.js";
import { steelPack } from "./packs/steel.js";
import { bankingPack } from "./packs/banking.js";

const RAW_PACKS = [
  manufacturingPack,
  generalPack,
  constructionPack,
  realEstatePack,
  medicalPack,
  educationPack,
  legalPack,
  oilGasPack,
  steelPack,
  bankingPack,
] as const;

/** All industry packs, validated at module load. */
export const ALL_INDUSTRY_PACKS: IndustryPack[] = RAW_PACKS.map((pack) =>
  parseIndustryPack(pack),
);

const BY_ID = new Map(ALL_INDUSTRY_PACKS.map((pack) => [pack.id, pack]));

export function getIndustryPack(id: string): IndustryPack {
  const pack = BY_ID.get(id);
  if (!pack) {
    throw new Error(`Unknown industry pack id: ${id}`);
  }
  return pack;
}

export function listIndustryPackIds(): string[] {
  return ALL_INDUSTRY_PACKS.map((pack) => pack.id);
}
