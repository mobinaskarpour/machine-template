import type { CompanyKnowledge } from "./company-knowledge-schema.js";
import type { CompanyKnowledgeRepository } from "./company-knowledge-repository.js";
import { AppError } from "../shared/errors.js";

export class CompanyKnowledgeService {
  constructor(private readonly repo: CompanyKnowledgeRepository) {}

  async get(slug: string): Promise<CompanyKnowledge | null> {
    return this.repo.getBySlug(slug);
  }

  async require(slug: string): Promise<CompanyKnowledge> {
    const knowledge = await this.repo.getBySlug(slug);
    if (!knowledge) {
      throw new AppError("KNOWLEDGE_NOT_FOUND", `Knowledge not found for ${slug}`);
    }
    return knowledge;
  }

  async save(knowledge: CompanyKnowledge): Promise<CompanyKnowledge> {
    try {
      return await this.repo.save(knowledge);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("KNOWLEDGE_PERSISTENCE_FAILED", "Failed to persist knowledge", {
        cause: error,
      });
    }
  }
}
