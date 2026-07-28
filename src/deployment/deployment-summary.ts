import type { PreDeploymentGateResult } from "./predeployment-gate-schema.js";
import type { DeploymentRecord } from "./deployment-record-schema.js";
import type { DeploymentHealthResult } from "./health-verifier.js";

export function formatPreDeploymentGateMessage(input: {
  companyDisplayName: string;
  gate: PreDeploymentGateResult;
}): string {
  const { gate } = input;
  const lines = [
    `Pre-deployment gate for ${input.companyDisplayName}`,
    `generation: ${gate.generationId}`,
    `result: ${gate.passed ? "PASSED" : "FAILED"}`,
    `dependency advisories: critical=${gate.dependencyAudit.critical} high=${gate.dependencyAudit.high} moderate=${gate.dependencyAudit.moderate}`,
    `browser QA: ${gate.browserQa.available ? (gate.browserQa.passed ? "passed" : "did not pass") : "unavailable"}`,
  ];
  if (gate.dependencyGate.acceptedRiskIds.length > 0) {
    lines.push(`accepted risk: ${gate.dependencyGate.acceptedRiskIds.join(", ")}`);
  }
  if (gate.blockingReasons.length > 0) {
    lines.push("blocking:", ...gate.blockingReasons.map((r) => `  - ${r}`));
  }
  if (gate.warnings.length > 0) {
    lines.push("warnings:", ...gate.warnings.map((r) => `  - ${r}`));
  }
  return lines.join("\n");
}

export function formatDeploymentMessage(input: {
  companyDisplayName: string;
  record: DeploymentRecord;
}): string {
  const { record } = input;
  return [
    `Deployment ${record.status} for ${input.companyDisplayName}`,
    `generation: ${record.generationId}`,
    `process: ${record.processName} (${record.color})`,
    `local URL: http://127.0.0.1:${record.port}/`,
    record.publicUrl ? `public URL: ${record.publicUrl}` : "public URL: none (loopback-only)",
  ].join("\n");
}

export function formatHealthMessage(input: {
  companyDisplayName: string;
  health: DeploymentHealthResult;
}): string {
  const { health } = input;
  return [
    `Health for ${input.companyDisplayName}: ${health.healthy ? "HEALTHY" : "UNHEALTHY"}`,
    ...health.checks.map(
      (c) => `  ${c.passed ? "[ok]" : "[fail]"} ${c.id}${c.message ? ` — ${c.message}` : ""}`,
    ),
    `restarts: ${health.restartCount}`,
  ].join("\n");
}
