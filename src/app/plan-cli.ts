import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2);
  if (args.length < 1 || args[0]?.startsWith("-")) {
    console.error('Usage: npm run plan -- "<company name>"');
    process.exit(2);
  }

  const companyName = args[0]!;
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "plan-cli" });
  logger.info(publicConfigView(config), "plan.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.planning.planFromExistingKnowledge(companyName);
    console.log(result.message);
    console.log(`jobId=${result.jobId}`);
    console.log(`pack=${result.resolution.selectedPackId}`);
    console.log(`specHash=${result.specification.contentHash ?? ""}`);
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
