import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const force = args.includes("--force");
  const auditOnly = args.includes("--audit-only");
  const maxIterArg = args.find((a) => a.startsWith("--max-iterations="));
  const maxIterations = maxIterArg
    ? Number(maxIterArg.slice("--max-iterations=".length))
    : undefined;
  const nameArgs = args.filter(
    (a) =>
      a !== "--force" &&
      a !== "--audit-only" &&
      !a.startsWith("--max-iterations="),
  );
  if (nameArgs.length < 1 || nameArgs[0]?.startsWith("-")) {
    console.error(
      'Usage: npm run quality -- "<company name>" [--force] [--audit-only] [--max-iterations=N]',
    );
    process.exit(2);
  }
  if (maxIterations !== undefined && (!Number.isFinite(maxIterations) || maxIterations < 1)) {
    console.error("--max-iterations must be a positive integer");
    process.exit(2);
  }

  const companyName = nameArgs[0]!;
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "quality-cli" });
  logger.info(publicConfigView(config), "quality.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.quality.iterateFromExisting(companyName, {
      force,
      auditOnly,
      maxIterations,
    });
    console.log(result.message);
    console.log(`jobId=${result.jobId}`);
    console.log(`slug=${result.companySlug}`);
    console.log(`qualityRunId=${result.qualityRunId}`);
    console.log(`generationId=${result.generationId}`);
    console.log(`acceptedGenerationId=${result.acceptedGenerationId ?? ""}`);
    console.log(`accepted=${result.accepted}`);
    console.log(`reused=${result.reused}`);
    console.log(`ok=${result.ok}`);
    console.log("deployed=false");
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const message = isAppError(error)
      ? `${error.code}: ${sanitizeErrorMessage(error.message)}`
      : sanitizeErrorMessage(
          error instanceof Error ? error.message : String(error),
        );
    console.error(message);
    process.exit(1);
  }
}

main();
