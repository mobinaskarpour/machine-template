import type {
  ConcernDomain,
  ConversationExtraction,
  ExtractedEntity,
} from "@/types/intelligence";
import { domainOntology, getDomainConcept } from "./ontology";

/**
 * Silent match aliases — Latin/industry forms executives may type.
 * Never shown in UI; only used for conceptual recognition.
 */
const silentAliases: Partial<Record<ConcernDomain, string[]>> = {
  budget: ["overrun", "eac", "budget"],
  margin: ["margin", "profit"],
  cashflow: ["wip", "cashflow", "cash flow"],
  "contract-approval": ["vo", "variation"],
  hse: ["hse", "safety"],
  quality: ["ncr", "qa", "qc"],
  reporting: ["pmo", "board pack"],
  delay: ["cpm", "float", "critical path"],
  collection: ["dso", "ar ", "receivable"],
};

/** Domains that conceptually co-activate (business affinity, not keywords). */
const affinity: Partial<Record<ConcernDomain, ConcernDomain[]>> = {
  delay: ["procurement", "contractor", "workforce", "equipment"],
  cashflow: ["collection", "budget", "margin"],
  collection: ["cashflow", "contract-approval"],
  procurement: ["delay", "budget"],
  contractor: ["delay", "quality", "workforce"],
  equipment: ["delay", "budget"],
  budget: ["margin", "cashflow"],
  margin: ["budget", "delay", "contract-approval"],
  "risk-portfolio": ["delay", "hse", "cashflow", "contractor"],
  reporting: ["risk-portfolio", "margin", "cashflow"],
};

const entityLexicon: { type: ExtractedEntity["type"]; patterns: string[] }[] = [
  {
    type: "project",
    patterns: ["برج آریا", "آریا", "پارس", "خط ۷", "مترو", "سعادت‌آباد"],
  },
  {
    type: "contractor",
    patterns: ["پیمانکار سازه", "پیمانکار", "تأمین‌کننده فولاد"],
  },
  {
    type: "contract",
    patterns: ["قرارداد", "الحاقیه", "صورت‌وضعیت فاز ۲", "دستور تغییر ۱۴", "دستور تغییر"],
  },
  {
    type: "equipment",
    patterns: ["جرثقیل", "بچینگ", "داربست"],
  },
  {
    type: "department",
    patterns: ["مالی", "تدارکات", "دفتر مدیریت پروژه", "عملیات", "اجرا", "ایمنی", "کیفیت"],
  },
  {
    type: "financial",
    patterns: [
      "میلیارد",
      "حاشیه",
      "نقدینگی",
      "وصول",
      "جریمه",
      "حسن‌انجام",
      "برآورد تا تکمیل",
    ],
  },
];

function normalize(text: string): string {
  return text
    .replace(/\u064a/g, "\u06cc") // ي → ی
    .replace(/\u0643/g, "\u06a9") // ك → ک
    .replace(/\u200c/g, "")
    .toLowerCase();
}

function scoreDomain(text: string, domain: ConcernDomain): number {
  const concept = getDomainConcept(domain);
  let families = 0;
  let hits = 0;
  for (const family of concept.signals) {
    const familyHit = family.some((phrase) => text.includes(normalize(phrase)));
    if (familyHit) {
      families += 1;
      hits += family.filter((phrase) => text.includes(normalize(phrase))).length;
    }
  }

  const aliases = silentAliases[domain] ?? [];
  const aliasHits = aliases.filter((a) => text.includes(a.toLowerCase())).length;

  if (families === 0 && aliasHits === 0) return 0;

  // Conceptual strength: phrase-families dominate; aliases are weak corroboration
  return families * 2.4 + Math.min(hits, 4) * 0.35 + Math.min(aliasHits, 2) * 0.6;
}

function applyAffinity(
  scored: { domain: ConcernDomain; score: number }[]
): { domain: ConcernDomain; score: number }[] {
  const map = new Map(scored.map((s) => [s.domain, s.score]));
  for (const { domain, score } of scored) {
    if (score < 2) continue;
    for (const related of affinity[domain] ?? []) {
      const current = map.get(related) ?? 0;
      // Soft co-activation — mirrors how executives connect concerns
      map.set(related, current + score * 0.18);
    }
  }
  return Array.from(map.entries())
    .map(([domain, score]) => ({ domain, score }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function extractFromConversation(
  query: string,
  assistantContent?: string
): ConversationExtraction {
  const text = normalize(`${query} ${assistantContent ?? ""}`.trim());
  const raw = domainOntology
    .map((d) => ({ domain: d.domain, score: scoreDomain(text, d.domain) }))
    .filter((s) => s.score > 0);

  const scored = applyAffinity(raw);
  const domains = scored.slice(0, 3).map((s) => s.domain);
  const primary = domains[0] ?? "risk-portfolio";
  const concept = getDomainConcept(primary);

  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();
  const rawText = `${query} ${assistantContent ?? ""}`;
  for (const lex of entityLexicon) {
    for (const p of lex.patterns) {
      if (rawText.includes(p) && !seen.has(p)) {
        seen.add(p);
        entities.push({ type: lex.type, label: p });
      }
    }
  }

  let priority: ConversationExtraction["priority"] = "normal";
  if (
    text.includes("بحرانی") ||
    text.includes("فوری") ||
    text.includes("امروز") ||
    scored[0]?.score >= 5
  ) {
    priority = "urgent";
  } else if (scored[0]?.score >= 3) {
    priority = "high";
  }

  let decisionPattern: string | undefined;
  if (
    text.includes("تصمیم") ||
    text.includes("تأیید") ||
    text.includes("اولویت")
  ) {
    decisionPattern = "تصمیم اجرایی با اثر ریال/زمان";
  }

  return {
    id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    query,
    topic: concept.topic,
    objective: concept.objective,
    domains: domains.length ? domains : ["risk-portfolio"],
    entities,
    risks: concept.risks,
    bottlenecks: concept.bottlenecks,
    decisionPattern,
    priority,
  };
}
