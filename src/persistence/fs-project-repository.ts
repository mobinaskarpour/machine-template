import { mkdir, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import type { ProjectRepository } from "./project-repository.js";
import {
  parseProjectRecord,
  type ProjectRecord,
} from "../shared/schemas.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import { AsyncMutex, readJsonFile, writeJsonAtomic } from "./atomic.js";
import { resolveUnderRoot } from "../security/paths.js";

/**
 * One JSON file per project under data/projects-meta/<id>.json
 * (workspace trees live separately under PROJECTS_ROOT).
 */
export class FsProjectRepository implements ProjectRepository {
  private readonly mutex = new AsyncMutex();

  constructor(private readonly projectsMetaDir: string) {}

  private fileFor(id: string): string {
    return resolveUnderRoot(this.projectsMetaDir, `${id}.json`);
  }

  private indexPath(): string {
    return resolveUnderRoot(this.projectsMetaDir, "index.json");
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.projectsMetaDir, { recursive: true });
  }

  private async readIndex(): Promise<Record<string, string>> {
    try {
      const data = await readJsonFile(this.indexPath());
      if (!data || typeof data !== "object") return {};
      return data as Record<string, string>;
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") return {};
      throw error;
    }
  }

  private async writeIndex(index: Record<string, string>): Promise<void> {
    await writeJsonAtomic(this.indexPath(), index);
  }

  async create(record: ProjectRecord): Promise<ProjectRecord> {
    const validated = parseProjectRecord(record);
    return this.mutex.runExclusive(async () => {
      await this.ensureDir();
      if (await this.getById(validated.id)) {
        throw new AppError(
          "ALREADY_EXISTS",
          `Project id already exists: ${validated.id}`,
        );
      }
      if (await this.getBySlug(validated.slug)) {
        throw new AppError(
          "ALREADY_EXISTS",
          `Project slug already exists: ${validated.slug}`,
        );
      }
      await writeJsonAtomic(this.fileFor(validated.id), validated);
      const index = await this.readIndex();
      index[validated.slug] = validated.id;
      await this.writeIndex(index);
      return validated;
    });
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    try {
      await access(this.fileFor(id), constants.F_OK);
    } catch {
      return null;
    }
    return parseProjectRecord(await readJsonFile(this.fileFor(id)));
  }

  async getBySlug(slug: string): Promise<ProjectRecord | null> {
    const index = await this.readIndex();
    const id = index[slug];
    if (!id) {
      const all = await this.list();
      return all.find((p) => p.slug === slug) ?? null;
    }
    return this.getById(id);
  }

  async list(): Promise<ProjectRecord[]> {
    await this.ensureDir();
    const entries = await readdir(this.projectsMetaDir);
    const records: ProjectRecord[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json") || entry === "index.json") continue;
      records.push(
        parseProjectRecord(await readJsonFile(join(this.projectsMetaDir, entry))),
      );
    }
    return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listByCompany(companyId: string): Promise<ProjectRecord[]> {
    const all = await this.list();
    return all.filter((p) => p.companyId === companyId);
  }

  async update(
    id: string,
    patch: Partial<Omit<ProjectRecord, "id" | "createdAt">>,
  ): Promise<ProjectRecord> {
    return this.mutex.runExclusive(async () => {
      const current = await this.getById(id);
      if (!current) {
        throw new AppError("NOT_FOUND", `Project not found: ${id}`);
      }
      const next = parseProjectRecord({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nowIso(),
      });
      if (next.slug !== current.slug) {
        const conflict = await this.getBySlug(next.slug);
        if (conflict && conflict.id !== id) {
          throw new AppError(
            "ALREADY_EXISTS",
            `Project slug already exists: ${next.slug}`,
          );
        }
        const index = await this.readIndex();
        delete index[current.slug];
        index[next.slug] = id;
        await this.writeIndex(index);
      }
      await writeJsonAtomic(this.fileFor(id), next);
      return next;
    });
  }
}
