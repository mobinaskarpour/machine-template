/**
 * validate-demo.ts — stub
 * Ensures demo.config.json paths exist and JSON schemas are coherent.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const demo = JSON.parse(readFileSync(resolve(root, "demo.config.json"), "utf8"));
const required = [
  demo.paths.company,
  demo.paths.theme,
  demo.paths.industry,
  demo.paths.ai,
  demo.paths.workflows,
  demo.paths.dashboards,
  demo.paths.navigation,
  demo.logo,
];

let ok = true;
for (const rel of required) {
  const path = resolve(root, rel);
  if (!existsSync(path)) {
    console.error("[validate-demo] missing:", rel);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log("[validate-demo] OK — core config paths present for", demo.companyName);
