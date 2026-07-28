import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError, isAppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";

const STALE_LOCK_MS = 15 * 60 * 1000;

export type DeploymentLockHandle = {
  release: () => Promise<void>;
};

type LockFileContent = {
  holder: string;
  pid: number;
  acquiredAt: string;
};

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Per-company deployment lock. A stale lock (older than STALE_LOCK_MS, or
 * whose owning pid is no longer alive) is reclaimed automatically so a
 * crashed deployment never permanently wedges a company.
 */
export async function acquireDeploymentLock(
  lockPath: string,
  holder: string,
): Promise<DeploymentLockHandle> {
  await mkdir(dirname(lockPath), { recursive: true });

  let existing: LockFileContent | null = null;
  try {
    existing = (await readJsonFile(lockPath)) as LockFileContent;
  } catch (error) {
    if (!(isAppError(error) && (error.code === "NOT_FOUND" || error.code === "VALIDATION_ERROR"))) {
      throw error;
    }
  }

  if (existing) {
    const ageMs = Date.now() - new Date(existing.acquiredAt).getTime();
    const stale = !Number.isFinite(ageMs) || ageMs > STALE_LOCK_MS || !isPidAlive(existing.pid);
    if (!stale) {
      throw new AppError(
        "DEPLOYMENT_LOCK_HELD",
        `A deployment is already in progress (held by ${existing.holder})`,
      );
    }
  }

  await writeJsonAtomic(lockPath, {
    holder,
    pid: process.pid,
    acquiredAt: nowIso(),
  } satisfies LockFileContent);

  let released = false;
  return {
    release: async () => {
      if (released) return;
      released = true;
      await rm(lockPath, { force: true });
    },
  };
}
