import type { Logger } from "pino";
import { AppError } from "../shared/errors.js";
import { nowIso, shortStableHash } from "../shared/ids.js";
import type { DeploymentProvider } from "./providers/deployment-provider.js";
import type { DeploymentRepository } from "./deployment-repository.js";
import type { PortAllocator } from "./port-allocator.js";
import { buildProcessName, colorProcessName, otherColor, type DeploymentColor } from "./process-name.js";
import { parseDeploymentPlan, type DeploymentPlan } from "./deployment-plan-schema.js";
import { parseDeploymentRecord, type DeploymentRecord } from "./deployment-record-schema.js";
import { verifyDeploymentHealth } from "./health-verifier.js";

export type BlueGreenDeployInput = {
  provider: DeploymentProvider;
  repository: DeploymentRepository;
  portAllocator: PortAllocator;
  companyId: string;
  companySlug: string;
  generationId: string;
  gateId: string;
  releaseAppDir: string;
  publicExposureRequested: boolean;
  appRoutes: string[];
  dryRun?: boolean;
  logger: Logger;
  healthTimeoutMs?: number;
};

export type BlueGreenDeployResult = {
  plan: DeploymentPlan;
  record: DeploymentRecord;
  previousRecord: DeploymentRecord | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Blue/green deployment: start the new generation under a distinct pm2
 * process name + port, wait for it to become healthy, promote it to
 * "current", then stop and delete the previously-current process. If the new
 * process never becomes healthy it is torn down and the previous deployment
 * is left running untouched.
 */
export async function runBlueGreenDeploy(
  input: BlueGreenDeployInput,
): Promise<BlueGreenDeployResult> {
  const baseName = buildProcessName(input.companySlug);
  const previousRecord = await input.repository.getCurrent(input.companySlug);
  const activeColor: DeploymentColor =
    previousRecord?.color === "green" ? "green" : "blue";
  const targetColor: DeploymentColor = previousRecord ? otherColor(activeColor) : "blue";
  const targetProcessName = colorProcessName(baseName, targetColor);

  const deploymentId = `dep_${shortStableHash(
    `${input.companySlug}:${input.generationId}:${nowIso()}`,
  )}`;
  const port = await input.portAllocator.allocate({
    companySlug: `${input.companySlug}-${targetColor}`,
    deploymentId,
  });

  const plan = parseDeploymentPlan({
    schemaVersion: "1.0",
    planId: `plan_${shortStableHash(deploymentId)}`,
    companyId: input.companyId,
    companySlug: input.companySlug,
    generationId: input.generationId,
    gateId: input.gateId,
    processName: targetProcessName,
    color: targetColor,
    port,
    bindAddress: "127.0.0.1",
    publicExposureRequested: input.publicExposureRequested,
    strategy: "BLUE_GREEN",
    previousDeploymentId: previousRecord?.deploymentId,
    dryRun: Boolean(input.dryRun),
    createdAt: nowIso(),
  });

  const baseRecord = (status: DeploymentRecord["status"]): DeploymentRecord =>
    parseDeploymentRecord({
      schemaVersion: "1.0",
      deploymentId,
      companyId: input.companyId,
      companySlug: input.companySlug,
      generationId: input.generationId,
      gateId: input.gateId,
      processName: targetProcessName,
      color: targetColor,
      port,
      bindAddress: "127.0.0.1",
      status,
      publicUrl: null,
      previousDeploymentId: previousRecord?.deploymentId ?? null,
      restartCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

  if (input.dryRun) {
    return { plan, record: baseRecord("PENDING"), previousRecord };
  }

  let record = baseRecord("STARTING");
  await input.repository.saveDeploymentRecord(input.companySlug, record);

  try {
    await input.provider.start({
      processName: targetProcessName,
      appDir: input.releaseAppDir,
      port,
      env: {
        MACHINE_GENERATION_ID: input.generationId,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
    });
  } catch (error) {
    record = { ...record, status: "FAILED", updatedAt: nowIso() };
    await input.repository.saveDeploymentRecord(input.companySlug, record);
    await input.portAllocator.release(`${input.companySlug}-${targetColor}`).catch(() => undefined);
    throw error;
  }

  const healthy = await waitForHealthy({
    provider: input.provider,
    processName: targetProcessName,
    port,
    companySlug: input.companySlug,
    generationId: input.generationId,
    appRoutes: input.appRoutes,
    timeoutMs: input.healthTimeoutMs ?? 45_000,
    logger: input.logger,
  });

  if (!healthy) {
    input.logger.warn(
      { companySlug: input.companySlug, processName: targetProcessName },
      "deployment.health_failed_rolling_back_new_process",
    );
    await input.provider.stop(targetProcessName).catch(() => undefined);
    await input.provider.delete(targetProcessName).catch(() => undefined);
    await input.portAllocator.release(`${input.companySlug}-${targetColor}`).catch(() => undefined);
    record = { ...record, status: "FAILED", updatedAt: nowIso() };
    await input.repository.saveDeploymentRecord(input.companySlug, record);
    throw new AppError(
      "DEPLOYMENT_HEALTH_FAILED",
      "New deployment failed health checks; the previous deployment (if any) was left running",
    );
  }

  record = { ...record, status: "HEALTHY", healthyAt: nowIso(), updatedAt: nowIso() };
  await input.repository.saveDeploymentRecord(input.companySlug, record);
  await input.repository.setCurrent(input.companySlug, record);

  if (previousRecord && previousRecord.processName !== targetProcessName) {
    await input.provider.stop(previousRecord.processName).catch(() => undefined);
    await input.provider.delete(previousRecord.processName).catch(() => undefined);
    await input.portAllocator
      .release(`${input.companySlug}-${activeColor}`)
      .catch(() => undefined);
  }

  return { plan, record, previousRecord };
}

async function waitForHealthy(input: {
  provider: DeploymentProvider;
  processName: string;
  port: number;
  companySlug: string;
  generationId: string;
  appRoutes: string[];
  timeoutMs: number;
  logger: Logger;
}): Promise<boolean> {
  const deadline = Date.now() + input.timeoutMs;
  let lastResult: Awaited<ReturnType<typeof verifyDeploymentHealth>> | undefined;
  while (Date.now() < deadline) {
    lastResult = await verifyDeploymentHealth({
      provider: input.provider,
      processName: input.processName,
      port: input.port,
      companySlug: input.companySlug,
      generationId: input.generationId,
      appRoutes: input.appRoutes,
    });
    if (lastResult.healthy) return true;
    await sleep(1_000);
  }
  if (lastResult) {
    input.logger.warn({ checks: lastResult.checks }, "deployment.health_wait_timed_out");
  }
  return false;
}
