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
  | "CODEX_EXECUTION_FAILED"
  | "BLUEPRINT_SOURCE_MISMATCH"
  | "BLUEPRINT_INVALID_REFERENCE"
  | "BLUEPRINT_DUPLICATE_ID"
  | "BLUEPRINT_DUPLICATE_ROUTE"
  | "BLUEPRINT_UNSAFE_ROUTE"
  | "BLUEPRINT_INVALID_WORKFLOW"
  | "BLUEPRINT_INVALID_PERMISSION"
  | "BLUEPRINT_INVALID_AGENT_MODE"
  | "BLUEPRINT_VALIDATION_FAILED"
  | "BLUEPRINT_PERSISTENCE_FAILED"
  | "BLUEPRINT_MIRROR_MISMATCH"
  | "BLUEPRINT_NOT_READY"
  | "GENERATION_SOURCE_MISMATCH"
  | "GENERATION_PLAN_INVALID"
  | "GENERATION_POLICY_VIOLATION"
  | "GENERATION_VALIDATION_FAILED"
  | "GENERATION_INSTALL_FAILED"
  | "GENERATION_TYPECHECK_FAILED"
  | "GENERATION_TEST_FAILED"
  | "GENERATION_BUILD_FAILED"
  | "GENERATION_SECURITY_FAILED"
  | "GENERATION_PROMOTION_FAILED"
  | "GENERATION_NOT_READY"
  | "GENERATION_COVERAGE_FAILED"
  | "QUALITY_NOT_READY"
  | "QUALITY_AUDIT_FAILED"
  | "QUALITY_REPAIR_FAILED"
  | "QUALITY_ACCEPTANCE_FAILED"
  | "QUALITY_RUNTIME_FAILED"
  | "PREDEPLOY_GENERATION_NOT_ACCEPTED"
  | "PREDEPLOY_QUALITY_NOT_ACCEPTED"
  | "PREDEPLOY_SOURCE_MISMATCH"
  | "PREDEPLOY_DEPENDENCY_BLOCKER"
  | "PREDEPLOY_BROWSER_QA_REQUIRED"
  | "PREDEPLOY_BUILD_FAILED"
  | "PREDEPLOY_SECURITY_FAILED"
  | "PREDEPLOY_RELEASE_NOT_IMMUTABLE"
  | "PREDEPLOY_GATE_FAILED"
  | "DEPLOYMENT_FAILED"
  | "DEPLOYMENT_NOT_FOUND"
  | "DEPLOYMENT_LOCK_HELD"
  | "DEPLOYMENT_PORT_EXHAUSTED"
  | "DEPLOYMENT_HEALTH_FAILED"
  | "DEPLOYMENT_PLAN_INVALID"
  | "DEPLOYMENT_PUBLIC_NOT_CONFIGURED"
  | "PM2_NOT_AVAILABLE"
  | "PM2_PROCESS_FAILED"
  | "OPS_UNAUTHORIZED"
  | "OPS_CONFIRMATION_REQUIRED"
  | "OPS_CONFIRMATION_INVALID"
  | "OPS_ACTION_NOT_ALLOWED";

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
  BLUEPRINT_SOURCE_MISMATCH: "Planning artifacts are out of sync. Re-run plan, then blueprint.",
  BLUEPRINT_VALIDATION_FAILED: "Company OS blueprint failed validation.",
  BLUEPRINT_NOT_READY: "Blueprint is not ready for code generation.",
  BLUEPRINT_MIRROR_MISMATCH: "Blueprint mirror copies did not match after save.",
  BLUEPRINT_PERSISTENCE_FAILED: "Failed to save company OS blueprint.",
  GENERATION_SOURCE_MISMATCH:
    "Planning artifacts are out of sync. Re-run blueprint planning before generation.",
  GENERATION_PLAN_INVALID: "Generation plan is invalid.",
  GENERATION_POLICY_VIOLATION: "Generated application violated source or dependency policy.",
  GENERATION_VALIDATION_FAILED: "Generated application failed validation.",
  GENERATION_INSTALL_FAILED: "Installing generated app dependencies failed.",
  GENERATION_TYPECHECK_FAILED: "Generated application typecheck failed.",
  GENERATION_TEST_FAILED: "Generated application tests failed.",
  GENERATION_BUILD_FAILED: "Generated application production build failed.",
  GENERATION_SECURITY_FAILED: "Generated application failed the security scan.",
  GENERATION_PROMOTION_FAILED: "Promoting the generated release failed.",
  GENERATION_NOT_READY: "Company artifacts are not ready for code generation.",
  GENERATION_COVERAGE_FAILED: "Generated application is missing required Blueprint coverage.",
  QUALITY_NOT_READY: "Generated release is not ready for quality iteration.",
  QUALITY_AUDIT_FAILED: "Quality audit failed.",
  QUALITY_REPAIR_FAILED: "Quality repair failed.",
  QUALITY_ACCEPTANCE_FAILED: "Quality acceptance gate rejected the release.",
  QUALITY_RUNTIME_FAILED: "Local quality runtime failed.",
  PREDEPLOY_GENERATION_NOT_ACCEPTED: "No accepted generation is available to deploy.",
  PREDEPLOY_QUALITY_NOT_ACCEPTED: "Quality gate has not accepted this release yet.",
  PREDEPLOY_SOURCE_MISMATCH: "Source hashes do not match; regenerate before deploying.",
  PREDEPLOY_DEPENDENCY_BLOCKER: "Dependency audit found blocking advisories.",
  PREDEPLOY_BROWSER_QA_REQUIRED: "Browser QA is required for public deployment and did not pass.",
  PREDEPLOY_BUILD_FAILED: "Release build verification failed.",
  PREDEPLOY_SECURITY_FAILED: "Release failed the security scan.",
  PREDEPLOY_RELEASE_NOT_IMMUTABLE: "Release artifact is not immutable or is missing.",
  PREDEPLOY_GATE_FAILED: "Pre-deployment gate did not pass.",
  DEPLOYMENT_FAILED: "Deployment failed.",
  DEPLOYMENT_NOT_FOUND: "No deployment was found for this company.",
  DEPLOYMENT_LOCK_HELD: "A deployment is already in progress for this company.",
  DEPLOYMENT_PORT_EXHAUSTED: "No free deployment port is available.",
  DEPLOYMENT_HEALTH_FAILED: "The deployed application did not pass health checks.",
  DEPLOYMENT_PLAN_INVALID: "Deployment plan is invalid.",
  DEPLOYMENT_PUBLIC_NOT_CONFIGURED: "Public exposure is not configured on this server.",
  PM2_NOT_AVAILABLE: "Process supervisor (pm2) is not available.",
  PM2_PROCESS_FAILED: "Process supervisor command failed.",
  OPS_UNAUTHORIZED: "You are not authorized to run operations commands.",
  OPS_CONFIRMATION_REQUIRED: "This action requires confirmation before it will run.",
  OPS_CONFIRMATION_INVALID: "Confirmation token is invalid, expired, or already used.",
  OPS_ACTION_NOT_ALLOWED: "That operations action is not available from this channel.",
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
