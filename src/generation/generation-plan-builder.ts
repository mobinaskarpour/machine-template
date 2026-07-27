import type { CompanyOSBlueprint } from "../blueprints/company-os-blueprint-schema.js";
import type { GenerationPlan } from "./generation-plan-schema.js";
import { parseGenerationPlan } from "./generation-plan-schema.js";
import {
  ALLOWED_DEPENDENCIES,
  FORBIDDEN_DEPENDENCIES,
  TEMPLATE_ID,
  TEMPLATE_RELATIVE_PATH,
  TEMPLATE_VERSION,
} from "./source-file-policy.js";
import { nowIso, shortStableHash } from "../shared/ids.js";

export function buildGenerationPlan(input: {
  blueprint: CompanyOSBlueprint;
  companyKnowledgeHash: string;
  specificationHash: string;
  masterPromptHash: string;
  templateHash: string;
  providerId: GenerationPlan["provider"]["id"];
  cwd: string;
}): GenerationPlan {
  const bp = input.blueprint;
  const stableId = `gen_${shortStableHash(`${bp.company.slug}:${bp.contentHash ?? "x"}:${input.templateHash}`)}`;

  const tasks: GenerationPlan["tasks"] = [
    {
      id: "copy_template",
      type: "COPY_TEMPLATE",
      description: "Copy approved template into staging",
      allowedPaths: ["."],
      dependencies: [],
      required: true,
    },
    {
      id: "render_shell",
      type: "GENERATE_BRANDING",
      description: "Render branding and runtime config",
      allowedPaths: ["src/data/", "src/app/globals.css"],
      dependencies: ["copy_template"],
      required: true,
    },
    {
      id: "render_nav",
      type: "GENERATE_NAVIGATION",
      description: "Render navigation runtime",
      allowedPaths: ["src/data/"],
      dependencies: ["render_shell"],
      required: true,
    },
    {
      id: "render_dashboards",
      type: "GENERATE_DASHBOARDS",
      description: "Render dashboard runtime coverage",
      allowedPaths: ["src/data/"],
      dependencies: ["render_nav"],
      required: true,
    },
    {
      id: "render_modules",
      type: "GENERATE_MODULES",
      description: "Render module runtime coverage",
      allowedPaths: ["src/data/"],
      dependencies: ["render_dashboards"],
      required: true,
    },
    {
      id: "render_workflows",
      type: "GENERATE_WORKFLOWS",
      description: "Render workflow runtime coverage",
      allowedPaths: ["src/data/"],
      dependencies: ["render_modules"],
      required: true,
    },
    {
      id: "render_agents",
      type: "GENERATE_AGENTS",
      description: "Render agent center runtime",
      allowedPaths: ["src/data/"],
      dependencies: ["render_workflows"],
      required: true,
    },
    {
      id: "mock_data",
      type: "GENERATE_MOCK_DATA",
      description: "Generate deterministic mock records",
      allowedPaths: ["src/data/"],
      dependencies: ["render_agents"],
      required: true,
    },
    {
      id: "validate_source",
      type: "VALIDATE_SOURCE",
      description: "Validate generated source policy",
      allowedPaths: ["."],
      dependencies: ["mock_data"],
      required: true,
    },
    {
      id: "install",
      type: "INSTALL_DEPENDENCIES",
      description: "Install generated app dependencies",
      allowedPaths: ["package.json", "package-lock.json", "node_modules/"],
      dependencies: ["validate_source"],
      required: true,
    },
    {
      id: "typecheck",
      type: "TYPECHECK",
      description: "Typecheck generated app",
      allowedPaths: ["."],
      dependencies: ["install"],
      required: true,
    },
    {
      id: "test",
      type: "TEST",
      description: "Run generated app tests",
      allowedPaths: ["."],
      dependencies: ["typecheck"],
      required: true,
    },
    {
      id: "build",
      type: "BUILD",
      description: "Production build generated app",
      allowedPaths: ["."],
      dependencies: ["test"],
      required: true,
    },
  ];

  return parseGenerationPlan({
    schemaVersion: "1.0",
    generationId: stableId,
    companyId: bp.company.id,
    companySlug: bp.company.slug,
    sourceHashes: {
      companyKnowledgeHash: input.companyKnowledgeHash,
      masterBuildSpecificationHash: input.specificationHash,
      masterPromptHash: input.masterPromptHash,
      companyOSBlueprintHash: bp.contentHash ?? "",
    },
    template: {
      id: TEMPLATE_ID,
      version: TEMPLATE_VERSION,
      sourcePath: TEMPLATE_RELATIVE_PATH,
      contentHash: input.templateHash,
    },
    provider: {
      id: input.providerId,
      providerVersion: "1.0.0",
    },
    application: {
      framework: "Next.js",
      language: "TypeScript",
      packageManager: "npm",
      rtl: bp.company.rtl,
      primaryLanguage: bp.company.language,
    },
    tasks,
    expectedCoverage: {
      dashboardIds: bp.dashboards.map((d) => d.id),
      moduleIds: bp.modules.map((m) => m.id),
      workflowIds: bp.workflows.map((w) => w.id),
      agentIds: bp.agents.map((a) => a.id),
      entityIds: bp.dataModel.entities.map((e) => e.id),
      roleIds: bp.roles.map((r) => r.id),
    },
    policies: {
      allowedDependencies: ALLOWED_DEPENDENCIES,
      forbiddenDependencies: FORBIDDEN_DEPENDENCIES,
      maximumGeneratedFiles: 500,
      maximumTotalBytes: 25_000_000,
      allowNetworkDuringBuild: true,
      allowPostinstallScripts: false,
    },
    generatedAt: nowIso(),
  });
}
