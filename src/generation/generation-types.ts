import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export function hashBuffer(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

export async function hashFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function hashDirectory(root: string): Promise<string> {
  const files: string[] = [];
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else files.push(full);
    }
  }
  await walk(root);
  files.sort();
  const hash = createHash("sha256");
  for (const f of files) {
    hash.update(relative(root, f));
    hash.update(await hashFile(f));
  }
  return hash.digest("hex");
}

export async function listFilesRecursive(root: string): Promise<Array<{ path: string; size: number }>> {
  const out: Array<{ path: string; size: number }> = [];
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else {
        const s = await stat(full);
        out.push({ path: relative(root, full).replace(/\\/g, "/"), size: s.size });
      }
    }
  }
  await walk(root);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Mulberry32 seeded PRNG */
export function createSeededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = h >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
