import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { formatDeploymentMessage, formatPreDeploymentGateMessage } from "../deployment/deployment-summary.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");
  const publicExposure = args.includes("--public");
  const nameArgs = args.filter(
    (a) => a !== "--dry-run" && a !== "--public" && !a.startsWith("-"),
  );
  if (nameArgs.length < 1) {
    console.error('Usage: npm run deploy -- "<company name>" [--public] [--dry-run]');
    process.exit(2);
  }

  const companyName = nameArgs.join(" ");
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "deploy-cli" });
  logger.info(publicConfigView(config), "deploy.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.deployment.deploy(companyName, {
      public: publicExposure,
      dryRun,
    });
    console.log(
      formatPreDeploymentGateMessage({ companyDisplayName: companyName, gate: result.gate }),
    );
    console.log("");
    console.log(
      formatDeploymentMessage({ companyDisplayName: companyName, record: result.deployment.record }),
    );
    console.log(`deploymentId=${result.deployment.record.deploymentId}`);
    console.log(`status=${result.deployment.record.status}`);
    console.log(`port=${result.deployment.record.port}`);
    process.exit(result.deployment.record.status === "HEALTHY" || dryRun ? 0 : 1);
  } catch (error) {
    const message = isAppError(error)
      ? `${error.code}: ${sanitizeErrorMessage(error.message)}`
      : sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
    console.error(message);
    process.exit(1);
  }
}

main();
