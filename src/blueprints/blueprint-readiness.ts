import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import type { CompanyOSBlueprint } from "./company-os-blueprint-schema.js";

/**
 * Deterministic Blueprint quality scoring.
 *
 * Each dimension uses distinct measurable checks. Scores can fall below 1.0.
 * Unresolved non-blocking questions apply soft penalties; blocking questions block readiness.
 *
 * Completeness — presence and breadth of planning surfaces
 * Consistency — referential integrity and navigation coherence
 * Traceability — high-priority items retain Phase 2 traces
 * Security — RBAC, audit, agent tool constraints
 * Implementation readiness — weighted blend of the above
 */
export function calculateBlueprintQuality(input: {
  knowledge: CompanyKnowledge;
  specification: MasterBuildSpecification;
  blueprint: Omit<CompanyOSBlueprint, "quality" | "contentHash">;
}): CompanyOSBlueprint["quality"] {
  const bp = input.blueprint;
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  if (input.knowledge.status !== "READY") {
    blockingReasons.push(`CompanyKnowledge status is ${input.knowledge.status}`);
  }
  if (!input.specification.quality.readyForBlueprintGeneration) {
    blockingReasons.push("MasterBuildSpecification is not ready for blueprint generation");
  }
  if (bp.unresolvedQuestions.some((q) => q.blocking)) {
    blockingReasons.push("Blocking unresolved questions remain");
  }
  if (bp.dashboards.length === 0) warnings.push("No dashboards defined");
  if (bp.workflows.length === 0) warnings.push("No workflows defined");
  if (bp.modules.length === 0) warnings.push("No modules defined");
  if (
    bp.agents.some(
      (a) =>
        a.executionMode !== "READ_ONLY" &&
        a.executionMode !== "SUGGEST" &&
        a.executionMode !== "APPROVAL_REQUIRED",
    )
  ) {
    blockingReasons.push("Invalid agent execution mode");
  }

  const nonBlockingQuestions = bp.unresolvedQuestions.filter((q) => !q.blocking).length;
  const softQuestionPenalty = Math.min(0.12, nonBlockingQuestions * 0.015);

  // --- Completeness (breadth of surfaces) ---
  let completenessRaw = 0;
  completenessRaw += bp.dashboards.length >= 1 ? 0.12 : 0;
  completenessRaw += bp.dashboards.length >= 5 ? 0.06 : 0;
  completenessRaw += bp.modules.length >= 1 ? 0.1 : 0;
  completenessRaw += bp.modules.length >= 5 ? 0.05 : 0;
  completenessRaw += bp.workflows.length >= 1 ? 0.1 : 0;
  completenessRaw += bp.workflows.length >= 5 ? 0.05 : 0;
  completenessRaw += bp.agents.length >= 1 ? 0.08 : 0;
  completenessRaw += bp.dataModel.entities.length >= 5 ? 0.12 : bp.dataModel.entities.length > 0 ? 0.05 : 0;
  completenessRaw += bp.dataModel.entities.length >= 15 ? 0.05 : 0;
  completenessRaw += bp.roles.length >= 3 ? 0.08 : bp.roles.length > 0 ? 0.03 : 0;
  completenessRaw += bp.permissionModel.permissions.length >= 5 ? 0.08 : 0;
  completenessRaw += bp.implementationPlan.workstreams.length >= 5 ? 0.05 : 0;
  completenessRaw += bp.navigation.primary.length >= 3 ? 0.04 : 0;
  completenessRaw += bp.mockDataPlan.scenarios.length >= 3 ? 0.04 : 0;
  completenessRaw = Math.max(0, completenessRaw - softQuestionPenalty);
  const completenessScore = Number(Math.min(1, completenessRaw).toFixed(3));

  // --- Consistency (referential integrity) ---
  const roleIds = new Set(bp.roles.map((r) => r.id));
  const permIds = new Set(bp.permissionModel.permissions.map((p) => p.id));
  const entityIds = new Set(bp.dataModel.entities.map((e) => e.id));
  const sectionOk = bp.dashboards.every((d) =>
    d.widgets.every((w) => d.layout.sections.some((s) => s.id === w.sectionId)),
  );
  const rolePermOk = bp.roles.every((r) => r.permissions.every((p) => permIds.has(p)));
  const dashAudienceOk = bp.dashboards.every((d) =>
    d.audienceRoleIds.every((id) => roleIds.has(id)),
  );
  const relOk = bp.dataModel.relationships.every(
    (r) => entityIds.has(r.fromEntityId) && entityIds.has(r.toEntityId),
  );
  const wfOk = bp.workflows.every((w) =>
    w.transitions.every((t) => w.states.includes(t.from) && w.states.includes(t.to)),
  );
  let consistencyRaw = 0.25;
  consistencyRaw += bp.navigation.primary.length > 0 ? 0.1 : 0;
  consistencyRaw += sectionOk ? 0.12 : 0;
  consistencyRaw += rolePermOk ? 0.12 : 0;
  consistencyRaw += dashAudienceOk ? 0.1 : 0;
  consistencyRaw += relOk ? 0.15 : 0;
  consistencyRaw += wfOk ? 0.12 : 0;
  consistencyRaw += bp.permissionModel.sensitiveOperations.every((s) => s.auditRequired)
    ? 0.04
    : 0;
  if (!sectionOk) warnings.push("Dashboard widget/section mismatch");
  if (!relOk) warnings.push("Data model relationship endpoints incomplete");
  const consistencyScore = Number(Math.min(1, consistencyRaw).toFixed(3));

  // --- Traceability ---
  const highDash = bp.dashboards.filter((d) => d.priority === "HIGH");
  const highWf = bp.workflows.filter((w) => w.priority === "HIGH");
  const highAg = bp.agents.filter((a) => a.priority === "HIGH");
  const highMods = bp.modules.filter((m) => m.priority === "HIGH");
  const highTotal = highDash.length + highWf.length + highAg.length + highMods.length;
  const tracedHigh =
    highDash.filter((d) => (d.trace?.length ?? 0) > 0).length +
    highWf.filter((w) => (w.trace?.length ?? 0) > 0).length +
    highAg.filter((a) => (a.trace?.length ?? 0) > 0).length +
    highMods.filter((m) => (m.trace?.length ?? 0) > 0).length;
  const traceabilityScore = Number(
    (highTotal === 0 ? 0.55 : tracedHigh / highTotal).toFixed(3),
  );
  if (highTotal > 0 && tracedHigh < highTotal) {
    warnings.push("Some high-priority items lack traceability");
  }

  // --- Security ---
  let securityRaw = 0.2;
  securityRaw += bp.permissionModel.strategy === "RBAC" ? 0.15 : 0;
  securityRaw += bp.permissionModel.sensitiveOperations.length >= 2 ? 0.15 : 0;
  securityRaw += bp.permissionModel.sensitiveOperations.every((s) => s.approvalRequired)
    ? 0.1
    : 0;
  securityRaw += bp.permissionModel.sensitiveOperations.every((s) => s.auditRequired)
    ? 0.1
    : 0;
  securityRaw += bp.agents.length === 0 || bp.agents.every((a) => a.prohibitedActions.length >= 3)
    ? 0.15
    : 0;
  securityRaw += bp.agents.length === 0 || bp.agents.every((a) => a.tools.every((t) => t.readOnly))
    ? 0.15
    : 0;
  if (bp.roles.some((r) => r.permissions.includes("perm_admin_manage") && r.scope === "VIEWER")) {
    securityRaw -= 0.2;
    warnings.push("Viewer role appears over-privileged");
  }
  const securityScore = Number(Math.max(0, Math.min(1, securityRaw)).toFixed(3));

  const implementationReadinessScore = Number(
    Math.min(
      1,
      Math.max(
        0,
        completenessScore * 0.35 +
          consistencyScore * 0.25 +
          traceabilityScore * 0.2 +
          securityScore * 0.2 -
          (blockingReasons.length > 0 ? 0.25 : 0),
      ),
    ).toFixed(3),
  );

  const readyForCodeGeneration =
    blockingReasons.length === 0 &&
    input.knowledge.status === "READY" &&
    input.specification.quality.readyForBlueprintGeneration &&
    completenessScore >= 0.75 &&
    consistencyScore >= 0.85 &&
    traceabilityScore >= 0.8 &&
    securityScore >= 0.85 &&
    implementationReadinessScore >= 0.75;

  if (!readyForCodeGeneration && blockingReasons.length === 0) {
    warnings.push("Quality thresholds not fully met for code generation readiness");
  }
  if (nonBlockingQuestions > 0) {
    warnings.push(`${nonBlockingQuestions} unresolved non-blocking questions remain`);
  }

  return {
    completenessScore,
    consistencyScore,
    traceabilityScore,
    securityScore,
    implementationReadinessScore,
    readyForCodeGeneration,
    blockingReasons,
    warnings,
  };
}
