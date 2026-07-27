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
  | "UNAUTHORIZED";

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

export function toUserMessage(error: unknown): string {
  if (isAppError(error)) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return `Invalid input: ${error.message}`;
      case "NOT_FOUND":
        return `Not found: ${error.message}`;
      case "ALREADY_EXISTS":
        return `Already exists: ${error.message}`;
      case "NOT_IMPLEMENTED":
        return `Not implemented in Phase 0: ${error.message}`;
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
