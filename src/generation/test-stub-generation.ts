import type { ApplicationGenerationService, GenerationResult } from "../generation/application-generation-service.js";
import type { CompanyOSBlueprint } from "../blueprints/company-os-blueprint-schema.js";
import { nowIso } from "../shared/ids.js";
import { parseGenerationManifest } from "../generation/generation-manifest-schema.js";

/**
 * Test double for Phase 2/3 /demo tests — does not copy templates or run npm.
 * Phase 4 tests use the real ApplicationGenerationService.
 */
export function createStubGenerationService(messageExtra?: string): ApplicationGenerationService {
  const stub = {
    async generateFromExisting(): Promise<GenerationResult> {
      return stubResult(messageExtra);
    },
    async generateWithArtifacts(input: {
      blueprint: CompanyOSBlueprint;
      companyId: string;
    }): Promise<GenerationResult> {
      return stubResult(messageExtra, input.blueprint, input.companyId);
    },
  };
  return stub as unknown as ApplicationGenerationService;
}

function stubResult(
  messageExtra?: string,
  blueprint?: CompanyOSBlueprint,
  companyId?: string,
): GenerationResult {
  const generationId = "gen_teststub01";
  const slug = blueprint?.company.slug ?? "stub";
  const manifest = parseGenerationManifest({
    schemaVersion: "1.0",
    generationId,
    companyId: companyId ?? "co_stub",
    companySlug: slug,
    status: "PROMOTED",
    sourceHashes: {
      blueprintHash: blueprint?.contentHash ?? "x",
      specificationHash: "x",
      masterPromptHash: "x",
      templateHash: "x",
    },
    provider: { id: "FIXTURE" },
    releasePath: `generated/releases/${generationId}/app`,
    files: [],
    coverage: {
      dashboards: { expected: [], generated: [], missing: [] },
      modules: { expected: [], generated: [], missing: [] },
      workflows: { expected: [], generated: [], missing: [] },
      agents: { expected: [], generated: [], missing: [] },
      entities: { expected: [], generated: [], missing: [] },
    },
    validation: {
      sourcePolicy: true,
      dependencyPolicy: true,
      routeValidation: true,
      mockDataIntegrity: true,
      typecheck: true,
      tests: true,
      build: true,
      securityScan: true,
    },
    build: { command: [] },
    repairAttempts: [],
    mockRecordTotal: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  const base =
    blueprint && /[\u0600-\u06FF]/.test(blueprint.company.displayName)
      ? [
          "اپلیکیشن مدیریتی شرکت تولید و Build آن با موفقیت تأیید شد.",
          `شرکت: ${blueprint.company.displayName}`,
          `نسخه تولیدشده: ${generationId}`,
          "Application generated and build verified",
          "این نسخه هنوز Deploy نشده و URL عمومی ندارد.",
          "The application has not been deployed.",
        ].join("\n")
      : [
          "Application generated and build verified",
          "The application has not been deployed.",
        ].join("\n");

  return {
    ok: true,
    jobId: "job_stub",
    companyId: companyId ?? "co_stub",
    companySlug: slug,
    generationId,
    reused: false,
    manifest,
    message: messageExtra ? `${base}\n${messageExtra}` : base,
  };
}
