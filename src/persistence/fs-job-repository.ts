import { mkdir, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import type { JobRepository } from "./job-repository.js";
import { parseJobRecord, type JobRecord } from "../shared/schemas.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import { AsyncMutex, readJsonFile, writeJsonAtomic } from "./atomic.js";
import { resolveUnderRoot } from "../security/paths.js";

/** One JSON file per job under data/jobs/<id>.json */
export class FsJobRepository implements JobRepository {
  private readonly mutex = new AsyncMutex();

  constructor(private readonly jobsDir: string) {}

  private fileFor(id: string): string {
    return resolveUnderRoot(this.jobsDir, `${id}.json`);
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.jobsDir, { recursive: true });
  }

  async create(record: JobRecord): Promise<JobRecord> {
    const validated = parseJobRecord(record);
    return this.mutex.runExclusive(async () => {
      await this.ensureDir();
      if (await this.getById(validated.id)) {
        throw new AppError("ALREADY_EXISTS", `Job id already exists: ${validated.id}`);
      }
      await writeJsonAtomic(this.fileFor(validated.id), validated);
      return validated;
    });
  }

  async getById(id: string): Promise<JobRecord | null> {
    try {
      await access(this.fileFor(id), constants.F_OK);
    } catch {
      return null;
    }
    return parseJobRecord(await readJsonFile(this.fileFor(id)));
  }

  async list(options?: {
    companyId?: string;
    limit?: number;
  }): Promise<JobRecord[]> {
    await this.ensureDir();
    const entries = await readdir(this.jobsDir);
    const records: JobRecord[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      const record = parseJobRecord(
        await readJsonFile(join(this.jobsDir, entry)),
      );
      if (options?.companyId && record.companyId !== options.companyId) {
        continue;
      }
      records.push(record);
    }
    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (options?.limit !== undefined) {
      return records.slice(0, options.limit);
    }
    return records;
  }

  async update(
    id: string,
    patch: Partial<Omit<JobRecord, "id" | "createdAt">>,
  ): Promise<JobRecord> {
    return this.mutex.runExclusive(async () => {
      const current = await this.getById(id);
      if (!current) {
        throw new AppError("NOT_FOUND", `Job not found: ${id}`);
      }
      const next = parseJobRecord({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nowIso(),
      });
      await writeJsonAtomic(this.fileFor(id), next);
      return next;
    });
  }
}
