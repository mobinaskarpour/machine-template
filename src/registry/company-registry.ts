import type { CompanyRepository } from "../persistence/company-repository.js";
import type { ProjectRepository } from "../persistence/project-repository.js";
import type { CompanyRecord, ProjectRecord } from "../shared/schemas.js";
import { newId, nowIso } from "../shared/ids.js";
import { createSlug, assertSafeSlug } from "./slug.js";
import { WorkspaceManager } from "../workspaces/workspace-manager.js";
import { AppError } from "../shared/errors.js";
import { compactCompanyName, isLikelySameCompanyName } from "./name-normalize.js";

export type ResolveCompanyResult = {
  company: CompanyRecord;
  project: ProjectRecord;
  workspaceCreated: boolean;
  workspacePath: string;
};

export class CompanyRegistry {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly projects: ProjectRepository,
    private readonly workspaces: WorkspaceManager,
  ) {}

  async resolveByName(displayName: string): Promise<ResolveCompanyResult> {
    const name = displayName.trim();
    if (!name) {
      throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
    }

    const all = await this.companies.list();
    const existing = all.find((c) => this.matchesCompany(c, name)) ?? null;

    if (existing) {
      if (
        compactCompanyName(existing.displayName) !== compactCompanyName(name) &&
        !existing.aliases.some(
          (a) => compactCompanyName(a) === compactCompanyName(name),
        )
      ) {
        await this.companies.update(existing.id, {
          aliases: [...existing.aliases, name],
        });
      }
      const refreshed = (await this.companies.getById(existing.id)) ?? existing;
      const projects = await this.projects.listByCompany(refreshed.id);
      let project = projects[0];
      if (!project) {
        project = await this.createProjectFor(refreshed);
      }
      const ws = await this.workspaces.createOrOpen({
        companySlug: refreshed.slug,
        companyId: refreshed.id,
        projectId: project.id,
        displayName: refreshed.displayName,
        reopen: true,
      });
      return {
        company: refreshed,
        project,
        workspaceCreated: ws.created,
        workspacePath: ws.paths.root,
      };
    }

    const taken = all.map((c) => c.slug);
    const slug = assertSafeSlug(createSlug(name, { taken }));
    const timestamp = nowIso();
    const companyId = newId("co");
    const projectId = newId("proj");
    const noSpace = name.replace(/\s+/g, "");
    const aliases = noSpace && noSpace !== name ? [noSpace] : [];

    const ws = await this.workspaces.createOrOpen({
      companySlug: slug,
      companyId,
      projectId,
      displayName: name,
      reopen: false,
    });

    const company = await this.companies.create({
      id: companyId,
      slug,
      displayName: name,
      aliases,
      status: "CREATED",
      workspacePath: ws.paths.root,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const project = await this.projects.create({
      id: projectId,
      companyId,
      slug,
      workspacePath: ws.paths.root,
      status: "INITIALIZED",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      company,
      project,
      workspaceCreated: ws.created,
      workspacePath: ws.paths.root,
    };
  }

  async getByIdOrSlug(idOrSlug: string): Promise<CompanyRecord | null> {
    const byId = await this.companies.getById(idOrSlug);
    if (byId) return byId;
    return this.companies.getBySlug(idOrSlug);
  }

  async findByName(name: string): Promise<CompanyRecord | null> {
    const all = await this.companies.list();
    return all.find((c) => this.matchesCompany(c, name.trim())) ?? null;
  }

  private matchesCompany(company: CompanyRecord, query: string): boolean {
    if (company.displayName.toLowerCase() === query.toLowerCase()) return true;
    if (company.aliases.some((a) => a.toLowerCase() === query.toLowerCase())) {
      return true;
    }
    if (company.slug === createSlug(query)) return true;
    if (isLikelySameCompanyName(company.displayName, query)) return true;
    if (company.aliases.some((a) => isLikelySameCompanyName(a, query))) return true;
    return false;
  }

  private async createProjectFor(company: CompanyRecord): Promise<ProjectRecord> {
    const timestamp = nowIso();
    return this.projects.create({
      id: newId("proj"),
      companyId: company.id,
      slug: company.slug,
      workspacePath: company.workspacePath,
      status: "INITIALIZED",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}
