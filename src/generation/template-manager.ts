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
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { AppError } from "../shared/errors.js";
import { resolveUnderRoot, assertInsideRoot, normalizeRoot } from "../security/paths.js";
import { TEMPLATE_RELATIVE_PATH } from "./source-file-policy.js";
import { hashDirectory } from "./generation-types.js";

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

export function resolveTemplateRoot(cwd: string): string {
  return resolveUnderRoot(normalizeRoot(cwd), TEMPLATE_RELATIVE_PATH);
}

export async function hashTemplate(cwd: string): Promise<string> {
  const root = resolveTemplateRoot(cwd);
  try {
    await stat(root);
  } catch (error) {
    throw new AppError("CONFIGURATION_ERROR", `Template missing: ${TEMPLATE_RELATIVE_PATH}`, {
      cause: error,
      details: { templateRoot: root },
    });
  }
  return hashDirectory(root);
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
    const destPath = resolveUnderRoot(input.destRoot, ...rel.split("/"));

    let meta;
    try {
      meta = await lstat(sourcePath);
    } catch (error) {
      throw new AppError("GENERATION_POLICY_VIOLATION", `Cannot stat template path: ${rel}`, {
        cause: error,
      });
    }

    if (meta.isSymbolicLink()) {
      let target: string;
      try {
        target = await realpath(sourcePath);
      } catch (error) {
        throw new AppError(
          "GENERATION_POLICY_VIOLATION",
          `Broken symlink in template: ${rel}`,
          { cause: error },
        );
      }
      assertInsideRoot(input.sourceRoot, target);
      throw new AppError(
        "GENERATION_POLICY_VIOLATION",
        `Symlinks are not allowed in template copy: ${rel}`,
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

    if (!meta.isFile()) {
      continue;
    }

    if (isBinaryPath(entry.name)) {
      continue;
    }

    try {
      await copyFileStreaming(sourcePath, destPath);
    } catch {
      await copyFile(sourcePath, destPath);
      await chmod(destPath, 0o644);
    }
  }
}

/**
 * Recursively copy the approved template into staging.
 * No shell. Excludes .git, .env*, .next, node_modules, logs, *.demo-backup.
 * Rejects symlink escapes / symlinks. Skips unexpected binaries.
 */
export async function copyTemplateToStaging(input: {
  cwd: string;
  stagingAppDir: string;
}): Promise<{ templateRoot: string; filesCopiedHint: string }> {
  const templateRoot = resolveTemplateRoot(input.cwd);
  const stagingAppDir = normalizeRoot(input.stagingAppDir);

  try {
    await stat(templateRoot);
  } catch (error) {
    throw new AppError("CONFIGURATION_ERROR", `Template missing: ${TEMPLATE_RELATIVE_PATH}`, {
      cause: error,
    });
  }

  await rm(stagingAppDir, { recursive: true, force: true });
  await mkdir(stagingAppDir, { recursive: true });
  await chmod(stagingAppDir, 0o755);

  // Ensure staging path cannot escape via weird relative segments before copy.
  const stagingParent = dirname(stagingAppDir);
  assertInsideRoot(stagingParent, stagingAppDir);

  await walkAndCopy({
    sourceRoot: templateRoot,
    destRoot: stagingAppDir,
    currentSource: templateRoot,
  });

  return {
    templateRoot,
    filesCopiedHint: relative(resolve(input.cwd), stagingAppDir).split(sep).join("/"),
  };
}
