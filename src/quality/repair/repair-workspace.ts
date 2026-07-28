import { createReadStream, createWriteStream } from "node:fs";
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
import { dirname, extname, join, relative } from "node:path";
import { pipeline } from "node:stream/promises";
import { assertSafeSlug } from "../../registry/slug.js";
import {
  assertInsideRoot,
  normalizeRoot,
  resolveUnderRoot,
} from "../../security/paths.js";
import { AppError } from "../../shared/errors.js";

const EXCLUDED_DIR_NAMES = new Set([
  ".git",
  ".next",
  "node_modules",
  "logs",
]);

const BINARY_EXTENSIONS = new Set([
  ".exe",
  ".bin",
  ".so",
  ".dll",
  ".dylib",
  ".o",
  ".a",
  ".wasm",
]);

function isExcludedName(name: string): boolean {
  if (EXCLUDED_DIR_NAMES.has(name)) return true;
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (name.endsWith(".demo-backup")) return true;
  return false;
}

function isBinaryPath(name: string): boolean {
  return BINARY_EXTENSIONS.has(extname(name).toLowerCase());
}

function sanitizeQualityRunId(qualityRunId: string): string {
  const trimmed = qualityRunId.trim();
  if (
    !trimmed ||
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\")
  ) {
    throw new AppError("VALIDATION_ERROR", "Unsafe quality run id for repair staging", {
      details: { qualityRunId },
    });
  }
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    throw new AppError("VALIDATION_ERROR", "Unsafe quality run id for repair staging", {
      details: { qualityRunId },
    });
  }
  return trimmed;
}

async function copyFileStreaming(src: string, dest: string): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await pipeline(createReadStream(src), createWriteStream(dest, { mode: 0o644 }));
  await chmod(dest, 0o644);
}

async function walkAndCopy(input: {
  sourceRoot: string;
  destRoot: string;
  currentSource: string;
}): Promise<void> {
  const entries = await readdir(input.currentSource, { withFileTypes: true });
  for (const entry of entries) {
    if (isExcludedName(entry.name)) continue;

    const sourcePath = join(input.currentSource, entry.name);
    const rel = relative(input.sourceRoot, sourcePath).replace(/\\/g, "/");
    const destPath = resolveUnderRoot(input.destRoot, ...rel.split("/").filter(Boolean));

    let meta;
    try {
      meta = await lstat(sourcePath);
    } catch (error) {
      throw new AppError("QUALITY_REPAIR_FAILED", `Cannot stat release path: ${rel}`, {
        cause: error,
      });
    }

    if (meta.isSymbolicLink()) {
      let target: string;
      try {
        target = await realpath(sourcePath);
      } catch (error) {
        throw new AppError("QUALITY_REPAIR_FAILED", `Broken symlink in release: ${rel}`, {
          cause: error,
        });
      }
      assertInsideRoot(input.sourceRoot, target);
      throw new AppError(
        "QUALITY_REPAIR_FAILED",
        `Symlinks are not allowed in repair staging copy: ${rel}`,
        { details: { path: rel } },
      );
    }

    if (meta.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await chmod(destPath, 0o755);
      await walkAndCopy({
        sourceRoot: input.sourceRoot,
        destRoot: input.destRoot,
        currentSource: sourcePath,
      });
      continue;
    }

    if (!meta.isFile()) continue;
    if (isBinaryPath(entry.name)) continue;

    try {
      await copyFileStreaming(sourcePath, destPath);
    } catch {
      await copyFile(sourcePath, destPath);
      await chmod(destPath, 0o644);
    }
  }
}

/**
 * Copy a release app into quality repair staging (no shell).
 * Excludes .git, .env*, .next, node_modules, logs.
 */
export async function prepareRepairStaging(input: {
  projectsRoot: string;
  slug: string;
  qualityRunId: string;
  sourceReleaseAppDir: string;
}): Promise<{ stagingAppDir: string }> {
  const slug = assertSafeSlug(input.slug);
  const runId = sanitizeQualityRunId(input.qualityRunId);
  const sourceRoot = normalizeRoot(input.sourceReleaseAppDir);

  try {
    await stat(sourceRoot);
  } catch (error) {
    throw new AppError("QUALITY_NOT_READY", "Source release app directory missing", {
      cause: error,
      details: { sourceReleaseAppDir: sourceRoot },
    });
  }

  const stagingAppDir = resolveUnderRoot(
    input.projectsRoot,
    slug,
    "generated",
    "staging",
    `quality-${runId}`,
    "app",
  );
  const stagingParent = dirname(stagingAppDir);

  await rm(stagingParent, { recursive: true, force: true });
  await mkdir(stagingAppDir, { recursive: true });

  try {
    await walkAndCopy({
      sourceRoot,
      destRoot: stagingAppDir,
      currentSource: sourceRoot,
    });
  } catch (error) {
    await rm(stagingParent, { recursive: true, force: true }).catch(() => undefined);
    if (error instanceof AppError) throw error;
    throw new AppError("QUALITY_REPAIR_FAILED", "Failed copying release to repair staging", {
      cause: error,
    });
  }

  return { stagingAppDir };
}
