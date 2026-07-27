import { mkdir, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import type { MasterBuildSpecification } from "./master-build-specification-schema.js";
import { parseMasterBuildSpecification } from "./master-build-specification-schema.js";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";

const MAX_HISTORY = 5;

export class FsMasterBuildSpecificationRepository {
  constructor(
    private readonly projectsRoot: string,
    private readonly memorySpecsDir: string,
  ) {}

  workspacePath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "master-build-specification.json",
    );
  }

  memoryPath(slug: string): string {
    return resolveUnderRoot(this.memorySpecsDir, `${assertSafeSlug(slug)}.json`);
  }

  historyDir(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "history",
      "specifications",
    );
  }

  async get(slug: string): Promise<MasterBuildSpecification | null> {
    try {
      return parseMasterBuildSpecification(await readJsonFile(this.workspacePath(slug)));
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async save(spec: MasterBuildSpecification): Promise<MasterBuildSpecification> {
    const validated = parseMasterBuildSpecification({
      ...spec,
      updatedAt: nowIso(),
    });
    const existing = await this.get(validated.company.slug);
    if (existing?.contentHash && existing.contentHash !== validated.contentHash) {
      const dir = this.historyDir(validated.company.slug);
      await mkdir(dir, { recursive: true });
      const stamp = (existing.updatedAt || nowIso()).replace(/[:.]/g, "-");
      await writeJsonAtomic(
        join(dir, `${stamp}-${(existing.contentHash ?? "x").slice(0, 12)}.json`),
        existing,
      );
      const entries = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse();
      for (const stale of entries.slice(MAX_HISTORY)) {
        await rename(join(dir, stale), join(dir, `.discarded-${stale}`)).catch(() => undefined);
      }
    }
    await writeJsonAtomic(this.workspacePath(validated.company.slug), validated);
    await writeJsonAtomic(this.memoryPath(validated.company.slug), validated);
    const a = parseMasterBuildSpecification(
      await readJsonFile(this.workspacePath(validated.company.slug)),
    );
    const b = parseMasterBuildSpecification(
      await readJsonFile(this.memoryPath(validated.company.slug)),
    );
    if (a.contentHash !== b.contentHash) {
      throw new AppError("KNOWLEDGE_MIRROR_MISMATCH", "Specification mirrors disagree");
    }
    return a;
  }
}
