import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "./create-app.js";
import { createTelegramBot } from "../telegram/bot.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

async function main(): Promise<void> {
  loadDotenv();

  const config = loadConfig(process.env, { requireTelegramToken: true });
  const logger = createLogger({ level: config.logLevel, name: "the-machine" });

  logger.info(publicConfigView(config), "app.starting");

  const services = await createAppServices(config, logger);
  const bot = createTelegramBot(
    config.telegramBotToken,
    services.commandContext,
    logger,
  );

  const stop = async (signal: string) => {
    logger.info({ signal }, "app.stopping");
    bot.stop(signal);
    process.exit(0);
  };

  process.once("SIGINT", () => void stop("SIGINT"));
  process.once("SIGTERM", () => void stop("SIGTERM"));

  logger.info("telegram.launching");
  await bot.launch();
  logger.info("telegram.launched");
}

main().catch((error: unknown) => {
  const message = isAppError(error)
    ? `${error.code}: ${sanitizeErrorMessage(error.message)}`
    : sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
  console.error(`Fatal: ${message}`);
  process.exit(1);
});
