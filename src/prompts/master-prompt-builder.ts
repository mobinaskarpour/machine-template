import { createHash } from "node:crypto";
import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { IndustryPack } from "../industries/industry-pack-schema.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import {
  MASTER_PROMPT_SECTION_IDS,
  MASTER_PROMPT_VERSION,
  type MasterPromptArtifact,
} from "./master-prompt-schema.js";
import {
  assertNoAbsoluteServerPaths,
  assertNoRawResearch,
  assertNoSecrets,
  sanitizePromptText,
} from "./prompt-safety.js";
import { nowIso } from "../shared/ids.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function section(id: string, title: string, body: string): { id: string; title: string; block: string; contentHash: string } {
  const content = sanitizePromptText(body);
  const block = `[${id}]\n# ${title}\n${content}\n`;
  return { id, title, block, contentHash: hashContent(content) };
}

function jsonBlock(label: string, value: unknown): string {
  return `${label}:\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

export function buildMasterPrompt(input: {
  knowledge: CompanyKnowledge;
  specification: MasterBuildSpecification;
  pack: IndustryPack;
}): MasterPromptArtifact {
  const { knowledge, specification, pack } = input;
  const specHash =
    specification.contentHash ??
    hashContent(
      JSON.stringify({
        ...specification,
        contentHash: undefined,
        generatedAt: undefined,
        updatedAt: undefined,
      }),
    );

  const highDashboards = specification.dashboards.filter((d) => d.priority === "HIGH");
  const highWorkflows = specification.workflows.filter((w) => w.priority === "HIGH");
  const highAgents = specification.agents.filter((a) => a.priority === "HIGH");

  const built = [
    section(
      "MACHINE_CONTEXT",
      "System mission",
      [
        "You are preparing planning artifacts for THE MACHINE Company OS builder.",
        "Phase 2 produces MasterBuildSpecification and Master Prompt only.",
        "Do not generate application source code, deploy, or execute agents.",
        "The CompanyKnowledge and MasterBuildSpecification are the canonical inputs.",
        "Do not perform new uncontrolled company research.",
        "Do not invent company facts.",
        "Do not treat industry defaults as confirmed company facts.",
      ].join("\n"),
    ),
    section(
      "COMPANY_IDENTITY",
      "Company identity",
      jsonBlock("company", {
        displayName: specification.company.displayName,
        slug: specification.company.slug,
        description: specification.company.description,
        officialWebsite: specification.company.officialWebsite,
        primaryLanguage: specification.company.primaryLanguage,
        rtl: specification.company.rtl,
        aliases: knowledge.identity.tradingNames,
        products: knowledge.products.map((p) => ({
          name: p.name,
          category: p.category,
          confidence: p.confidence,
        })),
      }),
    ),
    section(
      "EVIDENCE_QUALITY",
      "Evidence and confidence summary",
      jsonBlock("evidence", {
        knowledgeStatus: knowledge.status,
        overallConfidence: knowledge.overallConfidence,
        companyKnowledgeConfidence: specification.quality.companyKnowledgeConfidence,
        industryResolutionConfidence: specification.quality.industryResolutionConfidence,
        specificationConfidence: specification.quality.specificationConfidence,
        sourceCount: knowledge.sources.length,
        gaps: knowledge.gaps.map((g) => g.field),
      }),
    ),
    section(
      "INDUSTRY_CONTEXT",
      "Selected industry pack",
      [
        jsonBlock("industry", specification.industry),
        `Pack id: ${pack.id}`,
        `Pack name: ${pack.name}`,
        `Pack description: ${pack.description}`,
        "Food manufacturing context is expressed through CompanyKnowledge signals plus the manufacturing pack — not a separate food pack.",
      ].join("\n"),
    ),
    section(
      "BUSINESS_OBJECTIVES",
      "Business objectives",
      jsonBlock(
        "objectives",
        specification.objectives.map((o) => ({
          title: o.title,
          priority: o.priority,
          source: o.source,
        })),
      ),
    ),
    section(
      "DEPARTMENTS_AND_ROLES",
      "Departments and roles",
      jsonBlock("org", {
        departments: specification.departments,
        roles: specification.roles.slice(0, 40),
      }),
    ),
    section(
      "DASHBOARDS",
      "Required dashboards",
      jsonBlock("dashboards", {
        prioritized: highDashboards,
        all: specification.dashboards.map((d) => ({
          name: d.name,
          priority: d.priority,
        })),
      }),
    ),
    section(
      "KPIS",
      "Required KPIs",
      jsonBlock(
        "kpis",
        specification.kpis.map((k) => ({
          name: k.name,
          priority: k.priority,
          source: k.source,
          unit: k.unit,
        })),
      ),
    ),
    section(
      "WORKFLOWS",
      "Required workflows",
      jsonBlock("workflows", {
        prioritized: highWorkflows,
        all: specification.workflows.map((w) => ({
          name: w.name,
          priority: w.priority,
          source: w.source,
        })),
      }),
    ),
    section(
      "AI_AGENTS",
      "AI agent roster (planning records only)",
      jsonBlock("agents", {
        note: "Agents are specification records only and must not execute actions.",
        prioritized: highAgents,
        all: specification.agents.map((a) => ({
          name: a.name,
          priority: a.priority,
          permissions: a.permissions,
        })),
      }),
    ),
    section(
      "DATA_MODEL",
      "Data model requirements",
      jsonBlock("dataModel", {
        entityCount: specification.dataModel.entities.length,
        relationshipCount: specification.dataModel.relationships.length,
        entities: specification.dataModel.entities.map((e: { id: string; name: string }) => ({
          id: e.id,
          name: e.name,
        })),
      }),
    ),
    section(
      "BRANDING_AND_LANGUAGE",
      "Branding and language",
      jsonBlock("branding", specification.branding),
    ),
    section(
      "UX_REQUIREMENTS",
      "UX expectations",
      [
        `Primary language: ${specification.company.primaryLanguage}`,
        `RTL required: ${specification.company.rtl ? "yes" : "no"}`,
        "Prefer clear operational dashboards suitable for plant and commercial leaders.",
        "Do not invent UI copy that asserts unverified company metrics.",
      ].join("\n"),
    ),
    section(
      "INTEGRATIONS",
      "Integrations",
      jsonBlock("integrations", specification.integrations.slice(0, 30)),
    ),
    section(
      "ASSUMPTIONS",
      "Assumptions",
      jsonBlock("assumptions", specification.assumptions),
    ),
    section(
      "UNRESOLVED_QUESTIONS",
      "Unresolved questions",
      jsonBlock("unresolvedQuestions", specification.unresolvedQuestions),
    ),
    section(
      "SAFETY_BOUNDARIES",
      "Safety and approval boundaries",
      [
        "Human approval is required for any future operational actions.",
        "Do not fabricate production volumes, revenues, employee counts, customers, or suppliers.",
        "Distinguish CONFIRMED, INFERRED, INDUSTRY_DEFAULT, and RECOMMENDED sources.",
        ...specification.constraints.map((c) => `- ${c.severity}: ${c.description}`),
      ].join("\n"),
    ),
    section(
      "FUTURE_GENERATION_REQUIREMENTS",
      "Expected future outputs",
      [
        "Future phases may generate a Company OS blueprint from this Master Prompt.",
        "This phase must not invoke generation or deployment services.",
        `specificationHash: ${specHash}`,
      ].join("\n"),
    ),
    section(
      "QUALITY_GATES",
      "Quality requirements",
      jsonBlock("quality", specification.quality),
    ),
    section(
      "OUTPUT_CONTRACT",
      "Anti-fabrication and output contract",
      [
        "Anti-fabrication rules:",
        "- Never invent unsupported private facts.",
        "- Never treat industry defaults as confirmed company evidence.",
        "- Never include raw HTML, search payloads, API keys, or absolute server paths.",
        "- Preserve Persian company names and RTL requirements when present.",
        "Canonical inputs only: CompanyKnowledge + MasterBuildSpecification + IndustryPack.",
      ].join("\n"),
    ),
  ];

  if (built.map((b) => b.id).join(",") !== MASTER_PROMPT_SECTION_IDS.join(",")) {
    throw new Error("Master Prompt section order drifted from schema");
  }

  const prompt = built.map((b) => b.block).join("\n");
  assertNoRawResearch(prompt);
  assertNoSecrets(prompt);
  assertNoAbsoluteServerPaths(prompt);

  return {
    schemaVersion: "1.0",
    companyId: specification.company.id,
    companySlug: specification.company.slug,
    specificationHash: specHash,
    promptVersion: MASTER_PROMPT_VERSION,
    prompt,
    sections: built.map((b) => ({
      id: b.id,
      title: b.title,
      contentHash: b.contentHash,
    })),
    contentHash: hashContent(prompt),
    generatedAt: nowIso(),
  };
}
