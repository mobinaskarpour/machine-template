import { stat } from "node:fs/promises";
import { join } from "node:path";
import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore } from "./auditor-fs.js";

const TWO_MB = 2 * 1024 * 1024;

/**
 * Performance: score based on mock-data.json size; >2MB is a medium issue.
 */
export async function auditPerformance(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  const mockPath = join(ctx.releaseAppDir, "src/data/mock-data.json");
  let size = 0;
  try {
    const s = await stat(mockPath);
    size = s.size;
  } catch {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "PERFORMANCE",
      title: "mock-data.json missing for performance check",
      severity: "MEDIUM",
      affectedFiles: ["src/data/mock-data.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "PERFORMANCE",
        severity: "MEDIUM",
        title: "mock-data.json missing for performance check",
        description: "Could not stat src/data/mock-data.json",
        evidence: [
          { type: "FILE", value: "src/data/mock-data.json", sanitized: true },
        ],
        affectedFiles: ["src/data/mock-data.json"],
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
      }),
    );
    return { auditorId: "performance", score: 0.5, issues };
  }

  if (size > TWO_MB) {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "PERFORMANCE",
      title: "mock-data.json exceeds 2MB",
      severity: "MEDIUM",
      affectedFiles: ["src/data/mock-data.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "PERFORMANCE",
        severity: "MEDIUM",
        title: "mock-data.json exceeds 2MB",
        description: `mock-data.json is ${size} bytes (limit 2097152)`,
        evidence: [
          {
            type: "METRIC",
            value: `sizeBytes=${size}`,
            sanitized: true,
          },
        ],
        affectedFiles: ["src/data/mock-data.json"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
  }

  // Score: 1.0 at <=512KB, linearly down to 0.4 at 2MB, then lower
  let score: number;
  if (size <= 512 * 1024) {
    score = 1;
  } else if (size <= TWO_MB) {
    const t = (size - 512 * 1024) / (TWO_MB - 512 * 1024);
    score = 1 - t * 0.6;
  } else {
    const over = Math.min(1, (size - TWO_MB) / TWO_MB);
    score = 0.4 - over * 0.3;
  }

  return {
    auditorId: "performance",
    score: clampScore(score),
    issues,
  };
}
