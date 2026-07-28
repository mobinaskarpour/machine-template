import type { AppConfig } from "../config/env.js";
import { AppError } from "../shared/errors.js";
import type { OpsAction, OpsActor } from "./operations-types.js";
import { isDeferredOpsAction } from "./operations-types.js";

export function isAdminTelegramUser(telegramUserId: number | undefined, config: AppConfig): boolean {
  if (telegramUserId === undefined) return false;
  return config.telegramAdminIds.includes(telegramUserId);
}

/**
 * Authorization gate for `/ops` actions.
 *
 * - CLI operators are already trusted (local shell access implies operator
 *   trust) and are never gated here.
 * - Telegram operators must be present in TELEGRAM_ADMIN_IDS. An empty
 *   allowlist denies every telegram ops action (safe default).
 * - Deferred actions (ssl, domain, deploy) are never allowed from chat.
 */
export function assertOpsAuthorized(action: OpsAction, actor: OpsActor, config: AppConfig): void {
  if (isDeferredOpsAction(action)) {
    throw new AppError(
      "OPS_ACTION_NOT_ALLOWED",
      `Ops action "${action}" is not available from chat. Use the CLI: npm run deployment:${action} -- "<company>"`,
    );
  }
  if (actor.channel === "cli") return;
  if (!isAdminTelegramUser(actor.telegramUserId, config)) {
    throw new AppError(
      "OPS_UNAUTHORIZED",
      "You are not authorized to run operations commands for THE MACHINE.",
    );
  }
}
