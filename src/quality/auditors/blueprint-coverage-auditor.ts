import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore, readReleaseText } from "./auditor-fs.js";

type IdBucket = { expected: string[]; actual: string[]; priority?: Map<string, string> };

function idsOf(items: Array<{ id?: string }> | undefined): string[] {
  return (items ?? []).map((i) => i.id).filter((id): id is string => Boolean(id));
}

/**
 * Compare runtime ids vs blueprint expected; score = covered/expected.
 * Missing HIGH-priority items become CRITICAL/HIGH issues.
 */
export async function auditBlueprintCoverage(
  ctx: QualityAuditContext,
): Promise<AuditorResult> {
  const issues = [];
  let runtime = ctx.runtime;
  if (!runtime) {
    const raw = await readReleaseText(
      ctx.releaseAppDir,
      "src/data/blueprint-runtime.json",
    );
    if (raw) {
      try {
        runtime = JSON.parse(raw);
      } catch {
        runtime = null;
      }
    }
  }

  if (!runtime || !ctx.blueprint) {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "BLUEPRINT_COVERAGE",
      title: "Coverage audit missing runtime or blueprint",
      severity: "CRITICAL",
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "BLUEPRINT_COVERAGE",
        severity: "CRITICAL",
        title: "Coverage audit missing runtime or blueprint",
        description: "Cannot compute blueprint coverage without both artifacts",
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
      }),
    );
    return { auditorId: "blueprint-coverage", score: 0, issues };
  }

  const bp = ctx.blueprint;
  const priorityMap = (items: Array<{ id: string; priority?: string }>) => {
    const m = new Map<string, string>();
    for (const item of items) {
      if (item.priority) m.set(item.id, item.priority);
    }
    return m;
  };

  const buckets: Array<{ name: string; bucket: IdBucket }> = [
    {
      name: "dashboards",
      bucket: {
        expected: idsOf(bp.dashboards),
        actual: idsOf(runtime.dashboards),
        priority: priorityMap(bp.dashboards ?? []),
      },
    },
    {
      name: "modules",
      bucket: {
        expected: idsOf(bp.modules),
        actual: idsOf(runtime.modules),
        priority: priorityMap(bp.modules ?? []),
      },
    },
    {
      name: "workflows",
      bucket: {
        expected: idsOf(bp.workflows),
        actual: idsOf(runtime.workflows),
        priority: priorityMap(bp.workflows ?? []),
      },
    },
    {
      name: "agents",
      bucket: {
        expected: idsOf(bp.agents),
        actual: idsOf(runtime.agents),
        priority: priorityMap(bp.agents ?? []),
      },
    },
    {
      name: "entities",
      bucket: {
        expected: idsOf(bp.dataModel.entities),
        actual: idsOf(runtime.entities),
      },
    },
  ];

  let expectedTotal = 0;
  let coveredTotal = 0;

  for (const { name, bucket } of buckets) {
    const actualSet = new Set(bucket.actual);
    expectedTotal += bucket.expected.length;
    for (const id of bucket.expected) {
      if (actualSet.has(id)) {
        coveredTotal += 1;
        continue;
      }
      const priority = bucket.priority?.get(id)?.toUpperCase() ?? "MEDIUM";
      const severity =
        priority === "HIGH" ? ("CRITICAL" as const) : ("HIGH" as const);
      const { fingerprint, blocking } = classifyIssueFields({
        category: "BLUEPRINT_COVERAGE",
        title: `Missing ${name} coverage: ${id}`,
        severity,
        affectedFiles: [],
        affectedRoutes: [],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "BLUEPRINT_COVERAGE",
          severity,
          title: `Missing ${name} coverage: ${id}`,
          description: `Blueprint ${name} id "${id}" is missing from runtime (priority ${priority})`,
          evidence: [
            { type: "BLUEPRINT_REFERENCE", value: id, sanitized: true },
            { type: "METRIC", value: name, sanitized: true },
          ],
          blueprintReferences: [id],
          fingerprint,
          blocking,
          repairability: "AUTO_CODEX",
        }),
      );
    }
  }

  const score =
    expectedTotal === 0 ? 1 : clampScore(coveredTotal / expectedTotal);
  return { auditorId: "blueprint-coverage", score, issues };
}
