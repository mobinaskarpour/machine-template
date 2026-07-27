import { mkdir, open, rename, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AppError } from "../shared/errors.js";

/**
 * Atomic write: write temp file in same directory, fsync, rename.
 */
export async function writeJsonAtomic(
  filePath: string,
  data: unknown,
): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmpPath = join(dir, `.${process.pid}.${Date.now()}.tmp`);
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  try {
    const handle = await open(tmpPath, "w");
    try {
      await handle.writeFile(payload, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tmpPath, filePath);
  } catch (error) {
    try {
      await writeFile(tmpPath, ""); // best-effort cleanup marker
    } catch {
      // ignore cleanup failure
    }
    throw new AppError("PERSISTENCE_ERROR", `Failed atomic write: ${filePath}`, {
      cause: error,
    });
  }
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new AppError("NOT_FOUND", `File not found: ${filePath}`, {
        cause: error,
      });
    }
    if (error instanceof SyntaxError) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Invalid JSON in file: ${filePath}`,
        { cause: error },
      );
    }
    throw new AppError("PERSISTENCE_ERROR", `Failed reading: ${filePath}`, {
      cause: error,
    });
  }
}

/** Simple in-process mutex for index updates. */
export class AsyncMutex {
  private chain: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.chain;
    this.chain = previous.then(() => next);
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
