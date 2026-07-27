import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readdir,
  realpath,
  rm,
  stat,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { assertSafeSlug } from "../registry/slug.js";
import { writeJsonAtomic } from "../persistence/atomic.js";
import { assertInsideRoot, normalizeRoot, resolveUnderRoot } from "../security/paths.js";
import { AppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";
import {
  GenerationWorkspace,
  type CurrentGenerationPointer,
} from "./generation-workspace.js";

const SKIP_FROM_RELEASE = new Set(["node_modules"]);

async function copyTreeExcluding(input: {
  sourceRoot: string;
  destRoot: string;
  currentSource: string;
  skipDirNames: Set<string>;
}): Promise<void> {
  const entries = await readdir(input.currentSource, { withFileTypes: true });
  for (const entry of entries) {
    if (input.skipDirNames.has(entry.name)) continue;
    const sourcePath = join(input.currentSource, entry.name);
    const rel = relative(input.sourceRoot, sourcePath).replace(/\\/g, "/");
    const destPath = resolveUnderRoot(input.destRoot, ...rel.split("/").filter(Boolean));

    const meta = await lstat(sourcePath);
    if (meta.isSymbolicLink()) {
      const target = await realpath(sourcePath).catch(() => null);
      if (!target || !isUnder(input.sourceRoot, target)) {
        throw new AppError(
          "GENERATION_PROMOTION_FAILED",
          `Symlink escape rejected during release copy: ${rel}`,
        );
      }
      throw new AppError(
        "GENERATION_PROMOTION_FAILED",
        `Symlinks are not allowed in release copy: ${rel}`,
      );
    }
    if (meta.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await chmod(destPath, 0o755);
      await copyTreeExcluding({
        ...input,
        currentSource: sourcePath,
      });
      continue;
    }
    if (!meta.isFile()) continue;
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(sourcePath, destPath);
    await chmod(destPath, 0o644);
  }
}

function isUnder(root: string, candidate: string): boolean {
  try {
    assertInsideRoot(root, candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Promote a validated staging app to an immutable release directory.
 * Updates current-generation.json only after the copy succeeds.
 * Never deletes a previous successful release before the new one is promoted.
 * Cleans up old releases beyond retainLastN (minimum 3 kept).
 */
export async function promoteStagingToRelease(input: {
  projectsRoot: string;
  slug: string;
  generationId: string;
  stagingAppDir: string;
  blueprintHash: string;
  retainLastN?: number;
}): Promise<CurrentGenerationPointer> {
  const retainLastN = Math.max(3, input.retainLastN ?? 3);
  const slug = assertSafeSlug(input.slug);
  const workspace = new GenerationWorkspace(input.projectsRoot);
  const paths = await workspace.ensureDirs(slug, { generationId: input.generationId });

  const stagingAppDir = normalizeRoot(input.stagingAppDir);
  assertInsideRoot(paths.stagingRoot, stagingAppDir);

  try {
    await stat(stagingAppDir);
  } catch (error) {
    throw new AppError("GENERATION_PROMOTION_FAILED", "Staging app directory missing", {
      cause: error,
      details: { stagingAppDir },
    });
  }

  const releaseAppDir = workspace.releaseAppDir(slug, input.generationId);
  const releaseDir = workspace.releaseDir(slug, input.generationId);

  // Never touch the pointer until copy completes. Remove only the target release
  // directory if re-promoting the same generationId (idempotent overwrite of that id).
  await rm(releaseDir, { recursive: true, force: true });
  await mkdir(releaseAppDir, { recursive: true });

  try {
    await copyTreeExcluding({
      sourceRoot: stagingAppDir,
      destRoot: releaseAppDir,
      currentSource: stagingAppDir,
      skipDirNames: SKIP_FROM_RELEASE,
    });
  } catch (error) {
    await rm(releaseDir, { recursive: true, force: true }).catch(() => undefined);
    if (error instanceof AppError) throw error;
    throw new AppError("GENERATION_PROMOTION_FAILED", "Failed copying staging to release", {
      cause: error,
    });
  }

  const releaseRelativePath = relative(paths.root, releaseAppDir).replace(/\\/g, "/");
  const pointer: CurrentGenerationPointer = {
    generationId: input.generationId,
    companySlug: slug,
    blueprintHash: input.blueprintHash,
    releasedAt: nowIso(),
    releaseRelativePath,
  };

  try {
    await writeJsonAtomic(paths.currentGenerationJson, pointer);
  } catch (error) {
    throw new AppError(
      "GENERATION_PROMOTION_FAILED",
      "Release copied but current-generation pointer update failed",
      { cause: error, details: { releaseRelativePath } },
    );
  }

  await cleanupOldReleases({
    releasesRoot: paths.releasesRoot,
    keepGenerationId: input.generationId,
    retainLastN,
  });

  return pointer;
}

async function cleanupOldReleases(input: {
  releasesRoot: string;
  keepGenerationId: string;
  retainLastN: number;
}): Promise<void> {
  let entries;
  try {
    entries = await readdir(input.releasesRoot, { withFileTypes: true });
  } catch {
    return;
  }

  const releaseDirs: Array<{ name: string; mtimeMs: number }> = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = join(input.releasesRoot, entry.name);
    try {
      const s = await stat(full);
      releaseDirs.push({ name: entry.name, mtimeMs: s.mtimeMs });
    } catch {
      // ignore
    }
  }

  releaseDirs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const keep = new Set<string>([input.keepGenerationId]);
  for (const dir of releaseDirs) {
    if (keep.size >= input.retainLastN) break;
    keep.add(dir.name);
  }

  for (const dir of releaseDirs) {
    if (keep.has(dir.name)) continue;
    const full = join(input.releasesRoot, dir.name);
    await rm(full, { recursive: true, force: true }).catch(() => undefined);
  }
}
