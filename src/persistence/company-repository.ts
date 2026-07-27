import type { CompanyRecord } from "../shared/schemas.js";

export interface CompanyRepository {
  create(record: CompanyRecord): Promise<CompanyRecord>;
  getById(id: string): Promise<CompanyRecord | null>;
  getBySlug(slug: string): Promise<CompanyRecord | null>;
  list(): Promise<CompanyRecord[]>;
  update(
    id: string,
    patch: Partial<Omit<CompanyRecord, "id" | "createdAt">>,
  ): Promise<CompanyRecord>;
}
