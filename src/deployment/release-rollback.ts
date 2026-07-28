import { stat } from "node:fs/promises";
import type { Logger } from "pino";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import type { GenerationWorkspace } from "../generation/generation-workspace.js";
import type { DeploymentRepository } from "./deployment-repository.js";
import type { DeploymentProvider } from "./providers/deployment-provider.js";
import type { PortAllocator } from "./port-allocator.js";
import type { DeploymentRecord } from "./deployment-record-schema.js";
import { runBlueGreenDeploy, type BlueGreenDeployResult } from "./deployment-orchestrator.js";

/**
 * Find the most recent previously-healthy deployment for a company (other
 * than the currently active one) whose release directory still exists on
 * disk, so it can be redeployed as a rollback target.
 */
export async function findRollbackTarget(input: {
  repository: DeploymentRepository;
  workspace: GenerationWorkspace;
  companySlug: string;
}): Promise<DeploymentRecord | null> {
  const current = await input.repository.getCurrent(input.companySlug);
  const records = await input.repository.listDeploymentRecords(input.companySlug);
  for (const candidate of records) {
    if (candidate.status !== "HEALTHY") continue;
    if (current && candidate.deploymentId === current.deploymentId) continue;
    if (current && candidate.generationId === current.generationId) continue;
    const releaseAppDir = input.workspace.releaseAppDir(input.companySlug, candidate.generationId);
    try {
      await stat(releaseAppDir);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function rollbackToPreviousDeployment(input: {
  provider: DeploymentProvider;
  repository: DeploymentRepository;
  portAllocator: PortAllocator;
  workspace: GenerationWorkspace;
  companyId: string;
  companySlug: string;
  appRoutes: string[];
  logger: Logger;
}): Promise<BlueGreenDeployResult> {
  const target = await findRollbackTarget({
    repository: input.repository,
    workspace: input.workspace,
    companySlug: input.companySlug,
  });
  if (!target) {
    throw new AppError(
      "DEPLOYMENT_NOT_FOUND",
      `No previous healthy deployment is available to roll back to for ${input.companySlug}`,
    );
  }

  const releaseAppDir = input.workspace.releaseAppDir(input.companySlug, target.generationId);
  return runBlueGreenDeploy({
    provider: input.provider,
    repository: input.repository,
    portAllocator: input.portAllocator,
    companyId: input.companyId,
    companySlug: input.companySlug,
    generationId: target.generationId,
    gateId: `rollback_${nowIso()}`,
    releaseAppDir,
    publicExposureRequested: false,
    appRoutes: input.appRoutes,
    logger: input.logger,
  });
}
