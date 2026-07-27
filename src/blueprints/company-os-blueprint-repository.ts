import { mkdir, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import {
  parseCompanyOSBlueprint,
  parseBlueprintSummary,
  type CompanyOSBlueprint,
  type BlueprintSummary,
} from "./company-os-blueprint-schema.js";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";

const MAX_HISTORY = 5;

export class FsCompanyOSBlueprintRepository {
  constructor(
    private readonly projectsRoot: string,
    private readonly memoryBlueprintsDir: string,
  ) {}

  workspacePath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "company-os-blueprint.json",
    );
  }

  summaryPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "company-os-blueprint-summary.json",
    );
  }

  memoryPath(slug: string): string {
    return resolveUnderRoot(this.memoryBlueprintsDir, `${assertSafeSlug(slug)}.json`);
  }

  historyDir(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "history",
      "blueprints",
    );
  }

  async get(slug: string): Promise<CompanyOSBlueprint | null> {
    try {
      return parseCompanyOSBlueprint(await readJsonFile(this.workspacePath(slug)));
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async save(
    blueprint: CompanyOSBlueprint,
    summary: BlueprintSummary,
  ): Promise<CompanyOSBlueprint> {
    const validated = parseCompanyOSBlueprint({
      ...blueprint,
      updatedAt: nowIso(),
    });
    parseBlueprintSummary(summary);

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
    await writeJsonAtomic(this.summaryPath(validated.company.slug), summary);

    const a = parseCompanyOSBlueprint(await readJsonFile(this.workspacePath(validated.company.slug)));
    const b = parseCompanyOSBlueprint(await readJsonFile(this.memoryPath(validated.company.slug)));
    if (a.contentHash !== b.contentHash) {
      throw new AppError("BLUEPRINT_MIRROR_MISMATCH", "Blueprint mirrors disagree");
    }
    return a;
  }
}
