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
  const force = args.includes("--force");
  const nameArgs = args.filter((a) => a !== "--dry-run" && a !== "--force");
  if (nameArgs.length < 1 || nameArgs[0]?.startsWith("-")) {
    console.error('Usage: npm run generate -- "<company name>" [--force] [--dry-run]');
    process.exit(2);
  }

  const companyName = nameArgs[0]!;
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "generate-cli" });
  logger.info(publicConfigView(config), "generate.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.generation.generateFromExisting(companyName, {
      dryRun,
      force,
    });
    console.log(result.message);
    console.log(`jobId=${result.jobId}`);
    console.log(`slug=${result.companySlug}`);
    console.log(`generationId=${result.generationId}`);
    console.log(`reused=${result.reused}`);
    console.log(`ok=${result.ok}`);
    console.log("deployed=false");
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
