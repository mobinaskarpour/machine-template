import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MasterPromptArtifact } from "./master-prompt-schema.js";
import { parseMasterPromptArtifact } from "./master-prompt-schema.js";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot } from "../security/paths.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";

const MAX_HISTORY = 5;

export class FsMasterPromptRepository {
  constructor(private readonly projectsRoot: string) {}

  jsonPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "master-prompt.json",
    );
  }

  textPath(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "master-prompt.txt",
    );
  }

  historyDir(slug: string): string {
    return resolveUnderRoot(
      this.projectsRoot,
      assertSafeSlug(slug),
      ".factory",
      "history",
      "prompts",
    );
  }

  async get(slug: string): Promise<MasterPromptArtifact | null> {
    try {
      return parseMasterPromptArtifact(await readJsonFile(this.jsonPath(slug)));
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  async save(artifact: MasterPromptArtifact): Promise<MasterPromptArtifact> {
    const validated = parseMasterPromptArtifact({
      ...artifact,
      generatedAt: artifact.generatedAt || nowIso(),
    });
    const existing = await this.get(validated.companySlug);
    if (existing?.contentHash && existing.contentHash !== validated.contentHash) {
      const dir = this.historyDir(validated.companySlug);
      await mkdir(dir, { recursive: true });
      const stamp = (existing.generatedAt || nowIso()).replace(/[:.]/g, "-");
      await writeJsonAtomic(
        join(dir, `${stamp}-${(existing.contentHash ?? "x").slice(0, 12)}.json`),
        existing,
      );
      const entries = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse();
      for (const stale of entries.slice(MAX_HISTORY)) {
        await rename(join(dir, stale), join(dir, `.discarded-${stale}`)).catch(() => undefined);
      }
    }
    await writeJsonAtomic(this.jsonPath(validated.companySlug), validated);
    await mkdir(resolveUnderRoot(this.projectsRoot, assertSafeSlug(validated.companySlug), ".factory"), {
      recursive: true,
    });
    await writeFile(this.textPath(validated.companySlug), validated.prompt, "utf8");
    return validated;
  }
}
