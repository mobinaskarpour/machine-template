import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { assertSafeSlug } from "../registry/slug.js";
import { assertInsideRoot, normalizeRoot, resolveUnderRoot } from "../security/paths.js";
import { AppError } from "../shared/errors.js";

export type CurrentGenerationPointer = {
  generationId: string;
  companySlug: string;
  blueprintHash: string;
  releasedAt: string;
  releaseRelativePath: string;
};

export type GenerationWorkspacePaths = {
  root: string;
  factoryDir: string;
  generationPlanJson: string;
  currentGenerationJson: string;
  generationManifestJson: string;
  buildReportJson: string;
  generatedDir: string;
  stagingRoot: string;
  releasesRoot: string;
  artifactsRoot: string;
};

export class GenerationWorkspace {
  constructor(private readonly projectsRoot: string) {}

  resolveCompanyRoot(slug: string): string {
    return resolveUnderRoot(this.projectsRoot, assertSafeSlug(slug));
  }

  resolvePaths(slug: string): GenerationWorkspacePaths {
    const safe = assertSafeSlug(slug);
    const root = resolveUnderRoot(this.projectsRoot, safe);
    const factoryDir = join(root, ".factory");
    const generatedDir = join(root, "generated");
    return {
      root,
      factoryDir,
      generationPlanJson: join(factoryDir, "generation-plan.json"),
      currentGenerationJson: join(factoryDir, "current-generation.json"),
      generationManifestJson: join(factoryDir, "generation-manifest.json"),
      buildReportJson: join(factoryDir, "build-report.json"),
      generatedDir,
      stagingRoot: join(generatedDir, "staging"),
      releasesRoot: join(generatedDir, "releases"),
      artifactsRoot: join(root, "artifacts", "generation"),
    };
  }

  stagingAppDir(slug: string, jobId: string): string {
    const safeJob = sanitizeIdSegment(jobId, "jobId");
    return resolveUnderRoot(
      this.resolvePaths(slug).stagingRoot,
      safeJob,
      "app",
    );
  }

  releaseAppDir(slug: string, generationId: string): string {
    const safeGen = sanitizeIdSegment(generationId, "generationId");
    return resolveUnderRoot(
      this.resolvePaths(slug).releasesRoot,
      safeGen,
      "app",
    );
  }

  releaseDir(slug: string, generationId: string): string {
    const safeGen = sanitizeIdSegment(generationId, "generationId");
    return resolveUnderRoot(this.resolvePaths(slug).releasesRoot, safeGen);
  }

  artifactsDir(slug: string, jobId: string): string {
    const safeJob = sanitizeIdSegment(jobId, "jobId");
    return resolveUnderRoot(this.resolvePaths(slug).artifactsRoot, safeJob);
  }

  async ensureDirs(slug: string, opts?: { jobId?: string; generationId?: string }): Promise<GenerationWorkspacePaths> {
    const paths = this.resolvePaths(slug);
    assertInsideRoot(this.projectsRoot, paths.root);
    await mkdir(paths.factoryDir, { recursive: true });
    await mkdir(paths.stagingRoot, { recursive: true });
    await mkdir(paths.releasesRoot, { recursive: true });
    await mkdir(paths.artifactsRoot, { recursive: true });
    if (opts?.jobId) {
      await mkdir(this.stagingAppDir(slug, opts.jobId), { recursive: true });
      await mkdir(this.artifactsDir(slug, opts.jobId), { recursive: true });
    }
    if (opts?.generationId) {
      await mkdir(this.releaseAppDir(slug, opts.generationId), { recursive: true });
    }
    return paths;
  }

  assertPathInsideStaging(stagingAppDir: string, candidate: string): string {
    return assertInsideRoot(normalizeRoot(stagingAppDir), candidate);
  }
}

function sanitizeIdSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new AppError("VALIDATION_ERROR", `Invalid ${label} for generation workspace path`, {
      details: { [label]: value },
    });
  }
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    throw new AppError("VALIDATION_ERROR", `Unsafe ${label} for generation workspace path`, {
      details: { [label]: value },
    });
  }
  return trimmed;
}
