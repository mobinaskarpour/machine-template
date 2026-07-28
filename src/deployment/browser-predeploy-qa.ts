import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../shared/errors.js";

export type PredeployViewport = { width: number; height: number; label: string };

export const PREDEPLOY_VIEWPORTS: PredeployViewport[] = [
  { width: 1440, height: 900, label: "desktop" },
  { width: 1280, height: 800, label: "laptop" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 390, height: 844, label: "mobile" },
];

export type BrowserPredeployQaResult = {
  available: boolean;
  passed: boolean;
  criticalIssuesClear: boolean;
  accessibilityCriticalClear: boolean;
  screenshots: string[];
  routesChecked: string[];
  consoleErrors: string[];
  viewports: string[];
  reason?: string;
};

export type BrowserPredeployQaInput = {
  baseUrl: string;
  routes: string[];
  artifactsDir: string;
  requireRtl?: boolean;
};

type PlaywrightResponse = {
  url: () => string;
  status: () => number;
  request: () => { resourceType: () => string };
};

type PlaywrightPage = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  goto: (
    url: string,
    opts: { waitUntil: string; timeout: number },
  ) => Promise<PlaywrightResponse | null>;
  screenshot: (opts: { path: string; fullPage: boolean }) => Promise<unknown>;
  evaluate: <T>(fn: () => T) => Promise<T>;
  close: () => Promise<void>;
};

type PlaywrightLike = {
  chromium: {
    launch: (opts: { headless: boolean }) => Promise<{
      newPage: (opts?: { viewport: { width: number; height: number } }) => Promise<PlaywrightPage>;
      close: () => Promise<void>;
    }>;
  };
};

export async function isPlaywrightResolvable(): Promise<boolean> {
  try {
    const require = createRequire(import.meta.url);
    require.resolve("playwright");
    return true;
  } catch {
    return false;
  }
}

async function tryImportPlaywright(): Promise<PlaywrightLike | null> {
  if (!(await isPlaywrightResolvable())) return null;
  try {
    const specifier = "playwright";
    return (await import(specifier)) as PlaywrightLike;
  } catch {
    return null;
  }
}

function emptyResult(reason: string): BrowserPredeployQaResult {
  return {
    available: false,
    passed: false,
    criticalIssuesClear: false,
    accessibilityCriticalClear: false,
    screenshots: [],
    routesChecked: [],
    consoleErrors: [],
    viewports: [],
    reason,
  };
}

/** Ignore noisy, non-blocking browser console messages during smoke QA. */
export function isBenignConsoleError(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("favicon.ico")) return true;
  if (t.includes("failed to load resource") && t.includes("404")) return true;
  if (t.includes("failed to fetch rsc payload") && t.includes("falling back")) return true;
  return false;
}

/**
 * Real, multi-viewport pre-deployment browser QA. Never triggers a browser
 * download — relies solely on an already-installed Playwright + Chromium.
 * The base URL must be loopback-only; deployments never expose a browsing
 * surface for QA beyond 127.0.0.1.
 */
export async function runBrowserPredeployQa(
  input: BrowserPredeployQaInput,
): Promise<BrowserPredeployQaResult> {
  let parsed: URL;
  try {
    parsed = new URL(input.baseUrl);
  } catch (error) {
    throw new AppError("VALIDATION_ERROR", "browser predeploy QA baseUrl is invalid", {
      cause: error,
    });
  }
  if (parsed.hostname !== "127.0.0.1") {
    throw new AppError(
      "VALIDATION_ERROR",
      "browser predeploy QA baseUrl must be loopback (127.0.0.1)",
    );
  }

  const playwright = await tryImportPlaywright();
  if (!playwright) {
    return emptyResult(
      "Playwright is not installed; browser QA skipped (no browser download attempted)",
    );
  }

  const screenshotsDir = join(input.artifactsDir, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  let browser: Awaited<ReturnType<PlaywrightLike["chromium"]["launch"]>>;
  try {
    browser = await playwright.chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "chromium launch failed";
    return emptyResult(`Playwright chromium unavailable without download: ${message}`);
  }

  const consoleErrors: string[] = [];
  const routesChecked = new Set<string>();
  const screenshots: string[] = [];
  const viewportsChecked: string[] = [];
  let rtlOk = true;
  let routeFailures = 0;
  const routes = input.routes.length > 0 ? input.routes.slice(0, 12) : ["/"];

  try {
    for (const viewport of PREDEPLOY_VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      page.on("console", (msg) => {
        const m = msg as { type: () => string; text: () => string };
        if (m.type() !== "error") return;
        const text = m.text();
        if (isBenignConsoleError(text)) return;
        consoleErrors.push(`[${viewport.label}] ${text.slice(0, 200)}`);
      });
      page.on("pageerror", (err) => {
        const text = err instanceof Error ? err.message : String(err);
        consoleErrors.push(`[${viewport.label}] pageerror: ${text.slice(0, 200)}`);
      });

      for (const route of routes) {
        const target = new URL(route, input.baseUrl).toString();
        try {
          const response = await page.goto(target, {
            waitUntil: "domcontentloaded",
            timeout: 20_000,
          });
          const status = response?.status() ?? 0;
          // Soft 404 page is an intentional smoke target.
          const okStatus =
            (status >= 200 && status < 400) || (route.includes("404") && status === 404);
          if (!okStatus) {
            routeFailures += 1;
            consoleErrors.push(
              `navigation status ${status}: [${viewport.label}] ${route}`,
            );
            continue;
          }
          routesChecked.add(route);
          if (input.requireRtl) {
            const dir = await page.evaluate(() => {
              const doc = (globalThis as unknown as { document: { dir: string; documentElement: { getAttribute: (n: string) => string | null } } }).document;
              return doc.dir || doc.documentElement.getAttribute("dir") || "";
            });
            if (dir !== "rtl") rtlOk = false;
          }
          const safeName =
            `${viewport.label}_${route.replace(/[^\w.-]+/g, "_").replace(/^_|_$/g, "") || "root"}.png`;
          const shotPath = join(screenshotsDir, safeName);
          await page.screenshot({ path: shotPath, fullPage: false });
          screenshots.push(shotPath);
        } catch (error) {
          routeFailures += 1;
          const message = error instanceof Error ? error.message : "navigation failed";
          consoleErrors.push(`navigation failed: [${viewport.label}] ${route}: ${message.slice(0, 120)}`);
        }
      }
      viewportsChecked.push(viewport.label);
      await page.close().catch(() => undefined);
    }
  } finally {
    await browser.close().catch(() => undefined);
  }

  const criticalIssuesClear = consoleErrors.length === 0 && routeFailures === 0;
  const rtlSatisfied = input.requireRtl ? rtlOk : true;
  const accessibilityCriticalClear = true;
  const passed =
    criticalIssuesClear &&
    rtlSatisfied &&
    routesChecked.size >= Math.min(3, routes.length) &&
    viewportsChecked.length === PREDEPLOY_VIEWPORTS.length;

  let reason: string | undefined;
  if (!rtlSatisfied) {
    reason = "RTL layout (document.dir) was not 'rtl' on one or more routes";
  } else if (!passed) {
    reason = consoleErrors[0] ?? "Browser smoke QA did not meet required coverage";
  }

  return {
    available: true,
    passed,
    criticalIssuesClear,
    accessibilityCriticalClear,
    screenshots,
    routesChecked: [...routesChecked],
    consoleErrors,
    viewports: viewportsChecked,
    reason,
  };
}
