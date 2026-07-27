import { listFilesRecursive } from "../generation-types.js";
import type { GenerationPlan } from "../generation-plan-schema.js";
import {
  FORBIDDEN_GENERATED_BASENAMES,
  isAllowedGeneratedPath,
} from "../source-file-policy.js";
import { AppError } from "../../shared/errors.js";

export type GeneratedSourceValidationResult = {
  ok: true;
  fileCount: number;
  totalBytes: number;
};

/**
 * Validate staging app source against path policy and GenerationPlan size limits.
 */
export async function validateGeneratedSource(input: {
  stagingAppDir: string;
  plan: GenerationPlan;
}): Promise<GeneratedSourceValidationResult> {
  const files = await listFilesRecursive(input.stagingAppDir);
  const issues: string[] = [];
  let totalBytes = 0;

  for (const file of files) {
    totalBytes += file.size;
    const base = file.path.split("/").pop() ?? file.path;
    if (FORBIDDEN_GENERATED_BASENAMES.includes(base)) {
      issues.push(`Forbidden basename: ${file.path}`);
      continue;
    }
    if (!isAllowedGeneratedPath(file.path)) {
      issues.push(`Path not allowed: ${file.path}`);
    }
  }

  if (files.length > input.plan.policies.maximumGeneratedFiles) {
    issues.push(
      `File count ${files.length} exceeds maximum ${input.plan.policies.maximumGeneratedFiles}`,
    );
  }
  if (totalBytes > input.plan.policies.maximumTotalBytes) {
    issues.push(
      `Total bytes ${totalBytes} exceeds maximum ${input.plan.policies.maximumTotalBytes}`,
    );
  }

  if (issues.length > 0) {
    throw new AppError(
      "GENERATION_POLICY_VIOLATION",
      "Generated source failed policy validation",
      { details: { issues: issues.slice(0, 40), fileCount: files.length, totalBytes } },
    );
  }

  return { ok: true, fileCount: files.length, totalBytes };
}
