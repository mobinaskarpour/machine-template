import type {
  KnowledgeSynthesisProvider,
  NormalizedSourceContent,
} from "../../discovery/discovery-types.js";
import type { CompanyKnowledge } from "../../knowledge/company-knowledge-schema.js";
import { newId, nowIso, shortStableHash } from "../../shared/ids.js";

function inferIndustry(text: string): { primary: string; secondary: string[] } {
  const t = text.toLowerCase();
  if (/concrete|بتن|سیمان|cement|precast/.test(t)) {
    return { primary: "Concrete manufacturing", secondary: ["Building materials"] };
  }
  if (/steel|فولاد|metal/.test(t)) {
    return { primary: "Steel / metals", secondary: ["Manufacturing"] };
  }
  if (/software|saas|platform|نرم[‌ ]?افزار/.test(t)) {
    return { primary: "Software", secondary: ["Technology"] };
  }
  if (/hospital|clinic|healthcare|درمان|بیمارستان/.test(t)) {
    return { primary: "Healthcare", secondary: ["Services"] };
  }
  if (/bank|finance|مالی|بانک/.test(t)) {
    return { primary: "Financial services", secondary: [] };
  }
  return { primary: "General business", secondary: [] };
}

function defaultDepartments(sourceIds: string[]): CompanyKnowledge["departments"] {
  const names = [
    "Executive",
    "Sales",
    "Operations",
    "Finance",
    "HR",
    "IT",
  ];
  return names.map((name) => ({
    id: newId("dept"),
    name,
    inferred: true,
    confidence: 0.45,
    evidenceSourceIds: sourceIds.slice(0, 1),
  }));
}

function defaultPainPoints(
  industry: string,
  sourceIds: string[],
): CompanyKnowledge["painPoints"] {
  const base = [
    {
      title: "Manual coordination overhead",
      description: "Cross-team coordination often relies on informal channels.",
      department: "Operations",
    },
    {
      title: "Fragmented operational visibility",
      description: "Leaders may lack a single source of truth for live operations.",
      department: "Executive",
    },
    {
      title: "Slow reporting cycles",
      description: "Management reporting can lag behind operational reality.",
      department: "Finance",
    },
    {
      title: "Knowledge concentration risk",
      description: "Critical know-how may sit with a few experienced staff.",
      department: "HR",
    },
    {
      title: "Inconsistent customer response quality",
      description: "Service quality may vary without shared playbooks.",
      department: "Sales",
    },
  ];
  if (/concrete|manufactur|steel/i.test(industry)) {
    base[0] = {
      title: "Production planning complexity",
      description: "Scheduling production against demand and logistics is difficult.",
      department: "Operations",
    };
  }
  return base.map((item) => ({
    id: newId("pain"),
    title: item.title,
    description: item.description,
    department: item.department,
    inferred: true,
    confidence: 0.4,
    evidenceSourceIds: sourceIds.slice(0, 1),
  }));
}

/**
 * Offline synthesis from deterministic extractions.
 * Does not invent competitors, customers examples, or financials.
 */
export class DeterministicKnowledgeSynthesisProvider
  implements KnowledgeSynthesisProvider
{
  readonly name = "deterministic";

  async synthesize(input: {
    companyName: string;
    companyId: string;
    companySlug: string;
    sources: NormalizedSourceContent[];
    existingKnowledge?: CompanyKnowledge;
  }): Promise<CompanyKnowledge> {
    const now = nowIso();
    const sourceIds = input.sources.map((s) => s.sourceId);
    const primarySource = input.sources[0];
    const combinedText = input.sources
      .map((s) =>
        [
          s.extracted.title,
          s.extracted.description,
          s.extracted.headings.join(" "),
          s.extracted.productHints.join(" "),
          s.extracted.visibleTextSample.slice(0, 2000),
        ].join(" "),
      )
      .join("\n");

    const industry = inferIndustry(combinedText);
    const products = [
      ...new Map(
        input.sources
          .flatMap((s) => s.extracted.productHints)
          .filter((name) => name.length > 2)
          .map((name) => [name.toLowerCase(), name] as const),
      ).values(),
    ]
      .slice(0, 12)
      .map((name) => ({
        id: `prod_${shortStableHash(name)}`,
        name,
        confidence: 0.55,
        evidenceSourceIds: sourceIds.slice(0, 2),
      }));

    // If no product hints, keep empty — readiness will become NEEDS_INPUT unless we have services wording
    if (products.length === 0 && /service|خدمات|solution/i.test(combinedText)) {
      products.push({
        id: `prod_${shortStableHash("services")}`,
        name: "Core services",
        confidence: 0.5,
        evidenceSourceIds: sourceIds.slice(0, 1),
      });
    }

    const org = primarySource?.extracted.jsonLdOrganizations[0];
    const description =
      primarySource?.extracted.description ||
      primarySource?.extracted.ogDescription ||
      (typeof org?.description === "string" ? org.description : "") ||
      `${input.companyName} — public company profile assembled from available website evidence.`;

    const emails = [...new Set(input.sources.flatMap((s) => s.extracted.emails))];
    const phones = [...new Set(input.sources.flatMap((s) => s.extracted.phones))];
    const languages = [
      ...new Set(input.sources.flatMap((s) => s.extracted.languages)),
    ];
    const officialWebsite =
      input.sources.find((s) => s.sourceType === "OFFICIAL_WEBSITE" || s.sourceType === "USER_INPUT")
        ?.url ?? primarySource?.url;

    const knowledge: CompanyKnowledge = {
      schemaVersion: "1.0",
      companyId: input.companyId,
      companySlug: input.companySlug,
      displayName: input.companyName,
      status: "DRAFT",
      identity: {
        legalName:
          typeof org?.legalName === "string" ? org.legalName : undefined,
        tradingNames: [],
        description: String(description).slice(0, 1200),
        officialWebsite,
        contact: {
          email: emails[0],
          phone: phones[0],
        },
      },
      industry: {
        primary: industry.primary,
        secondary: industry.secondary,
        confidence: /general business/i.test(industry.primary) ? 0.4 : 0.7,
        evidenceSourceIds: sourceIds.slice(0, 2),
      },
      products,
      departments: defaultDepartments(sourceIds),
      roles: [],
      businessModel: {
        summary: `Appears to operate as a ${industry.primary.toLowerCase()} business based on public website wording.`,
        type: "B2B",
        confidence: 0.45,
        evidenceSourceIds: sourceIds.slice(0, 1),
      },
      customers: [],
      suppliers: [],
      painPoints: defaultPainPoints(industry.primary, sourceIds),
      revenueModel: {
        streams: [
          {
            name: "Core product/service sales",
            inferred: true,
            confidence: 0.4,
            evidenceSourceIds: sourceIds.slice(0, 1),
          },
        ],
        summary: "Revenue model inferred at a high level from public product/service presence.",
      },
      processes: [],
      integrations: [],
      aiUseCases: [
        {
          id: newId("ai"),
          title: "Executive operations brief",
          description:
            "Daily summarized operational and commercial signals for leadership.",
          department: "Executive",
          priority: "HIGH",
          inferred: true,
          confidence: 0.35,
          evidenceSourceIds: sourceIds.slice(0, 1),
        },
        {
          id: newId("ai"),
          title: "Sales pipeline assistant",
          description: "Assist sales with qualification and follow-up drafts.",
          department: "Sales",
          priority: "MEDIUM",
          inferred: true,
          confidence: 0.35,
          evidenceSourceIds: sourceIds.slice(0, 1),
        },
      ],
      competitors: [],
      branding: {
        logoUrl: primarySource?.extracted.logoUrl,
        secondaryColors: [],
        languages: languages.length ? languages : [/[\u0600-\u06FF]/.test(input.companyName) ? "fa" : "en"],
        rtlRecommended: /[\u0600-\u06FF]/.test(input.companyName),
        evidenceSourceIds: sourceIds.slice(0, 1),
      },
      sources: input.sources.map((s) => ({
        id: s.sourceId,
        url: s.url,
        title: s.title,
        sourceType: s.sourceType,
        authorityScore: s.authorityScore,
        fetchedAt: now,
        status: "FETCHED" as const,
        contentHash: shortStableHash(s.evidenceText),
      })),
      gaps: [
        ...(products.length === 0
          ? [
              {
                field: "products",
                reason: "No clear products/services extracted from pages",
                requiredUserInput: "List main products or services",
              },
            ]
          : []),
        {
          field: "customers",
          reason: "Customer segments were not explicitly stated in sources",
        },
        {
          field: "competitors",
          reason: "Competitors were not confirmed in sources",
        },
      ],
      overallConfidence: 0,
      discoveredAt: input.existingKnowledge?.discoveredAt ?? now,
      updatedAt: now,
    };

    return knowledge;
  }
}
