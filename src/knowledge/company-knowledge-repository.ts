import { mkdir, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import type { CompanyKnowledge } from "./company-knowledge-schema.js";
import {
  hashKnowledgeContent,
  normalizeCompanyKnowledge,
  semanticValidateKnowledge,
} from "./knowledge-normalizer.js";
import { parseCompanyKnowledge } from "./company-knowledge-schema.js";
import { AppError } from "../shared/errors.js";
import { resolveUnderRoot } from "../security/paths.js";
import { assertSafeSlug } from "../registry/slug.js";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { nowIso } from "../shared/ids.js";

export interface CompanyKnowledgeRepository {
  getBySlug(slug: string): Promise<CompanyKnowledge | null>;
  save(knowledge: CompanyKnowledge): Promise<CompanyKnowledge>;
}

const MAX_HISTORY = 5;

export class FsCompanyKnowledgeRepository implements CompanyKnowledgeRepository {
  constructor(
    private readonly projectsRoot: string,
    private readonly memoryDir: string,
    private readonly validationOptions: {
      minReadyConfidence: number;
      minWebsiteConfidence: number;
    },
  ) {}

  workspaceKnowledgePath(slug: string): string {
    const safe = assertSafeSlug(slug);
    return resolveUnderRoot(
      this.projectsRoot,
      safe,
      ".factory",
      "knowledge.json",
    );
  }

  memoryKnowledgePath(slug: string): string {
    const safe = assertSafeSlug(slug);
    return resolveUnderRoot(this.memoryDir, `${safe}.json`);
  }

  historyDir(slug: string): string {
    const safe = assertSafeSlug(slug);
    return resolveUnderRoot(
      this.projectsRoot,
      safe,
      ".factory",
      "history",
      "knowledge",
    );
  }

  async getBySlug(slug: string): Promise<CompanyKnowledge | null> {
    const path = this.workspaceKnowledgePath(slug);
    try {
      const raw = await readJsonFile(path);
      return parseCompanyKnowledge(raw);
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") {
        // try memory mirror
        try {
          const raw = await readJsonFile(this.memoryKnowledgePath(slug));
          return parseCompanyKnowledge(raw);
        } catch (inner) {
          if (inner instanceof AppError && inner.code === "NOT_FOUND") return null;
          throw inner;
        }
      }
      throw error;
    }
  }

  async save(knowledge: CompanyKnowledge): Promise<CompanyKnowledge> {
    let normalized = normalizeCompanyKnowledge(knowledge);
    normalized = semanticValidateKnowledge(normalized, this.validationOptions);
    const contentHash = hashKnowledgeContent(normalized);
    const toSave: CompanyKnowledge = {
      ...normalized,
      contentHash,
      updatedAt: nowIso(),
    };

    const workspacePath = this.workspaceKnowledgePath(toSave.companySlug);
    const memoryPath = this.memoryKnowledgePath(toSave.companySlug);

    // Backup previous valid version
    const existing = await this.getBySlug(toSave.companySlug).catch(() => null);
    if (existing?.contentHash && existing.contentHash !== contentHash) {
      await this.archiveVersion(existing);
    }

    await writeJsonAtomic(workspacePath, toSave);
    await writeJsonAtomic(memoryPath, toSave);

    const workspaceReload = parseCompanyKnowledge(await readJsonFile(workspacePath));
    const memoryReload = parseCompanyKnowledge(await readJsonFile(memoryPath));
    if (
      workspaceReload.contentHash !== contentHash ||
      memoryReload.contentHash !== contentHash
    ) {
      throw new AppError(
        "KNOWLEDGE_MIRROR_MISMATCH",
        "Workspace and memory knowledge hashes do not match after save",
      );
    }
    return toSave;
  }

  private async archiveVersion(knowledge: CompanyKnowledge): Promise<void> {
    const dir = this.historyDir(knowledge.companySlug);
    await mkdir(dir, { recursive: true });
    const stamp = (knowledge.updatedAt || nowIso()).replace(/[:.]/g, "-");
    const hash = knowledge.contentHash?.slice(0, 12) ?? "unknown";
    const target = join(dir, `${stamp}-${hash}.json`);
    await writeJsonAtomic(target, knowledge);

    // Retention: keep newest MAX_HISTORY
    const entries = (await readdir(dir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    for (const stale of entries.slice(MAX_HISTORY)) {
      // rename to .old then ignore — avoid unlink races; simple overwrite discard by moving aside
      try {
        await rename(join(dir, stale), join(dir, `.discarded-${stale}`));
      } catch {
        // ignore retention failures
      }
    }
  }
}
