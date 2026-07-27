import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");
  const nameArgs = args.filter((a) => a !== "--dry-run");
  if (nameArgs.length < 1 || nameArgs[0]?.startsWith("-")) {
    console.error('Usage: npm run blueprint -- "<company name>" [--dry-run]');
    process.exit(2);
  }

  const companyName = nameArgs[0]!;
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "blueprint-cli" });
  logger.info(publicConfigView(config), "blueprint.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.blueprint.blueprintFromExisting(companyName, { dryRun });
    console.log(result.message);
    console.log(`jobId=${result.jobId}`);
    console.log(`slug=${result.companySlug}`);
    console.log(`readyForCodeGeneration=${result.blueprint.quality.readyForCodeGeneration}`);
    console.log(`ok=${result.ok}`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const message = isAppError(error)
      ? `${error.code}: ${sanitizeErrorMessage(error.message)}`
      : sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
    console.error(message);
    process.exit(1);
  }
}

main();
