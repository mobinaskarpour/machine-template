import http from "node:http";

export type HealthProbeResult = {
  ok: boolean;
  statusCode?: number;
  latencyMs?: number;
};

export type HealthProbeInput = {
  port: number;
  host?: string;
  path?: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function singleGet(input: {
  host: string;
  port: number;
  path: string;
  timeoutMs: number;
}): Promise<HealthProbeResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: input.host,
        port: input.port,
        path: input.path,
        method: "GET",
        timeout: input.timeoutMs,
        // Explicit localhost only — never rely on DNS that could leave loopback.
        family: 4,
      },
      (res) => {
        res.resume();
        const statusCode = res.statusCode ?? 0;
        const latencyMs = Date.now() - started;
        const ok = statusCode >= 200 && statusCode < 500;
        resolve({ ok, statusCode, latencyMs });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, latencyMs: Date.now() - started });
    });
    req.on("error", () => {
      resolve({ ok: false, latencyMs: Date.now() - started });
    });
    req.end();
  });
}

/**
 * HTTP GET http://127.0.0.1:<port>/ with retries and timeout.
 * Uses node:http only (no external deps).
 */
export async function probeHealth(
  input: HealthProbeInput,
): Promise<HealthProbeResult> {
  const host = input.host ?? "127.0.0.1";
  const path = input.path ?? "/";
  const timeoutMs = input.timeoutMs ?? 3_000;
  const retries = Math.max(1, input.retries ?? 1);
  const retryDelayMs = input.retryDelayMs ?? 400;

  let last: HealthProbeResult = { ok: false };
  for (let attempt = 0; attempt < retries; attempt++) {
    last = await singleGet({ host, port: input.port, path, timeoutMs });
    if (last.ok) return last;
    if (attempt + 1 < retries) await sleep(retryDelayMs);
  }
  return last;
}
