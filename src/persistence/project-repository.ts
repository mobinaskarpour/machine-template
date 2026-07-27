import type { ProjectRecord } from "../shared/schemas.js";

export interface ProjectRepository {
  create(record: ProjectRecord): Promise<ProjectRecord>;
  getById(id: string): Promise<ProjectRecord | null>;
  getBySlug(slug: string): Promise<ProjectRecord | null>;
  listByCompany(companyId: string): Promise<ProjectRecord[]>;
  list(): Promise<ProjectRecord[]>;
  update(
    id: string,
    patch: Partial<Omit<ProjectRecord, "id" | "createdAt">>,
  ): Promise<ProjectRecord>;
}
