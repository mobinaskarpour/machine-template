import { mkdir } from "node:fs/promises";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import {
  parsePreDeploymentGateResult,
  type PreDeploymentGateResult,
} from "./predeployment-gate-schema.js";

export type CurrentPreDeploymentPointer = {
  schemaVersion: "1.0";
  companySlug: string;
  gateId: string;
  generationId: string;
  passed: boolean;
  updatedAt: string;
};

function safeId(id: string, label: string): string {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw new AppError("VALIDATION_ERROR", `Unsafe ${label}: ${id}`);
  }
  return id;
}

export class PreDeploymentRepository {
  constructor(private readonly projectsRoot: string) {}

  private safeSlug(slug: string): string {
    return assertSafeSlug(slug);
  }

  gateDir(slug: string, gateId: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      "artifacts",
      "predeploy",
      safeId(gateId, "gateId"),
    );
  }

  pointerPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      this.safeSlug(slug),
      ".factory",
      "current-predeploy.json",
    );
  }

  async save(slug: string, result: PreDeploymentGateResult): Promise<CurrentPreDeploymentPointer> {
    const validated = parsePreDeploymentGateResult(result);
    const dir = this.gateDir(slug, validated.gateId);
    await mkdir(dir, { recursive: true });
    await writeJsonAtomic(resolveUnderRoot(dir, "gate-result.json"), validated);

    const pointer: CurrentPreDeploymentPointer = {
      schemaVersion: "1.0",
      companySlug: this.safeSlug(slug),
      gateId: validated.gateId,
      generationId: validated.generationId,
      passed: validated.passed,
      updatedAt: nowIso(),
    };
    await writeJsonAtomic(this.pointerPath(slug), pointer);
    return pointer;
  }

  async loadPointer(slug: string): Promise<CurrentPreDeploymentPointer | null> {
    try {
      return (await readJsonFile(this.pointerPath(slug))) as CurrentPreDeploymentPointer;
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async loadGate(slug: string, gateId: string): Promise<PreDeploymentGateResult | null> {
    try {
      return parsePreDeploymentGateResult(
        await readJsonFile(resolveUnderRoot(this.gateDir(slug, gateId), "gate-result.json")),
      );
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }
}
