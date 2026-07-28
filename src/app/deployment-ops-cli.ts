import { config as loadDotenv } from "dotenv";
import { loadConfig, publicConfigView } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createAppServices } from "../app/create-app.js";
import { OPS_ACTIVE_ACTIONS, type OpsActiveAction } from "../operations/operations-types.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

/**
 * Generic CLI for every deployment operations action:
 * `node dist/app/deployment-ops-cli.js <action> "<company name>" [--yes]`
 *
 * `npm run deployment:<action> -- "<company name>" [--yes]` scripts wrap this
 * with the action pre-filled. `--yes` is the CLI equivalent of a Telegram
 * confirmation reply for mutating actions (restart, rollback, stop, start).
 */
async function main(): Promise<void> {
  loadDotenv();
  const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
  const yes = rawArgs.includes("--yes");
  const args = rawArgs.filter((a) => a !== "--yes");
  const [actionArg, ...nameArgs] = args;

  if (!actionArg || !(OPS_ACTIVE_ACTIONS as readonly string[]).includes(actionArg)) {
    console.error(
      `Usage: deployment-ops-cli <action> "<company name>" [--yes]\nActions: ${OPS_ACTIVE_ACTIONS.join(", ")}`,
    );
    process.exit(2);
  }
  if (nameArgs.length < 1) {
    console.error('Usage: deployment-ops-cli <action> "<company name>" [--yes]');
    process.exit(2);
  }

  const action = actionArg as OpsActiveAction;
  const companyName = nameArgs.join(" ");
  const config = loadConfig(process.env, { requireTelegramToken: false });
  const logger = createLogger({ level: config.logLevel, name: "deployment-ops-cli" });
  logger.info(publicConfigView(config), "deployment-ops.starting");

  const services = await createAppServices(config, logger);
  try {
    const result = await services.operations.requestAction({
      companyName,
      action,
      actor: { channel: "cli" },
      skipConfirmation: yes,
    });
    console.log(result.message);
    if (result.requiresConfirmation) {
      console.log("Re-run with --yes to confirm this action.");
    }
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
