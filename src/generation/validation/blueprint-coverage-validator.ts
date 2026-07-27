import { AppError } from "../../shared/errors.js";
import type { GenerationPlan } from "../generation-plan-schema.js";
import type { BlueprintRuntimeDocument } from "../renderers/runtime-renderer.js";

export type CoverageValidationResult = {
  ok: true;
  missing: {
    dashboards: string[];
    modules: string[];
    workflows: string[];
    agents: string[];
    entities: string[];
    roles: string[];
  };
};

function missingIds(expected: string[], actual: string[]): string[] {
  const set = new Set(actual);
  return expected.filter((id) => !set.has(id));
}

/**
 * Compare runtime JSON ids against plan.expectedCoverage.
 */
export function validateBlueprintCoverage(input: {
  runtime: BlueprintRuntimeDocument;
  plan: GenerationPlan;
}): CoverageValidationResult {
  const { runtime, plan } = input;
  const missing = {
    dashboards: missingIds(
      plan.expectedCoverage.dashboardIds,
      runtime.dashboards.map((d) => d.id),
    ),
    modules: missingIds(
      plan.expectedCoverage.moduleIds,
      runtime.modules.map((m) => m.id),
    ),
    workflows: missingIds(
      plan.expectedCoverage.workflowIds,
      runtime.workflows.map((w) => w.id),
    ),
    agents: missingIds(
      plan.expectedCoverage.agentIds,
      runtime.agents.map((a) => a.id),
    ),
    entities: missingIds(
      plan.expectedCoverage.entityIds,
      runtime.entities.map((e) => e.id),
    ),
    roles: missingIds(
      plan.expectedCoverage.roleIds,
      runtime.roles.map((r) => r.id),
    ),
  };

  const totalMissing = Object.values(missing).reduce((n, arr) => n + arr.length, 0);
  if (totalMissing > 0) {
    throw new AppError(
      "GENERATION_COVERAGE_FAILED",
      "Generated runtime is missing expected Blueprint coverage",
      { details: { missing } },
    );
  }

  return { ok: true, missing };
}
