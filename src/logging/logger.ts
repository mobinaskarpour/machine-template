import pino, { type Logger } from "pino";
import { redactSecrets, redactValue } from "../security/redact.js";

export type LogContext = {
  jobId?: string;
  companyId?: string;
  projectId?: string;
  command?: string;
  stage?: string;
};

function redactLogObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactLogObject(value as Record<string, unknown>);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

export function createLogger(options?: {
  level?: string;
  name?: string;
}): Logger {
  return pino({
    name: options?.name ?? "the-machine",
    level: options?.level ?? "info",
    hooks: {
      logMethod(inputArgs, method) {
        const args = [...inputArgs] as unknown[];
        if (typeof args[0] === "string") {
          args[0] = redactSecrets(args[0]);
        } else if (args[0] && typeof args[0] === "object") {
          args[0] = redactLogObject(args[0] as Record<string, unknown>);
          if (typeof args[1] === "string") {
            args[1] = redactSecrets(args[1]);
          }
        }
        return method.apply(this, args as Parameters<typeof method>);
      },
    },
  });
}

export function withJobContext(
  logger: Logger,
  context: LogContext,
): Logger {
  return logger.child(redactLogObject(context));
}
