import { readdir, readFile } from "node:fs/promises";
import { AppError } from "../../shared/errors.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isProcessRunning(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function listChildPids(parentPid: number): Promise<number[]> {
  const children: number[] = [];
  let entries: string[];
  try {
    entries = await readdir("/proc");
  } catch {
    return children;
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    if (pid === parentPid) continue;
    try {
      const status = await readFile(`/proc/${pid}/status`, "utf8");
      const match = /^PPid:\s+(\d+)/m.exec(status);
      if (match && Number(match[1]) === parentPid) {
        children.push(pid);
      }
    } catch {
      // process may have exited
    }
  }
  return children;
}

async function collectProcessTree(rootPid: number): Promise<number[]> {
  const ordered: number[] = [];
  const queue = [rootPid];
  const seen = new Set<number>();
  while (queue.length > 0) {
    const pid = queue.shift()!;
    if (seen.has(pid)) continue;
    seen.add(pid);
    ordered.push(pid);
    const kids = await listChildPids(pid);
    for (const child of kids) queue.push(child);
  }
  // Kill children before parents
  return ordered.reverse();
}

function signalPid(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(pid, signal);
  } catch {
    // already gone
  }
  try {
    // Process group (when spawned detached)
    process.kill(-pid, signal);
  } catch {
    // not a group leader / ESRCH
  }
}

/**
 * Kill a process tree by pid, verify it is gone, and throw QUALITY_RUNTIME_FAILED
 * if leftovers remain after kill attempts.
 */
export async function killProcessTree(pid: number): Promise<void> {
  if (!isProcessRunning(pid)) return;

  const tree = await collectProcessTree(pid);
  for (const target of tree) {
    signalPid(target, "SIGTERM");
  }
  await sleep(400);

  if (isProcessRunning(pid)) {
    const again = await collectProcessTree(pid);
    for (const target of again) {
      signalPid(target, "SIGKILL");
    }
    await sleep(300);
  }

  if (isProcessRunning(pid)) {
    throw new AppError(
      "QUALITY_RUNTIME_FAILED",
      `Process ${pid} still running after kill attempts`,
      { details: { pid } },
    );
  }
}

/**
 * Verify a previously started QA runtime is fully cleaned up.
 */
export async function assertRuntimeStopped(pid: number): Promise<void> {
  if (isProcessRunning(pid)) {
    await killProcessTree(pid);
  }
  if (isProcessRunning(pid)) {
    throw new AppError(
      "QUALITY_RUNTIME_FAILED",
      `QA runtime process ${pid} was not cleaned up`,
      { details: { pid } },
    );
  }
}
