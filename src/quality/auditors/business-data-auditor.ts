import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore, readReleaseText } from "./auditor-fs.js";
import {
  validateInternalReferences,
  type MockDataBundle,
} from "../../generation/renderers/mock-data-renderer.js";
import { AppError } from "../../shared/errors.js";

/**
 * Reconcile mock-data.json totals vs record counts; detect orphan id refs.
 */
export async function auditBusinessData(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let mockData = ctx.mockData;
  if (!mockData) {
    const raw = await readReleaseText(
      ctx.releaseAppDir,
      "src/data/mock-data.json",
    );
    if (raw) {
      try {
        mockData = JSON.parse(raw);
      } catch {
        mockData = null;
      }
    }
  }

  if (!mockData || typeof mockData !== "object") {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "DATA_INTEGRITY",
      title: "Missing mock-data.json",
      severity: "CRITICAL",
      affectedFiles: ["src/data/mock-data.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "DATA_INTEGRITY",
        severity: "CRITICAL",
        title: "Missing mock-data.json",
        description: "Release is missing src/data/mock-data.json",
        evidence: [
          { type: "FILE", value: "src/data/mock-data.json", sanitized: true },
        ],
        affectedFiles: ["src/data/mock-data.json"],
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
      }),
    );
    return { auditorId: "business-data", score: 0, issues };
  }

  const records = (mockData.records ?? {}) as Record<string, unknown[]>;
  const totals = (mockData.totals ?? {}) as Record<string, number>;
  let checks = 0;
  let passed = 0;

  // totals are typically KPI aggregates — verify each entity record list is an array
  // and that declared meta totals (if keyed by entity) match lengths when numeric.
  for (const [entityId, rows] of Object.entries(records)) {
    checks += 1;
    if (!Array.isArray(rows)) {
      const { fingerprint, blocking } = classifyIssueFields({
        category: "DATA_INTEGRITY",
        title: `Invalid records for ${entityId}`,
        severity: "HIGH",
        affectedFiles: ["src/data/mock-data.json"],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "DATA_INTEGRITY",
          severity: "HIGH",
          title: `Invalid records for ${entityId}`,
          description: `records.${entityId} must be an array`,
          evidence: [
            { type: "METRIC", value: entityId, sanitized: true },
          ],
          affectedFiles: ["src/data/mock-data.json"],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
      continue;
    }
    passed += 1;
    const declared = totals[entityId];
    if (typeof declared === "number") {
      checks += 1;
      if (declared === rows.length) {
        passed += 1;
      } else {
        const { fingerprint, blocking } = classifyIssueFields({
          category: "DATA_INTEGRITY",
          title: `Record count mismatch for ${entityId}`,
          severity: "MEDIUM",
          affectedFiles: ["src/data/mock-data.json"],
        });
        issues.push(
          createQualityIssue({
            qualityRunId: ctx.qualityRunId,
            category: "DATA_INTEGRITY",
            severity: "MEDIUM",
            title: `Record count mismatch for ${entityId}`,
            description: `totals.${entityId}=${declared} but records length is ${rows.length}`,
            evidence: [
              {
                type: "METRIC",
                value: `${entityId}:${declared}!=${rows.length}`,
                sanitized: true,
              },
            ],
            affectedFiles: ["src/data/mock-data.json"],
            fingerprint,
            blocking,
            repairability: "AUTO_DETERMINISTIC",
          }),
        );
      }
    }
  }

  // Soft orphan reference check
  try {
    validateInternalReferences(mockData as MockDataBundle);
    checks += 1;
    passed += 1;
  } catch (error) {
    checks += 1;
    const msg =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
    const { fingerprint, blocking } = classifyIssueFields({
      category: "DATA_INTEGRITY",
      title: "Orphan mock data references",
      severity: "HIGH",
      affectedFiles: ["src/data/mock-data.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "DATA_INTEGRITY",
        severity: "HIGH",
        title: "Orphan mock data references",
        description: msg.slice(0, 240),
        evidence: [
          { type: "FILE", value: "src/data/mock-data.json", sanitized: true },
        ],
        affectedFiles: ["src/data/mock-data.json"],
        fingerprint,
        blocking,
        repairability: "AUTO_CODEX",
      }),
    );
  }

  // KPI totals should be finite numbers
  for (const [kpiId, value] of Object.entries(totals)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      checks += 1;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "DATA_INTEGRITY",
        title: `Invalid KPI total ${kpiId}`,
        severity: "MEDIUM",
        affectedFiles: ["src/data/mock-data.json"],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "DATA_INTEGRITY",
          severity: "MEDIUM",
          title: `Invalid KPI total ${kpiId}`,
          description: `totals.${kpiId} must be a finite number`,
          evidence: [{ type: "METRIC", value: kpiId, sanitized: true }],
          affectedFiles: ["src/data/mock-data.json"],
          fingerprint,
          blocking,
          repairability: "AUTO_DETERMINISTIC",
        }),
      );
    } else {
      checks += 1;
      passed += 1;
    }
  }

  const score = checks === 0 ? 0.5 : clampScore(passed / checks);
  return { auditorId: "business-data", score, issues };
}
