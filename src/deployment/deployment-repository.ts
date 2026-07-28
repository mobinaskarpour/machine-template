import { mkdir, readdir } from "node:fs/promises";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import { parseDeploymentRecord, type DeploymentRecord } from "./deployment-record-schema.js";

export type DeploymentSummary = {
  companySlug: string;
  deploymentId: string;
  generationId: string;
  status: DeploymentRecord["status"];
  processName: string;
  port: number;
  publicUrl: string | null;
  restartCount: number;
  updatedAt: string;
};

function safeId(id: string, label: string): string {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw new AppError("VALIDATION_ERROR", `Unsafe ${label}: ${id}`);
  }
  return id;
}

export class DeploymentRepository {
  constructor(
    private readonly projectsRoot: string,
    private readonly memoryDeploymentsDir: string,
  ) {}

  private safeSlug(slug: string): string {
    return assertSafeSlug(slug);
  }

  currentDeploymentPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      ".factory",
      "current-deployment.json",
    );
  }

  deploymentSummaryPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      ".factory",
      "deployment-summary.json",
    );
  }

  deploymentRecordPath(slug: string, deploymentId: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      "artifacts",
      "deployment",
      "deployments",
      `${safeId(deploymentId, "deploymentId")}.json`,
    );
  }

  memoryPath(slug: string): string {
    return resolveUnderRoot(this.memoryDeploymentsDir, `${this.safeSlug(slug)}.json`);
  }

  async ensureDirs(slug: string): Promise<void> {
    const safe = this.safeSlug(slug);
    await mkdir(resolveUnderRoot(this.projectsRoot, safe, ".factory"), { recursive: true });
    await mkdir(
      resolveUnderRoot(this.projectsRoot, safe, "artifacts", "deployment", "deployments"),
      { recursive: true },
    );
    await mkdir(this.memoryDeploymentsDir, { recursive: true });
  }

  async saveDeploymentRecord(slug: string, record: DeploymentRecord): Promise<DeploymentRecord> {
    const validated = parseDeploymentRecord(record);
    await this.ensureDirs(slug);
    await writeJsonAtomic(this.deploymentRecordPath(slug, validated.deploymentId), validated);
    return validated;
  }

  async loadDeploymentRecord(slug: string, deploymentId: string): Promise<DeploymentRecord | null> {
    try {
      return parseDeploymentRecord(
        await readJsonFile(this.deploymentRecordPath(slug, deploymentId)),
      );
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async setCurrent(slug: string, record: DeploymentRecord): Promise<void> {
    const validated = parseDeploymentRecord(record);
    await this.ensureDirs(slug);
    await writeJsonAtomic(this.currentDeploymentPath(slug), validated);
    await writeJsonAtomic(this.memoryPath(slug), validated);
    const summary: DeploymentSummary = {
      companySlug: validated.companySlug,
      deploymentId: validated.deploymentId,
      generationId: validated.generationId,
      status: validated.status,
      processName: validated.processName,
      port: validated.port,
      publicUrl: validated.publicUrl,
      restartCount: validated.restartCount,
      updatedAt: validated.updatedAt,
    };
    await writeJsonAtomic(this.deploymentSummaryPath(slug), summary);
  }

  async getCurrent(slug: string): Promise<DeploymentRecord | null> {
    try {
      return parseDeploymentRecord(await readJsonFile(this.currentDeploymentPath(slug)));
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async requireCurrent(slug: string): Promise<DeploymentRecord> {
    const current = await this.getCurrent(slug);
    if (!current) {
      throw new AppError("DEPLOYMENT_NOT_FOUND", `No deployment found for ${slug}`);
    }
    return current;
  }

  async listDeploymentRecords(slug: string): Promise<DeploymentRecord[]> {
    const safe = this.safeSlug(slug);
    const dir = resolveUnderRoot(this.projectsRoot, safe, "artifacts", "deployment", "deployments");
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return [];
    }
    const records: DeploymentRecord[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json") || entry.endsWith(".manifest.json")) continue;
      try {
        records.push(parseDeploymentRecord(await readJsonFile(resolveUnderRoot(dir, entry))));
      } catch {
        // skip unreadable/corrupt record files
      }
    }
    records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return records;
  }

  async getSummary(slug: string): Promise<DeploymentSummary | null> {
    try {
      return (await readJsonFile(this.deploymentSummaryPath(slug))) as DeploymentSummary;
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  now(): string {
    return nowIso();
  }
}
