import {
  isPlaywrightResolvable,
  runBrowserPredeployQa,
} from "../../deployment/browser-predeploy-qa.js";

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

export { isPlaywrightResolvable };

/**
 * Quality-phase browser QA. Delegates to the Phase 6 multi-viewport runner
 * (desktop/laptop/tablet/mobile) so a real, non-trivial check runs whenever
 * Playwright is resolvable — this never silently skips just because it can.
 * Never triggers a browser download.
 */
export async function runBrowserQa(input: BrowserQaInput): Promise<BrowserQaResult> {
  const result = await runBrowserPredeployQa({
    baseUrl: input.baseUrl,
    routes: input.routes,
    artifactsDir: input.artifactsDir,
  });
  return {
    available: result.available,
    reason: result.reason,
    screenshots: result.screenshots,
    routesChecked: result.routesChecked,
    consoleErrors: result.consoleErrors,
  };
}
