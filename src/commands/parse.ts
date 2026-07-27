import { AppError } from "../shared/errors.js";

export type ParsedCommand =
  | { kind: "start" }
  | { kind: "help" }
  | { kind: "status"; target: string; targetType: "job" | "company" | "unknown" }
  | { kind: "demo"; companyName: string }
  | { kind: "edit"; companyName: string; request: string }
  | { kind: "ops"; companyName: string; action: OpsAction }
  | { kind: "unknown"; raw: string };

export const OPS_ACTIONS = ["status", "logs", "restart", "ssl"] as const;
export type OpsAction = (typeof OPS_ACTIONS)[number];

const JOB_ID_RE = /^job_[0-9a-f-]{36}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripCommand(text: string, command: string): string | null {
  const trimmed = text.trim();
  // Support /cmd@BotName
  const re = new RegExp(`^/${command}(?:@\\w+)?(?:\\s+|$)`, "i");
  if (!re.test(trimmed)) return null;
  return trimmed.replace(re, "").trim();
}

function splitCompanyRequest(rest: string): { companyName: string; request: string } {
  const normalized = normalizeWhitespace(rest);
  const idx = normalized.indexOf(":");
  if (idx <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Expected format: <company-name>: <request>",
    );
  }
  const companyName = normalized.slice(0, idx).trim();
  const request = normalized.slice(idx + 1).trim();
  if (!companyName) {
    throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
  }
  if (!request) {
    throw new AppError("VALIDATION_ERROR", "Request/action cannot be empty");
  }
  return { companyName, request };
}

export function detectStatusTargetType(
  target: string,
): "job" | "company" | "unknown" {
  if (JOB_ID_RE.test(target) || UUID_RE.test(target)) return "job";
  if (target.startsWith("job_")) return "job";
  return "company";
}

export function parseCommand(text: string): ParsedCommand {
  const raw = text.trim();
  if (!raw) {
    throw new AppError("VALIDATION_ERROR", "Empty command");
  }

  if (stripCommand(raw, "start") !== null && stripCommand(raw, "start") === "") {
    return { kind: "start" };
  }
  if (/^\/start(?:@\w+)?$/i.test(raw)) {
    return { kind: "start" };
  }
  if (/^\/help(?:@\w+)?$/i.test(raw)) {
    return { kind: "help" };
  }

  const statusRest = stripCommand(raw, "status");
  if (statusRest !== null) {
    if (!statusRest) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Usage: /status <job-id or company-name>",
      );
    }
    const target = normalizeWhitespace(statusRest);
    return {
      kind: "status",
      target,
      targetType: detectStatusTargetType(target),
    };
  }

  const demoRest = stripCommand(raw, "demo");
  if (demoRest !== null) {
    const companyName = normalizeWhitespace(demoRest);
    if (!companyName) {
      throw new AppError("VALIDATION_ERROR", "Usage: /demo <company-name>");
    }
    return { kind: "demo", companyName };
  }

  const editRest = stripCommand(raw, "edit");
  if (editRest !== null) {
    const { companyName, request } = splitCompanyRequest(editRest);
    return { kind: "edit", companyName, request };
  }

  const opsRest = stripCommand(raw, "ops");
  if (opsRest !== null) {
    const { companyName, request } = splitCompanyRequest(opsRest);
    const action = request.toLowerCase() as OpsAction;
    if (!OPS_ACTIONS.includes(action)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Unsupported ops action "${request}". Allowed: ${OPS_ACTIONS.join(", ")}`,
      );
    }
    return { kind: "ops", companyName, action };
  }

  return { kind: "unknown", raw };
}
