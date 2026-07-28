import { assertSafeSlug } from "../registry/slug.js";
import { AppError } from "../shared/errors.js";

const MAX_LENGTH = 48;
const SAFE_NAME_RE = /^[a-z0-9-]+$/;

/**
 * Deterministic pm2 process name for a company. ASCII-only, hyphen-delimited,
 * bounded to 48 chars, and free of any shell-meaningful characters — derived
 * only from the already-validated company slug, never from raw user text.
 */
export function buildProcessName(slug: string): string {
  const safeSlug = assertSafeSlug(slug);
  const full = `machine-${safeSlug}`;
  const truncated =
    full.length > MAX_LENGTH ? full.slice(0, MAX_LENGTH).replace(/-+$/, "") : full;
  if (!truncated || !SAFE_NAME_RE.test(truncated)) {
    throw new AppError("VALIDATION_ERROR", `Unsafe process name derived from slug: ${slug}`);
  }
  return truncated;
}

export type DeploymentColor = "blue" | "green";

/**
 * Blue/green variant of the base process name, used so a new release can be
 * started and health-checked under a distinct pm2 process name before the
 * previous one is stopped.
 */
export function colorProcessName(baseProcessName: string, color: DeploymentColor): string {
  const suffix = `-${color}`;
  const maxBaseLen = MAX_LENGTH - suffix.length;
  const base =
    baseProcessName.length > maxBaseLen
      ? baseProcessName.slice(0, maxBaseLen).replace(/-+$/, "")
      : baseProcessName;
  const name = `${base}${suffix}`;
  if (!SAFE_NAME_RE.test(name)) {
    throw new AppError("VALIDATION_ERROR", `Unsafe process name: ${name}`);
  }
  return name;
}

export function otherColor(color: DeploymentColor): DeploymentColor {
  return color === "blue" ? "green" : "blue";
}
