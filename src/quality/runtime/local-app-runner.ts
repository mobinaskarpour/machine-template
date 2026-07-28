import { spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { createServer } from "node:net";
import { AppError } from "../../shared/errors.js";
import { normalizeRoot } from "../../security/paths.js";
import { probeHealth } from "./health-probe.js";
import { killProcessTree, isProcessRunning } from "./runtime-cleanup.js";

const NPM_BIN = "/usr/bin/npm";
const DEFAULT_HOST = "127.0.0.1";
const STARTUP_TIMEOUT_MS = 90_000;
const STARTUP_POLL_MS = 750;

/**
 * Long-running QA servers cannot use SafeCommandRunner (it waits for exit).
 * Controlled spawn with shell:false, absolute npm path, and kill on cleanup.
 */
export type LocalAppHandle = {
  pid: number;
  port: number;
  host: typeof DEFAULT_HOST;
  stop: () => Promise<void>;
};

export type StartLocalAppInput = {
  appDir: string;
  /** Preferred port; when omitted an ephemeral free port on 127.0.0.1 is allocated. */
  port?: number;
  startupTimeoutMs?: number;
};

async function assertNpm(): Promise<void> {
  try {
    await access(NPM_BIN, constants.X_OK);
  } catch (error) {
    throw new AppError("CONFIGURATION_ERROR", `npm not found at ${NPM_BIN}`, {
      cause: error,
    });
  }
}

/**
 * Bind briefly to 127.0.0.1:0 to allocate an ephemeral free port.
 * NEVER binds 0.0.0.0.
 */
export async function findFreePortOnLocalhost(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      reject(
        new AppError("QUALITY_RUNTIME_FAILED", "Failed to allocate free localhost port", {
          cause: error,
        }),
      );
    });
    server.listen(0, DEFAULT_HOST, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        reject(
          new AppError("QUALITY_RUNTIME_FAILED", "Failed to read allocated localhost port"),
        );
        return;
      }
      const { port } = addr;
      server.close((closeError) => {
        if (closeError) {
          reject(
            new AppError("QUALITY_RUNTIME_FAILED", "Failed closing port probe server", {
              cause: closeError,
            }),
          );
          return;
        }
        resolve(port);
      });
    });
  });
}

function buildMinimalEnv(): NodeJS.ProcessEnv {
  return {
    PATH: "/usr/bin:/bin",
    LANG: process.env.LANG ?? "C.UTF-8",
    HOME: process.env.HOME,
    NODE_ENV: "production",
    HOSTNAME: DEFAULT_HOST,
    HOST: DEFAULT_HOST,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start generated Next app on 127.0.0.1 only (never 0.0.0.0).
 * Uses `npm run start -- -H 127.0.0.1 -p <port>` so ephemeral ports override
 * any hardcoded -p in package.json scripts.
 */
export async function startLocalApp(
  input: StartLocalAppInput,
): Promise<LocalAppHandle> {
  await assertNpm();
  const appDir = normalizeRoot(input.appDir);
  const port = input.port ?? (await findFreePortOnLocalhost());
  const startupTimeoutMs = input.startupTimeoutMs ?? STARTUP_TIMEOUT_MS;

  let child: ChildProcess;
  try {
    child = spawn(
      NPM_BIN,
      ["run", "start", "--", "-H", DEFAULT_HOST, "-p", String(port)],
      {
        cwd: appDir,
        env: buildMinimalEnv(),
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
  } catch (error) {
    throw new AppError("QUALITY_RUNTIME_FAILED", "Failed to spawn local QA app", {
      cause: error,
      details: { appDir, port },
    });
  }

  const pid = child.pid;
  if (!pid) {
    throw new AppError("QUALITY_RUNTIME_FAILED", "Local QA app spawned without pid");
  }

  let stopped = false;
  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    await killProcessTree(pid);
  };

  child.on("error", () => {
    // surfaced via startup timeout / health probe failure
  });

  const deadline = Date.now() + startupTimeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessRunning(pid)) {
      await stop().catch(() => undefined);
      throw new AppError(
        "QUALITY_RUNTIME_FAILED",
        "Local QA app exited before becoming healthy",
        { details: { port, pid } },
      );
    }
    const health = await probeHealth({ port, host: DEFAULT_HOST, timeoutMs: 2_000 });
    if (health.ok) {
      return { pid, port, host: DEFAULT_HOST, stop };
    }
    await sleep(STARTUP_POLL_MS);
  }

  await stop().catch(() => undefined);
  throw new AppError(
    "QUALITY_RUNTIME_FAILED",
    `Local QA app failed to become healthy within ${startupTimeoutMs}ms`,
    { details: { port, pid } },
  );
}
