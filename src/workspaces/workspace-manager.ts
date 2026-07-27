import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { AppError } from "../shared/errors.js";
import { assertSafeSlug } from "../registry/slug.js";
import { resolveUnderRoot, assertInsideRoot } from "../security/paths.js";
import { writeJsonAtomic, readJsonFile } from "../persistence/atomic.js";
import { nowIso } from "../shared/ids.js";

export type WorkspacePaths = {
  root: string;
  factoryDir: string;
  companyJson: string;
  projectJson: string;
  stateJson: string;
  generatedDir: string;
  sourceDir: string;
  logsDir: string;
  artifactsDir: string;
};

export type WorkspaceMeta = {
  companyId: string;
  projectId: string;
  companySlug: string;
  createdAt: string;
  updatedAt: string;
};

export class WorkspaceManager {
  constructor(private readonly projectsRoot: string) {}

  resolvePaths(companySlug: string): WorkspacePaths {
    const slug = assertSafeSlug(companySlug);
    const root = resolveUnderRoot(this.projectsRoot, slug);
    const factoryDir = join(root, ".factory");
    return {
      root,
      factoryDir,
      companyJson: join(factoryDir, "company.json"),
      projectJson: join(factoryDir, "project.json"),
      stateJson: join(factoryDir, "state.json"),
      generatedDir: join(root, "generated"),
      sourceDir: join(root, "source"),
      logsDir: join(root, "logs"),
      artifactsDir: join(root, "artifacts"),
    };
  }

  async exists(companySlug: string): Promise<boolean> {
    const paths = this.resolvePaths(companySlug);
    try {
      await access(paths.root, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new workspace. Fails if it already exists unless reopen=true.
   */
  async createOrOpen(input: {
    companySlug: string;
    companyId: string;
    projectId: string;
    displayName: string;
    reopen?: boolean;
  }): Promise<{ paths: WorkspacePaths; created: boolean; meta: WorkspaceMeta }> {
    const paths = this.resolvePaths(input.companySlug);
    assertInsideRoot(this.projectsRoot, paths.root);

    const already = await this.exists(input.companySlug);
    if (already && !input.reopen) {
      throw new AppError(
        "ALREADY_EXISTS",
        `Workspace already exists for slug: ${input.companySlug}`,
        { details: { workspacePath: paths.root } },
      );
    }

    if (!already) {
      await mkdir(paths.factoryDir, { recursive: true });
      await mkdir(paths.generatedDir, { recursive: true });
      await mkdir(paths.sourceDir, { recursive: true });
      await mkdir(paths.logsDir, { recursive: true });
      await mkdir(paths.artifactsDir, { recursive: true });

      const timestamp = nowIso();
      const companyDoc = {
        id: input.companyId,
        slug: input.companySlug,
        displayName: input.displayName,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const projectDoc = {
        id: input.projectId,
        companyId: input.companyId,
        slug: input.companySlug,
        workspacePath: paths.root,
        status: "INITIALIZED",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const stateDoc = {
        phase: "0",
        status: "INITIALIZED",
        updatedAt: timestamp,
      };

      await writeJsonAtomic(paths.companyJson, companyDoc);
      await writeJsonAtomic(paths.projectJson, projectDoc);
      await writeJsonAtomic(paths.stateJson, stateDoc);

      return {
        paths,
        created: true,
        meta: {
          companyId: input.companyId,
          projectId: input.projectId,
          companySlug: input.companySlug,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      };
    }

    // Reopen existing — do not overwrite company/project identity unexpectedly
    const companyRaw = await readJsonFile(paths.companyJson);
    const company = companyRaw as { id?: string; slug?: string; createdAt?: string };
    if (company.id && company.id !== input.companyId) {
      throw new AppError(
        "ALREADY_EXISTS",
        "Workspace belongs to a different company id",
        {
          details: {
            existingCompanyId: company.id,
            requestedCompanyId: input.companyId,
          },
        },
      );
    }

    const updatedAt = nowIso();
    await writeJsonAtomic(paths.stateJson, {
      phase: "0",
      status: "REOPENED",
      updatedAt,
    });

    return {
      paths,
      created: false,
      meta: {
        companyId: (company.id as string) ?? input.companyId,
        projectId: input.projectId,
        companySlug: input.companySlug,
        createdAt: (company.createdAt as string) ?? updatedAt,
        updatedAt,
      },
    };
  }
}
