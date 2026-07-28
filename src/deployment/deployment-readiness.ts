import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { CompanyRegistry } from "../registry/company-registry.js";
import type { FsCompanyOSBlueprintRepository } from "../blueprints/company-os-blueprint-repository.js";
import type { CompanyOSBlueprint } from "../blueprints/company-os-blueprint-schema.js";
import { GenerationWorkspace, type CurrentGenerationPointer } from "../generation/generation-workspace.js";
import { hashDirectory } from "../generation/generation-types.js";
import type { QualityArtifactRepository } from "../quality/quality-artifact-repository.js";
import { readJsonFile } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";

export type DeploymentReadinessContext = {
  companyId: string;
  companySlug: string;
  companyDisplayName: string;
  generationId: string;
  qualityRunId?: string;
  releaseAppDir: string;
  qualityAccepted: boolean;
  sourceHashesMatch: boolean;
  buildPassed: boolean;
  securityPassed: boolean;
  releaseImmutable: boolean;
  blueprint: CompanyOSBlueprint;
  appRoutes: string[];
  requireRtl: boolean;
};

export function collectKeyRoutes(runtime: unknown): string[] {
  const routes = new Set<string>(["/", "/settings", "/agents", "/workflows", "/modules", "/dashboards"]);
  const r = runtime as {
    navigation?: { primary?: Array<{ route?: string; id?: string }>; utility?: Array<{ route?: string }> };
    dashboards?: Array<{ route?: string; id?: string }>;
    modules?: Array<{ route?: string; id?: string }>;
    workflows?: Array<{ route?: string; id?: string }>;
    agents?: Array<{ route?: string; id?: string }>;
    settings?: { route?: string };
  };

  for (const d of r.dashboards ?? []) {
    if (d?.id) routes.add(`/dashboards/${d.id}`);
    else if (d?.route) routes.add(String(d.route));
  }
  for (const m of r.modules ?? []) {
    if (m?.id) routes.add(`/modules/${m.id}`);
    else if (m?.route) routes.add(String(m.route));
  }
  for (const w of r.workflows ?? []) {
    if (w?.id) routes.add(`/workflows/${w.id}`);
    else if (w?.route) routes.add(String(w.route));
  }
  for (const a of r.agents ?? []) {
    if (a?.id) routes.add(`/agents/${a.id}`);
    else if (a?.route) routes.add(String(a.route));
  }
  if (r.settings?.route) routes.add(String(r.settings.route));

  // Prefer representative coverage without exploding the smoke matrix.
  const ordered = [...routes].sort((a, b) => {
    const score = (route: string): number => {
      const s = route.toLowerCase();
      if (s === "/") return 0;
      if (s.includes("ceo") || s.includes("command") || s.includes("executive")) return 1;
      if (s.includes("production")) return 2;
      if (s.includes("quality")) return 3;
      if (s.includes("inventory") || s.includes("warehouse")) return 4;
      if (s.includes("finance") || s.includes("receivable")) return 5;
      if (s.startsWith("/modules/")) return 6;
      if (s.startsWith("/workflows/")) return 7;
      if (s.startsWith("/agents/")) return 8;
      if (s.includes("setting")) return 9;
      return 10;
    };
    return score(a) - score(b);
  });
  return ordered.slice(0, 12);
}

/**
 * Load and cross-check everything the pre-deployment gate needs: an accepted
 * generation, a quality report that accepted *that same* generation's release
 * content hash, and the release directory's continued presence on disk.
 */
export async function loadDeploymentReadiness(input: {
  registry: CompanyRegistry;
  blueprints: FsCompanyOSBlueprintRepository;
  workspace: GenerationWorkspace;
  qualityArtifacts: QualityArtifactRepository;
  companyName: string;
}): Promise<DeploymentReadinessContext> {
  const resolved = await input.registry.resolveByName(input.companyName);
  const slug = resolved.company.slug;
  const paths = input.workspace.resolvePaths(slug);

  let pointer: CurrentGenerationPointer;
  try {
    pointer = (await readJsonFile(paths.currentGenerationJson)) as CurrentGenerationPointer;
  } catch (error) {
    throw new AppError(
      "PREDEPLOY_GENERATION_NOT_ACCEPTED",
      `No accepted generation is available to deploy for ${resolved.company.displayName}`,
      { cause: error },
    );
  }
  if (!pointer?.generationId) {
    throw new AppError(
      "PREDEPLOY_GENERATION_NOT_ACCEPTED",
      "current-generation.json is missing a generationId",
    );
  }

  const blueprint = await input.blueprints.get(slug);
  if (!blueprint) {
    throw new AppError(
      "PREDEPLOY_GENERATION_NOT_ACCEPTED",
      `No CompanyOSBlueprint is available for ${resolved.company.displayName}`,
    );
  }

  const currentQuality = await input.qualityArtifacts.loadCurrentQuality(slug);
  if (!currentQuality || !currentQuality.accepted) {
    throw new AppError(
      "PREDEPLOY_QUALITY_NOT_ACCEPTED",
      `Quality gate has not accepted a release for ${resolved.company.displayName}. Run quality iteration first.`,
    );
  }
  if (currentQuality.generationId !== pointer.generationId) {
    throw new AppError(
      "PREDEPLOY_SOURCE_MISMATCH",
      "The accepted quality report does not match the current generation; re-run quality before deploying",
    );
  }

  const releaseAppDir = input.workspace.releaseAppDir(slug, pointer.generationId);
  let releaseImmutable = true;
  try {
    await stat(releaseAppDir);
  } catch {
    releaseImmutable = false;
  }

  const releaseContentHash = releaseImmutable ? await hashDirectory(releaseAppDir) : "";
  const sourceHashesMatch =
    releaseImmutable &&
    Boolean(currentQuality.releaseContentHash) &&
    releaseContentHash === currentQuality.releaseContentHash;

  const run = await input.qualityArtifacts.loadRun(slug, currentQuality.qualityRunId);
  const buildAuditor = run?.auditors.find((a) => a.id === "build-integrity");
  const securityAuditor = run?.auditors.find((a) => a.id === "security");
  const buildPassed = buildAuditor ? buildAuditor.status === "PASSED" : currentQuality.accepted;
  const securityPassed = securityAuditor
    ? securityAuditor.status !== "FAILED"
    : currentQuality.accepted;

  let runtime: unknown = {};
  try {
    runtime = JSON.parse(await readFile(join(releaseAppDir, "src/data/blueprint-runtime.json"), "utf8"));
  } catch {
    runtime = {};
  }

  return {
    companyId: resolved.company.id,
    companySlug: slug,
    companyDisplayName: resolved.company.displayName,
    generationId: pointer.generationId,
    qualityRunId: currentQuality.qualityRunId,
    releaseAppDir,
    qualityAccepted: currentQuality.accepted,
    sourceHashesMatch,
    buildPassed,
    securityPassed,
    releaseImmutable,
    blueprint,
    appRoutes: collectKeyRoutes(runtime),
    requireRtl: blueprint.company.rtl === true,
  };
}
