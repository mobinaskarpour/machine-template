import { isAllowedGeneratedPath } from "../../generation/source-file-policy.js";

const CONTROL_PLANE_PREFIXES = [
  ".factory/",
  "artifacts/",
  "generated/",
  "data/companies/",
  "data/jobs/",
  "data/memory/",
  "src/app/main",
  "src/commands/",
  "src/jobs/",
  "src/persistence/",
];

const FORBIDDEN_NAME_RE =
  /(^|\/)(\.env(\.|$)|Dockerfile|docker-compose|ecosystem\.config)/i;

/**
 * Paths allowed for quality repair writes.
 * Reuses generation path policy and additionally rejects env/docker/pm2/control-plane.
 */
export function isAllowedRepairPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    return false;
  }
  if (FORBIDDEN_NAME_RE.test(normalized)) return false;
  if (
    CONTROL_PLANE_PREFIXES.some(
      (p) => normalized === p.replace(/\/$/, "") || normalized.startsWith(p),
    )
  ) {
    return false;
  }
  return isAllowedGeneratedPath(normalized);
}

export function assertAllowedRepairPaths(paths: string[]): void {
  const bad = paths.filter((p) => !isAllowedRepairPath(p));
  if (bad.length > 0) {
    throw new Error(`Repair paths not allowed: ${bad.slice(0, 10).join(", ")}`);
  }
}
