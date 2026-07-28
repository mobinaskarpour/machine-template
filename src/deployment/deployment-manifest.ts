import { mkdir } from "node:fs/promises";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { writeJsonAtomic } from "../persistence/atomic.js";
import type { DeploymentPlan } from "./deployment-plan-schema.js";
import type { DeploymentRecord } from "./deployment-record-schema.js";

export type SanitizedDeploymentManifest = {
  schemaVersion: "1.0";
  companySlug: string;
  generationId: string;
  gateId: string;
  processName: string;
  color: DeploymentPlan["color"];
  port: number;
  bindAddress: "127.0.0.1";
  publicExposureRequested: boolean;
  publicUrl: string | null;
  status: DeploymentRecord["status"];
  strategy: "BLUE_GREEN";
  createdAt: string;
  updatedAt: string;
};

/**
 * Persist a manifest combining plan + record with no environment values or
 * secrets — only identifiers, ports, and status are ever written here.
 */
export async function writeDeploymentManifest(input: {
  projectsRoot: string;
  slug: string;
  deploymentId: string;
  plan: DeploymentPlan;
  record: DeploymentRecord;
}): Promise<SanitizedDeploymentManifest> {
  const slug = assertSafeSlug(input.slug);
  const dir = resolveUnderRoot(
    input.projectsRoot,
    slug,
    "artifacts",
    "deployment",
    "deployments",
  );
  await mkdir(dir, { recursive: true });

  const manifest: SanitizedDeploymentManifest = {
    schemaVersion: "1.0",
    companySlug: slug,
    generationId: input.record.generationId,
    gateId: input.plan.gateId,
    processName: input.record.processName,
    color: input.plan.color,
    port: input.record.port,
    bindAddress: "127.0.0.1",
    publicExposureRequested: input.plan.publicExposureRequested,
    publicUrl: input.record.publicUrl,
    status: input.record.status,
    strategy: "BLUE_GREEN",
    createdAt: input.plan.createdAt,
    updatedAt: input.record.updatedAt,
  };

  await writeJsonAtomic(
    resolveUnderRoot(dir, `${input.deploymentId}.manifest.json`),
    manifest,
  );
  return manifest;
}
