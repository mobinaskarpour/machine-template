import { createConnection } from "node:net";
import http from "node:http";
import { redactSecrets } from "../security/redact.js";
import { probeHealth } from "../quality/runtime/health-probe.js";
import type { DeploymentProvider } from "./providers/deployment-provider.js";

export type HealthCheckDetail = {
  id: string;
  passed: boolean;
  message?: string;
};

export type DeploymentHealthResult = {
  healthy: boolean;
  checks: HealthCheckDetail[];
  restartCount: number;
  sanitizedLogsTail: string[];
};

function checkPortListening(port: number, host = "127.0.0.1", timeoutMs = 2_000): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ port, host, timeout: timeoutMs });
    const finish = (ok: boolean) => {
      socket.destroy();
      resolvePromise(ok);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

function fetchHealthJson(port: number, timeoutMs = 3_000): Promise<Record<string, unknown> | null> {
  return new Promise((resolvePromise) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: "/api/health", method: "GET", timeout: timeoutMs, family: 4 },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          try {
            resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
          } catch {
            resolvePromise(null);
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolvePromise(null);
    });
    req.on("error", () => resolvePromise(null));
    req.end();
  });
}

export type VerifyDeploymentHealthInput = {
  provider: DeploymentProvider;
  processName: string;
  port: number;
  companySlug: string;
  generationId: string;
  /** At least one non-root application route to spot-check, e.g. a dashboard route. */
  appRoutes: string[];
};

/**
 * Full Phase 6 health verification: pm2 process state, port reachability,
 * `/api/health` payload identity match, main page + one app route reachable,
 * restart-count stability, and a sanitized tail of recent logs.
 */
export async function verifyDeploymentHealth(
  input: VerifyDeploymentHealthInput,
): Promise<DeploymentHealthResult> {
  const checks: HealthCheckDetail[] = [];

  const status = await input.provider.describe(input.processName);
  checks.push({
    id: "pm2-online",
    passed: status?.status === "online",
    message: status ? `status=${status.status}` : "process not found in pm2",
  });

  const listening = await checkPortListening(input.port);
  checks.push({
    id: "port-listening",
    passed: listening,
    message: listening ? undefined : `port ${input.port} is not accepting connections`,
  });

  const healthJson = await fetchHealthJson(input.port);
  const healthMatch =
    healthJson !== null &&
    healthJson.companySlug === input.companySlug &&
    healthJson.generationId === input.generationId;
  checks.push({
    id: "health-api-match",
    passed: healthMatch,
    message: healthMatch
      ? undefined
      : healthJson
        ? `/api/health returned companySlug=${String(healthJson.companySlug)} generationId=${String(healthJson.generationId)}`
        : "/api/health was unreachable or invalid",
  });

  const mainPage = await probeHealth({ port: input.port, path: "/", retries: 2, timeoutMs: 3_000 });
  checks.push({
    id: "main-page",
    passed: mainPage.ok,
    message: mainPage.ok ? undefined : `main page returned ${mainPage.statusCode ?? "no response"}`,
  });

  let routeOk = true;
  let routeMessage: string | undefined;
  const firstRoute = input.appRoutes.find((r) => r && r !== "/");
  if (firstRoute) {
    const routeProbe = await probeHealth({ port: input.port, path: firstRoute, retries: 1, timeoutMs: 3_000 });
    routeOk = routeProbe.ok;
    routeMessage = routeProbe.ok ? undefined : `${firstRoute} returned ${routeProbe.statusCode ?? "no response"}`;
  }
  checks.push({ id: "app-route", passed: routeOk, message: routeMessage });

  const restartCount = status?.restarts ?? 0;
  checks.push({
    id: "restart-count-stable",
    passed: restartCount < 5,
    message: `restarts=${restartCount}`,
  });

  const logs = status ? await input.provider.logs(input.processName, 50).catch(() => ({ out: [], err: [] })) : { out: [], err: [] };
  const sanitizedLogsTail = [...logs.out, ...logs.err]
    .slice(-20)
    .map((line) => redactSecrets(line));

  return {
    healthy: checks.every((c) => c.passed),
    checks,
    restartCount,
    sanitizedLogsTail,
  };
}
