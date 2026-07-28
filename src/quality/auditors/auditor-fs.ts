import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".html",
]);

export async function listReleaseTextFiles(
  root: string,
  options?: { underSrcOnly?: boolean },
): Promise<string[]> {
  const out: string[] = [];
  const start = options?.underSrcOnly ? join(root, "src") : root;

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext) || entry.name === "package.json") {
        out.push(full);
      }
    }
  }

  await walk(start);
  return out;
}

export async function readReleaseText(
  root: string,
  relativePath: string,
): Promise<string | null> {
  try {
    return await readFile(join(root, relativePath), "utf8");
  } catch {
    return null;
  }
}

export async function fileExists(
  root: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const s = await stat(join(root, relativePath));
    return s.isFile();
  } catch {
    return false;
  }
}

export function toRel(root: string, full: string): string {
  return relative(root, full).replace(/\\/g, "/");
}

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, Math.round(n * 1e4) / 1e4));
}
