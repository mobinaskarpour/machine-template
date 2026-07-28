import { createQualityIssue } from "../quality-issue-schema.js";
import { classifyIssueFields } from "../issue-classifier.js";
import type { AuditorResult, QualityAuditContext } from "../auditor-types.js";
import { clampScore, readReleaseText } from "./auditor-fs.js";

function collectRoutes(runtime: any): Array<{ route: string; source: string }> {
  const out: Array<{ route: string; source: string }> = [];
  const nav = runtime?.navigation;
  if (nav) {
    for (const item of [...(nav.primary ?? []), ...(nav.utility ?? [])]) {
      if (item?.route) out.push({ route: String(item.route), source: `nav:${item.id ?? item.route}` });
    }
  }
  for (const d of runtime?.dashboards ?? []) {
    if (d?.route) out.push({ route: String(d.route), source: `dashboard:${d.id}` });
  }
  for (const m of runtime?.modules ?? []) {
    if (m?.routePrefix) {
      out.push({ route: String(m.routePrefix), source: `module:${m.id}` });
    }
    for (const p of m?.pages ?? []) {
      if (p?.route) out.push({ route: String(p.route), source: `module-page:${p.id}` });
    }
  }
  return out;
}

/**
 * Verify navigation, dashboard, and module routes start with /.
 */
export async function auditRoutes(
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

  if (!runtime) {
    const { fingerprint, blocking } = classifyIssueFields({
      category: "ROUTE",
      title: "Missing blueprint-runtime.json",
      severity: "CRITICAL",
      affectedFiles: ["src/data/blueprint-runtime.json"],
    });
    issues.push(
      createQualityIssue({
        qualityRunId: ctx.qualityRunId,
        category: "ROUTE",
        severity: "CRITICAL",
        title: "Missing blueprint-runtime.json",
        description: "Could not load blueprint-runtime.json from the release",
        evidence: [
          {
            type: "FILE",
            value: "src/data/blueprint-runtime.json",
            sanitized: true,
          },
        ],
        affectedFiles: ["src/data/blueprint-runtime.json"],
        fingerprint,
        blocking,
        repairability: "NOT_REPAIRABLE",
      }),
    );
    return { auditorId: "route", score: 0, issues };
  }

  const routes = collectRoutes(runtime);
  let bad = 0;
  for (const { route, source } of routes) {
    if (!route.startsWith("/")) {
      bad += 1;
      const { fingerprint, blocking } = classifyIssueFields({
        category: "ROUTE",
        title: "Route missing leading slash",
        severity: "HIGH",
        affectedRoutes: [route],
      });
      issues.push(
        createQualityIssue({
          qualityRunId: ctx.qualityRunId,
          category: "ROUTE",
          severity: "HIGH",
          title: "Route missing leading slash",
          description: `Route "${route}" from ${source} must start with /`,
          evidence: [
            { type: "ROUTE", value: route, sanitized: true },
            { type: "METRIC", value: source, sanitized: true },
          ],
          affectedRoutes: [route],
          fingerprint,
          blocking,
          repairability: "AUTO_DETERMINISTIC",
        }),
      );
    }
  }

  const total = Math.max(routes.length, 1);
  const score = clampScore(1 - bad / total);
  return { auditorId: "route", score, issues };
}
