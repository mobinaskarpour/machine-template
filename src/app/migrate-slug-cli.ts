import { config as loadDotenv } from "dotenv";
import { loadConfig } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { suggestCanonicalSlug, createSlug } from "../registry/slug.js";

/**
 * Dry-run only slug migration reporter.
 * Never moves or renames workspaces. Safe to run anytime.
 *
 * Usage: npm run migrate:slug -- --dry-run "Company Name"
 */
async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  if (!args.includes("--dry-run")) {
    console.error("Refusing to run without --dry-run. This command never migrates automatically.");
    process.exit(2);
  }
  const name = args.filter((a) => a !== "--dry-run")[0];
  if (!name) {
    console.error('Usage: npm run migrate:slug -- --dry-run "Company Name"');
    process.exit(2);
  }

  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: "info", name: "migrate-slug" });
  const services = await createAppServices(config, logger);
  const company = await services.registry.findByName(name);
  const suggested = suggestCanonicalSlug(name);
  const created = createSlug(name);

  console.log("Slug migration dry-run (no changes applied)");
  console.log(`query=${name}`);
  console.log(`suggestedCanonicalSlug=${suggested}`);
  console.log(`createSlugResult=${created}`);
  if (!company) {
    console.log("existingCompany=none");
    process.exit(0);
  }
  console.log(`existingSlug=${company.slug}`);
  console.log(`displayName=${company.displayName}`);
  console.log(`aliases=${company.aliases.join(" | ")}`);
  console.log(`workspacePath=${company.workspacePath}`);
  console.log(
    company.slug === suggested
      ? "action=none (already matches suggestion)"
      : "action=manual-migration-required (not performed)",
  );
  console.log("Note: existing workspaces are never renamed automatically.");
}

main();
