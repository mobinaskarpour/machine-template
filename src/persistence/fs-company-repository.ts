import { mkdir, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import type { CompanyRepository } from "./company-repository.js";
import {
  parseCompanyRecord,
  type CompanyRecord,
} from "../shared/schemas.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import { AsyncMutex, readJsonFile, writeJsonAtomic } from "./atomic.js";
import { resolveUnderRoot } from "../security/paths.js";

/**
 * One JSON file per company under data/companies/<id>.json
 * plus an index.json mapping slug → id for fast lookup.
 */
export class FsCompanyRepository implements CompanyRepository {
  private readonly mutex = new AsyncMutex();

  constructor(private readonly companiesDir: string) {}

  private fileFor(id: string): string {
    return resolveUnderRoot(this.companiesDir, `${id}.json`);
  }

  private indexPath(): string {
    return resolveUnderRoot(this.companiesDir, "index.json");
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.companiesDir, { recursive: true });
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

  async create(record: CompanyRecord): Promise<CompanyRecord> {
    const validated = parseCompanyRecord(record);
    return this.mutex.runExclusive(async () => {
      await this.ensureDir();
      const existing = await this.getById(validated.id);
      if (existing) {
        throw new AppError(
          "ALREADY_EXISTS",
          `Company id already exists: ${validated.id}`,
        );
      }
      const bySlug = await this.getBySlug(validated.slug);
      if (bySlug) {
        throw new AppError(
          "ALREADY_EXISTS",
          `Company slug already exists: ${validated.slug}`,
        );
      }
      await writeJsonAtomic(this.fileFor(validated.id), validated);
      const index = await this.readIndex();
      index[validated.slug] = validated.id;
      await this.writeIndex(index);
      return validated;
    });
  }

  async getById(id: string): Promise<CompanyRecord | null> {
    try {
      await access(this.fileFor(id), constants.F_OK);
    } catch {
      return null;
    }
    const raw = await readJsonFile(this.fileFor(id));
    return parseCompanyRecord(raw);
  }

  async getBySlug(slug: string): Promise<CompanyRecord | null> {
    const index = await this.readIndex();
    const id = index[slug];
    if (!id) {
      // fallback scan for corrupted index
      const all = await this.list();
      return all.find((c) => c.slug === slug) ?? null;
    }
    return this.getById(id);
  }

  async list(): Promise<CompanyRecord[]> {
    await this.ensureDir();
    const entries = await readdir(this.companiesDir);
    const records: CompanyRecord[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json") || entry === "index.json") continue;
      const raw = await readJsonFile(join(this.companiesDir, entry));
      records.push(parseCompanyRecord(raw));
    }
    return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async update(
    id: string,
    patch: Partial<Omit<CompanyRecord, "id" | "createdAt">>,
  ): Promise<CompanyRecord> {
    return this.mutex.runExclusive(async () => {
      const current = await this.getById(id);
      if (!current) {
        throw new AppError("NOT_FOUND", `Company not found: ${id}`);
      }
      const next = parseCompanyRecord({
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
            `Company slug already exists: ${next.slug}`,
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
