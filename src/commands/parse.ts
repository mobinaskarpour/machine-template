import { AppError } from "../shared/errors.js";
import { assertSafePublicUrlSync } from "../security/safe-url.js";
import {
  OPS_ACTIVE_ACTIONS,
  OPS_DEFERRED_ACTIONS,
  type OpsAction,
} from "../operations/operations-types.js";

export type ParsedCommand =
  | { kind: "start" }
  | { kind: "help" }
  | { kind: "status"; target: string; targetType: "job" | "company" | "unknown" }
  | { kind: "demo"; companyName: string; websiteHint?: string }
  | { kind: "edit"; companyName: string; request: string }
  | { kind: "ops"; companyName: string; action: OpsAction; confirmToken?: string }
  | { kind: "unknown"; raw: string };

export type { OpsAction };
/** All recognized `/ops` action names (active + deferred); see operations-types.ts. */
export const OPS_ACTIONS = [...OPS_ACTIVE_ACTIONS, ...OPS_DEFERRED_ACTIONS] as const;

const JOB_ID_RE = /^job_[0-9a-f-]{36}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripCommand(text: string, command: string): string | null {
  const trimmed = text.trim();
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

function parseDemoRest(rest: string): { companyName: string; websiteHint?: string } {
  const normalized = normalizeWhitespace(rest);
  if (!normalized) {
    throw new AppError("VALIDATION_ERROR", "Usage: /demo <company-name>");
  }
  const pipeIdx = normalized.indexOf("|");
  if (pipeIdx < 0) {
    return { companyName: normalized };
  }
  if (pipeIdx === 0) {
    throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
  }
  const companyName = normalized.slice(0, pipeIdx).trim();
  const websiteRaw = normalized.slice(pipeIdx + 1).trim();
  if (!companyName) {
    throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
  }
  if (!websiteRaw) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Usage: /demo <company-name> | https://example.com",
    );
  }
  const validated = assertSafePublicUrlSync(websiteRaw);
  return { companyName, websiteHint: validated.href };
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
    const parsed = parseDemoRest(demoRest);
    return {
      kind: "demo",
      companyName: parsed.companyName,
      websiteHint: parsed.websiteHint,
    };
  }

  const editRest = stripCommand(raw, "edit");
  if (editRest !== null) {
    const { companyName, request } = splitCompanyRequest(editRest);
    return { kind: "edit", companyName, request };
  }

  const opsRest = stripCommand(raw, "ops");
  if (opsRest !== null) {
    const { companyName, request } = splitCompanyRequest(opsRest);
    const tokens = request.trim().split(/\s+/).filter(Boolean);
    const action = (tokens[0] ?? "").toLowerCase() as OpsAction;
    if (!OPS_ACTIONS.includes(action)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Unsupported ops action "${tokens[0] ?? ""}". Allowed: ${OPS_ACTIONS.join(", ")}`,
      );
    }
    let confirmToken: string | undefined;
    for (const token of tokens.slice(1)) {
      const match = /^confirm=(.+)$/i.exec(token);
      if (match?.[1]) confirmToken = match[1];
    }
    return { kind: "ops", companyName, action, ...(confirmToken ? { confirmToken } : {}) };
  }

  return { kind: "unknown", raw };
}
