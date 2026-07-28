import { createServer } from "node:net";
import { AsyncMutex, readJsonFile, writeJsonAtomic } from "../persistence/atomic.js";
import { AppError, isAppError } from "../shared/errors.js";
import { nowIso } from "../shared/ids.js";

export type PortAllocation = {
  port: number;
  companySlug: string;
  deploymentId: string;
  allocatedAt: string;
};

export type PortAllocationsFile = {
  schemaVersion: "1.0";
  allocations: PortAllocation[];
};

function emptyFile(): PortAllocationsFile {
  return { schemaVersion: "1.0", allocations: [] };
}

/**
 * Best-effort probe: attempts to bind 127.0.0.1:<port>. If bind succeeds the
 * port is free; if it fails (EADDRINUSE or similar) the port is in use.
 * Never binds 0.0.0.0.
 */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const server = createServer();
    server.once("error", () => resolvePromise(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolvePromise(true));
    });
  });
}

/**
 * Persistent, process-safe port allocation across the configured deployment
 * port range. Backed by a single JSON file guarded by an in-process mutex
 * plus a live bind-probe so stale records never block a genuinely-free port.
 */
export class PortAllocator {
  private readonly mutex = new AsyncMutex();

  constructor(
    private readonly filePath: string,
    private readonly portMin: number,
    private readonly portMax: number,
  ) {}

  private async load(): Promise<PortAllocationsFile> {
    try {
      const raw = await readJsonFile(this.filePath);
      const file = raw as PortAllocationsFile;
      if (!file || !Array.isArray(file.allocations)) return emptyFile();
      return file;
    } catch (error) {
      if (isAppError(error) && error.code === "NOT_FOUND") return emptyFile();
      throw error;
    }
  }

  /**
   * Allocate (or reuse) a port for a given company/deployment. Reuses any
   * existing allocation for the same companySlug so restarts keep their port.
   */
  async allocate(input: {
    companySlug: string;
    deploymentId: string;
    preferredPort?: number;
  }): Promise<number> {
    return this.mutex.runExclusive(async () => {
      const file = await this.load();
      const existing = file.allocations.find((a) => a.companySlug === input.companySlug);
      if (existing) {
        return existing.port;
      }

      const used = new Set(file.allocations.map((a) => a.port));
      const candidates: number[] = [];
      if (
        input.preferredPort !== undefined &&
        input.preferredPort >= this.portMin &&
        input.preferredPort <= this.portMax &&
        !used.has(input.preferredPort)
      ) {
        candidates.push(input.preferredPort);
      }
      for (let port = this.portMin; port <= this.portMax; port++) {
        if (!used.has(port) && port !== input.preferredPort) candidates.push(port);
      }

      for (const port of candidates) {
        if (await isPortFree(port)) {
          file.allocations.push({
            port,
            companySlug: input.companySlug,
            deploymentId: input.deploymentId,
            allocatedAt: nowIso(),
          });
          await writeJsonAtomic(this.filePath, file);
          return port;
        }
      }

      throw new AppError(
        "DEPLOYMENT_PORT_EXHAUSTED",
        `No free deployment port available in range ${this.portMin}-${this.portMax}`,
      );
    });
  }

  async release(companySlug: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      const file = await this.load();
      const next = file.allocations.filter((a) => a.companySlug !== companySlug);
      if (next.length === file.allocations.length) return;
      await writeJsonAtomic(this.filePath, { ...file, allocations: next });
    });
  }

  async currentPort(companySlug: string): Promise<number | null> {
    const file = await this.load();
    return file.allocations.find((a) => a.companySlug === companySlug)?.port ?? null;
  }
}
