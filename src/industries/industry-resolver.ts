export type IndustryResolution = {
  selectedPackId: string;
  confidence: number;
  matchedSignals: Array<{
    field: string;
    value: string;
    matchedAlias: string;
    weight: number;
  }>;
  alternatives: Array<{
    packId: string;
    confidence: number;
  }>;
  requiresReview: boolean;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s_\-‌.]+/g, " ")
    .trim();
}

type PackAliasIndex = {
  packId: string;
  aliases: string[];
};

export function resolveIndustryPack(input: {
  packs: PackAliasIndex[];
  primaryIndustry?: string;
  secondaryIndustries?: string[];
  products?: string[];
  processes?: string[];
  description?: string;
  painPoints?: string[];
}): IndustryResolution {
  const corpus: Array<{ field: string; value: string }> = [];
  const push = (field: string, values?: string[]) => {
    for (const value of values ?? []) {
      if (value?.trim()) corpus.push({ field, value: normalizeText(value) });
    }
  };
  push("industry.primary", input.primaryIndustry ? [input.primaryIndustry] : []);
  push("industry.secondary", input.secondaryIndustries);
  push("products", input.products);
  push("processes", input.processes);
  push("description", input.description ? [input.description] : []);
  push("painPoints", input.painPoints);

  const scores = new Map<
    string,
    { score: number; signals: IndustryResolution["matchedSignals"] }
  >();

  for (const pack of input.packs) {
    const signals: IndustryResolution["matchedSignals"] = [];
    let score = 0;
    for (const alias of pack.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (!normalizedAlias) continue;
      for (const item of corpus) {
        if (
          item.value === normalizedAlias ||
          item.value.includes(normalizedAlias) ||
          normalizedAlias.includes(item.value)
        ) {
          const weight =
            item.field === "industry.primary"
              ? 1
              : item.field === "industry.secondary"
                ? 0.7
                : item.field === "products"
                  ? 0.55
                  : item.field === "processes"
                    ? 0.5
                    : item.field === "painPoints"
                      ? 0.45
                      : 0.35;
          score += weight;
          signals.push({
            field: item.field,
            value: item.value,
            matchedAlias: alias,
            weight,
          });
        }
      }
    }
    scores.set(pack.packId, { score, signals });
  }

  const ranked = [...scores.entries()]
    .map(([packId, v]) => ({
      packId,
      raw: v.score,
      signals: v.signals,
      confidence: Number(Math.min(1, v.score / 3).toFixed(3)),
    }))
    .sort((a, b) => b.raw - a.raw);

  const top = ranked[0];
  if (!top || top.raw <= 0) {
    return {
      selectedPackId: "general",
      confidence: 0.35,
      matchedSignals: [],
      alternatives: ranked
        .filter((r) => r.packId !== "general")
        .slice(0, 3)
        .map((r) => ({ packId: r.packId, confidence: r.confidence })),
      requiresReview: true,
    };
  }

  const second = ranked[1];
  const requiresReview =
    top.confidence < 0.55 ||
    Boolean(second && second.raw > 0 && top.raw - second.raw < 0.6);

  return {
    selectedPackId: top.packId,
    confidence: top.confidence,
    matchedSignals: top.signals.slice(0, 12),
    alternatives: ranked
      .filter((r) => r.packId !== top.packId)
      .slice(0, 4)
      .map((r) => ({ packId: r.packId, confidence: r.confidence })),
    requiresReview,
  };
}
