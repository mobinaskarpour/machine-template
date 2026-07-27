export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "PATH_OUTSIDE_ROOT"
  | "INVALID_STATE_TRANSITION"
  | "NOT_IMPLEMENTED"
  | "COMMAND_TIMEOUT"
  | "COMMAND_SPAWN_FAILED"
  | "COMMAND_EXIT_NON_ZERO"
  | "COMMAND_SIGNAL"
  | "PERSISTENCE_ERROR"
  | "CONFIGURATION_ERROR"
  | "UNAUTHORIZED"
  | "DISCOVERY_PROVIDER_NOT_CONFIGURED"
  | "DISCOVERY_SEARCH_FAILED"
  | "DISCOVERY_WEBSITE_AMBIGUOUS"
  | "DISCOVERY_WEBSITE_NOT_FOUND"
  | "DISCOVERY_NEEDS_INPUT"
  | "DISCOVERY_FETCH_FAILED"
  | "DISCOVERY_UNSAFE_URL"
  | "DISCOVERY_CONTENT_TOO_LARGE"
  | "DISCOVERY_SYNTHESIS_FAILED"
  | "DISCOVERY_INVALID_MODEL_OUTPUT"
  | "DISCOVERY_VALIDATION_FAILED"
  | "KNOWLEDGE_NOT_FOUND"
  | "KNOWLEDGE_INVALID"
  | "KNOWLEDGE_PERSISTENCE_FAILED"
  | "KNOWLEDGE_MIRROR_MISMATCH"
  | "CODEX_NOT_AVAILABLE"
  | "CODEX_EXECUTION_FAILED";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly causeError?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = options?.details;
    this.causeError = options?.cause;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

const DISCOVERY_USER_MESSAGES: Partial<Record<ErrorCode, string>> = {
  DISCOVERY_PROVIDER_NOT_CONFIGURED:
    "No search provider is configured. Provide an official website with: /demo Company Name | https://example.com",
  DISCOVERY_NEEDS_INPUT:
    "I need more information to continue discovery. Provide the official website with: /demo Company Name | https://example.com",
  DISCOVERY_WEBSITE_AMBIGUOUS:
    "I could not identify the official website with enough confidence. Retry with: /demo Company Name | https://official-site.com",
  DISCOVERY_WEBSITE_NOT_FOUND:
    "No official website was found. Retry with: /demo Company Name | https://official-site.com",
  DISCOVERY_UNSAFE_URL: "That URL was rejected for safety reasons.",
  DISCOVERY_FETCH_FAILED: "Failed to fetch the company website. Try again later or provide another URL.",
  DISCOVERY_CONTENT_TOO_LARGE: "Website content exceeded safe size limits.",
  DISCOVERY_SEARCH_FAILED: "Company search failed. Try again or provide the official website.",
  DISCOVERY_SYNTHESIS_FAILED: "Failed to synthesize company knowledge from sources.",
  DISCOVERY_INVALID_MODEL_OUTPUT: "Knowledge synthesis returned invalid output.",
  DISCOVERY_VALIDATION_FAILED: "Discovered knowledge failed validation.",
  KNOWLEDGE_NOT_FOUND: "Company knowledge was not found.",
  KNOWLEDGE_INVALID: "Stored company knowledge is invalid.",
  KNOWLEDGE_PERSISTENCE_FAILED: "Failed to save company knowledge.",
  KNOWLEDGE_MIRROR_MISMATCH: "Knowledge mirror copies did not match after save.",
  CODEX_NOT_AVAILABLE: "Codex CLI is not available for synthesis.",
  CODEX_EXECUTION_FAILED: "Codex synthesis failed.",
};

export function toUserMessage(error: unknown): string {
  if (isAppError(error)) {
    if (DISCOVERY_USER_MESSAGES[error.code]) {
      return `${DISCOVERY_USER_MESSAGES[error.code]}${error.message && error.code === "DISCOVERY_NEEDS_INPUT" ? `\n\n${error.message}` : error.code === "DISCOVERY_WEBSITE_AMBIGUOUS" && error.message ? `\n\n${error.message}` : ""}`;
    }
    switch (error.code) {
      case "VALIDATION_ERROR":
        return `Invalid input: ${error.message}`;
      case "NOT_FOUND":
        return `Not found: ${error.message}`;
      case "ALREADY_EXISTS":
        return `Already exists: ${error.message}`;
      case "NOT_IMPLEMENTED":
        return `Not implemented: ${error.message}`;
      case "INVALID_STATE_TRANSITION":
        return `Invalid job state: ${error.message}`;
      case "CONFIGURATION_ERROR":
        return "Configuration error. Check server logs.";
      case "PATH_OUTSIDE_ROOT":
        return "Path rejected for safety.";
      case "COMMAND_TIMEOUT":
        return "A timed operation exceeded its limit.";
      case "COMMAND_SPAWN_FAILED":
      case "COMMAND_EXIT_NON_ZERO":
      case "COMMAND_SIGNAL":
        return "A system command failed. Details are in server logs.";
      case "PERSISTENCE_ERROR":
        return "Failed to save or load data.";
      case "UNAUTHORIZED":
        return "Unauthorized.";
      default:
        return "Something went wrong.";
    }
  }
  return "Unexpected error. Details are in server logs.";
}

export function toErrorRecord(error: unknown): {
  code: string;
  message: string;
  stack?: string;
} {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    code: "UNEXPECTED_ERROR",
    message: String(error),
  };
}
