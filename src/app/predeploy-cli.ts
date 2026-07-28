import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { formatPreDeploymentGateMessage } from "../deployment/deployment-summary.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const publicExposure = args.includes("--public");
  const nameArgs = args.filter((a) => a !== "--public" && !a.startsWith("-"));
  if (nameArgs.length < 1) {
    console.error('Usage: npm run deployment:gate -- "<company name>" [--public]');
    process.exit(2);
  }

  const companyName = nameArgs.join(" ");
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "predeploy-cli" });
  logger.info(publicConfigView(config), "predeploy.starting");

  const services = await createAppServices(config, logger);
  try {
    const gate = await services.deployment.predeploy(companyName, {
      publicExposureRequested: publicExposure,
    });
    console.log(
      formatPreDeploymentGateMessage({ companyDisplayName: companyName, gate }),
    );
    console.log(`gateId=${gate.gateId}`);
    console.log(`generationId=${gate.generationId}`);
    console.log(`passed=${gate.passed}`);
    process.exit(gate.passed ? 0 : 1);
  } catch (error) {
    const message = isAppError(error)
      ? `${error.code}: ${sanitizeErrorMessage(error.message)}`
      : sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
    console.error(message);
    process.exit(1);
  }
}

main();
