/**
 * generate-demo.ts
 *
 * Future Codex/CLI entry: read demo.config.json and apply company/industry packs.
 * Architecture stub — implement when automating customer demo generation.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(
  readFileSync(resolve(root, "demo.config.json"), "utf8"),
);

console.log("[generate-demo] Stub — would generate demo from:", config.companyName);
console.log("[generate-demo] Industry pack:", config.industry);
console.log("[generate-demo] TODO: invoke replace-branding, generate-mock-data, validate-demo");
