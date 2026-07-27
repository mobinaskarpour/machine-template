import type {
  ConcernDomain,
  ConcernSignal,
  ConversationExtraction,
  IntelligenceRecommendation,
  LearningProfile,
} from "@/types/intelligence";
import { getDomainConcept } from "./ontology";
import { getDashboardBlueprint, getWorkflowBlueprint } from "./blueprints";
import { toPersianDigits } from "@/lib/persian";

/** Thresholds — recurrence creates recommendations (not every message) */
export const RECURRENCE_THRESHOLD = 2;
export const STRENGTH_THRESHOLD = 3.5;

export function emptyLearning(): LearningProfile {
  return {
    interests: {},
    domainWeights: {},
    decisionFrequency: 0,
    languageHints: [],
    totalExtractions: 0,
  };
}

export function updateLearning(
  profile: LearningProfile,
  extraction: ConversationExtraction
): LearningProfile {
  const next: LearningProfile = {
    ...profile,
    interests: { ...profile.interests },
    domainWeights: { ...profile.domainWeights },
    languageHints: [...profile.languageHints],
    totalExtractions: profile.totalExtractions + 1,
  };

  if (extraction.decisionPattern) {
    next.decisionFrequency += 1;
  }

  for (const domain of extraction.domains) {
    next.domainWeights[domain] = (next.domainWeights[domain] ?? 0) + 1;
  }

  for (const ent of extraction.entities) {
    next.interests[ent.label] = (next.interests[ent.label] ?? 0) + 1;
  }

  const hint = extraction.topic;
  if (hint && !next.languageHints.includes(hint)) {
    next.languageHints = [hint, ...next.languageHints].slice(0, 12);
  }

  return next;
}

export function updateConcernSignals(
  signals: ConcernSignal[],
  extraction: ConversationExtraction,
  learning: LearningProfile
): ConcernSignal[] {
  const map = new Map(signals.map((s) => [s.domain, { ...s, samples: [...s.samples] }]));

  for (const domain of extraction.domains) {
    const weight = 1 + (learning.domainWeights[domain] ?? 0) * 0.08;
    const existing = map.get(domain);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = extraction.at;
      existing.strength = existing.count * weight + (extraction.priority === "urgent" ? 1.2 : 0);
      existing.samples = [extraction.query, ...existing.samples].slice(0, 5);
    } else {
      map.set(domain, {
        domain,
        count: 1,
        lastSeen: extraction.at,
        strength: weight + (extraction.priority === "urgent" ? 1 : 0),
        samples: [extraction.query],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.strength - a.strength);
}

function alreadyProposed(
  existing: IntelligenceRecommendation[],
  kind: IntelligenceRecommendation["kind"],
  domain: ConcernDomain
): boolean {
  return existing.some(
    (r) =>
      r.kind === kind &&
      r.domain === domain &&
      (r.status === "proposed" ||
        r.status === "reviewing" ||
        r.status === "approved" ||
        r.status === "deferred")
  );
}

export function deriveRecommendations(
  signals: ConcernSignal[],
  existing: IntelligenceRecommendation[],
  learning: LearningProfile
): IntelligenceRecommendation[] {
  /** Per scenario: at most one Workflow + one Dashboard — highest business value only */
  const active = existing.filter(
    (r) =>
      r.status === "proposed" ||
      r.status === "reviewing" ||
      r.status === "deferred"
  );
  const hasActiveWorkflow = active.some((r) => r.kind === "workflow");
  const hasActiveDashboard = active.some((r) => r.kind === "dashboard");

  const ordered = [...signals].sort((a, b) => {
    const aw = learning.domainWeights[a.domain] ?? 0;
    const bw = learning.domainWeights[b.domain] ?? 0;
    return b.strength + bw * 0.4 - (a.strength + aw * 0.4);
  });

  const ready = ordered.filter((signal) => {
    const learnedBoost = (learning.domainWeights[signal.domain] ?? 0) >= 2;
    return (
      signal.count >= RECURRENCE_THRESHOLD ||
      signal.strength >= STRENGTH_THRESHOLD ||
      (learnedBoost && signal.count >= 2)
    );
  });

  if (!ready.length) return [];

  // Best domain by combined strength / learning weight
  const best = ready[0];
  const concept = getDomainConcept(best.domain);
  const created: IntelligenceRecommendation[] = [];

  if (
    !hasActiveWorkflow &&
    !alreadyProposed(existing, "workflow", best.domain)
  ) {
    const wf = getWorkflowBlueprint(best.domain);
    created.push({
      id: `rec-wf-${best.domain}-${Date.now()}`,
      kind: "workflow",
      domain: best.domain,
      title: wf.name,
      explanation: `استانداردسازی عملیات «${concept.label}» پس از تکرار گفتگو.`,
      businessImpact: wf.businessValue,
      expectedValue: wf.expectedRoi,
      primaryCta: "ایجاد",
      secondaryCta: "بعداً",
      status: "proposed",
      createdAt: Date.now(),
      concernCount: best.count,
      workflow: wf,
    });
  }

  if (
    !hasActiveDashboard &&
    !alreadyProposed(existing, "dashboard", best.domain)
  ) {
    const db = getDashboardBlueprint(best.domain);
    created.push({
      id: `rec-db-${best.domain}-${Date.now()}`,
      kind: "dashboard",
      domain: best.domain,
      title: db.name,
      explanation: `پایش پیوسته «${concept.label}» برای تصمیم‌های تکراری.`,
      businessImpact: db.executiveValue,
      expectedValue: db.strategicImpact,
      primaryCta: "ایجاد",
      secondaryCta: "بعداً",
      status: "proposed",
      createdAt: Date.now(),
      concernCount: best.count,
      dashboard: db,
    });
  }

  return created;
}

/** Seed mild history so first deep conversation can tip over threshold faster after 2nd hit */
export function seedSignals(): ConcernSignal[] {
  return [
    {
      domain: "delay",
      count: 1,
      lastSeen: Date.now() - 86400000,
      strength: 2.2,
      samples: ["چرا برج آریا قرمز شده؟"],
    },
    {
      domain: "collection",
      count: 1,
      lastSeen: Date.now() - 172800000,
      strength: 2.0,
      samples: ["وضعیت نقدینگی این هفته چگونه است؟"],
    },
  ];
}
