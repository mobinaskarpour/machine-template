import type { CompanyKnowledge } from "../knowledge/company-knowledge-schema.js";
import type { MasterBuildSpecification } from "../specifications/master-build-specification-schema.js";
import type { CompanyOSBlueprint } from "./company-os-blueprint-schema.js";

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
  if (bp.agents.some((a) => a.executionMode !== "READ_ONLY" && a.executionMode !== "SUGGEST" && a.executionMode !== "APPROVAL_REQUIRED")) {
    blockingReasons.push("Invalid agent execution mode");
  }

  const highDash = bp.dashboards.filter((d) => d.priority === "HIGH");
  const tracedHigh =
    highDash.filter((d) => (d.trace?.length ?? 0) > 0).length +
    bp.workflows.filter((w) => w.priority === "HIGH" && (w.trace?.length ?? 0) > 0).length +
    bp.agents.filter((a) => a.priority === "HIGH" && (a.trace?.length ?? 0) > 0).length;
  const highTotal =
    highDash.length +
    bp.workflows.filter((w) => w.priority === "HIGH").length +
    bp.agents.filter((a) => a.priority === "HIGH").length;

  const completenessScore = Number(
    Math.min(
      1,
      (bp.dashboards.length > 0 ? 0.15 : 0) +
        (bp.modules.length > 0 ? 0.15 : 0) +
        (bp.workflows.length > 0 ? 0.15 : 0) +
        (bp.agents.length > 0 ? 0.1 : 0) +
        (bp.dataModel.entities.length >= 5 ? 0.2 : 0.1) +
        (bp.roles.length >= 3 ? 0.1 : 0.05) +
        (bp.permissionModel.permissions.length >= 5 ? 0.1 : 0.05) +
        (bp.implementationPlan.workstreams.length >= 5 ? 0.05 : 0),
    ).toFixed(3),
  );

  const consistencyScore = Number(
    Math.min(
      1,
      0.7 +
        (bp.navigation.primary.length > 0 ? 0.1 : 0) +
        (bp.dataModel.relationships.every(
          (r) =>
            bp.dataModel.entities.some((e) => e.id === r.fromEntityId) &&
            bp.dataModel.entities.some((e) => e.id === r.toEntityId),
        )
          ? 0.15
          : 0) +
        (bp.permissionModel.sensitiveOperations.every((s) => s.auditRequired) ? 0.05 : 0),
    ).toFixed(3),
  );

  const traceabilityScore = Number(
    (highTotal === 0 ? 0.85 : tracedHigh / highTotal).toFixed(3),
  );

  const securityScore = Number(
    Math.min(
      1,
      0.55 +
        (bp.permissionModel.strategy === "RBAC" ? 0.15 : 0) +
        (bp.permissionModel.sensitiveOperations.length > 0 ? 0.1 : 0) +
        (bp.agents.every((a) => a.prohibitedActions.length > 0) ? 0.1 : 0) +
        (bp.agents.every((a) => a.tools.every((t) => t.readOnly)) ? 0.1 : 0),
    ).toFixed(3),
  );

  const implementationReadinessScore = Number(
    Math.min(
      1,
      completenessScore * 0.35 +
        consistencyScore * 0.25 +
        traceabilityScore * 0.2 +
        securityScore * 0.2,
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
