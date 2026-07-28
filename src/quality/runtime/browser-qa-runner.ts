import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export type BrowserQaResult = {
  available: boolean;
  reason?: string;
  screenshots: string[];
  routesChecked: string[];
  consoleErrors: string[];
};

export type BrowserQaInput = {
  baseUrl: string;
  routes: string[];
  artifactsDir: string;
};

type PlaywrightLike = {
  chromium: {
    launch: (opts: { headless: boolean }) => Promise<{
      newPage: () => Promise<{
        on: (event: string, handler: (msg: { type: () => string; text: () => string }) => void) => void;
        goto: (url: string, opts: { waitUntil: string; timeout: number }) => Promise<unknown>;
        screenshot: (opts: { path: string; fullPage: boolean }) => Promise<unknown>;
      }>;
      close: () => Promise<void>;
    }>;
  };
};

/**
 * Detect whether `playwright` is already resolvable without triggering a browser download.
 * Prefer unavailable — we never call playwright's install/download APIs.
 */
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
    // Variable specifier avoids a hard compile-time dependency on playwright types.
    const specifier = "playwright";
    const mod = (await import(specifier)) as PlaywrightLike;
    return mod;
  } catch {
    return null;
  }
}

/**
 * Optional browser QA. Does not download browsers.
 * Returns unavailable unless playwright is already resolvable; even then,
 * launch failures (missing browser binaries) yield unavailable without download.
 */
export async function runBrowserQa(
  input: BrowserQaInput,
): Promise<BrowserQaResult> {
  const empty = {
    screenshots: [] as string[],
    routesChecked: [] as string[],
    consoleErrors: [] as string[],
  };

  const playwright = await tryImportPlaywright();
  if (!playwright) {
    return {
      available: false,
      reason:
        "Playwright is not installed; browser QA skipped (no browser download attempted)",
      ...empty,
    };
  }

  const screenshotsDir = join(input.artifactsDir, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  let browser: Awaited<ReturnType<PlaywrightLike["chromium"]["launch"]>>;
  try {
    // Never pass download options — rely only on already-installed browsers.
    browser = await playwright.chromium.launch({ headless: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "chromium launch failed";
    return {
      available: false,
      reason: `Playwright chromium unavailable without download: ${message}`,
      ...empty,
    };
  }

  const screenshots: string[] = [];
  const routesChecked: string[] = [];
  const consoleErrors: string[] = [];

  try {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text().slice(0, 200));
      }
    });

    const routes = input.routes.length > 0 ? input.routes.slice(0, 8) : ["/"];
    for (const route of routes) {
      const url = new URL(route, input.baseUrl).toString();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
        routesChecked.push(route);
        const safeName =
          route.replace(/[^\w.-]+/g, "_").replace(/^_|_$/g, "") || "root";
        const shotPath = join(screenshotsDir, `${safeName}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        screenshots.push(shotPath);
      } catch {
        consoleErrors.push(`navigation failed: ${route}`);
      }
    }

    return {
      available: true,
      screenshots,
      routesChecked,
      consoleErrors,
    };
  } finally {
    await browser.close().catch(() => undefined);
  }
}
