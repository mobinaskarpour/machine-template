import { Telegraf } from "telegraf";
import type { Logger } from "pino";
import { parseCommand } from "../commands/parse.js";
import {
  executeCommand,
  formatCommandError,
  type CommandContext,
} from "../commands/execute.js";
import { isAppError } from "../shared/errors.js";
import { sanitizeErrorMessage } from "../security/redact.js";

export function createTelegramBot(
  token: string,
  ctx: CommandContext,
  logger: Logger,
): Telegraf {
  // Never log the token
  const bot = new Telegraf(token);

  bot.start(async (telegramCtx) => {
    await dispatch(telegramCtx.message.text ?? "/start", telegramCtx, ctx, logger);
  });

  bot.help(async (telegramCtx) => {
    await dispatch("/help", telegramCtx, ctx, logger);
  });

  bot.on("text", async (telegramCtx) => {
    await dispatch(telegramCtx.message.text, telegramCtx, ctx, logger);
  });

  bot.catch((error: unknown) => {
    logger.error(
      { err: sanitizeErrorMessage(String(error)) },
      "telegram.unhandled",
    );
  });

  return bot;
}

async function dispatch(
  text: string,
  telegramCtx: { reply: (msg: string) => Promise<unknown> },
  ctx: CommandContext,
  logger: Logger,
): Promise<void> {
  try {
    const parsed = parseCommand(text);
    logger.info({ command: parsed.kind }, "telegram.command");
    const result = await executeCommand(parsed, ctx);
    await telegramCtx.reply(result.message);
  } catch (error) {
    const safe = formatCommandError(error);
    logger.error(
      {
        err: isAppError(error)
          ? { code: error.code, message: sanitizeErrorMessage(error.message) }
          : sanitizeErrorMessage(String(error)),
      },
      "telegram.command.failed",
    );
    await telegramCtx.reply(safe);
  }
}
