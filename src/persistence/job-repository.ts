import type { JobRecord } from "../shared/schemas.js";

export interface JobRepository {
  create(record: JobRecord): Promise<JobRecord>;
  getById(id: string): Promise<JobRecord | null>;
  list(options?: { companyId?: string; limit?: number }): Promise<JobRecord[]>;
  update(
    id: string,
    patch: Partial<Omit<JobRecord, "id" | "createdAt">>,
  ): Promise<JobRecord>;
}
