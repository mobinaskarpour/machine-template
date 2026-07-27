import { resolve, normalize, isAbsolute, sep } from "node:path";
import { AppError } from "../shared/errors.js";

export function normalizeRoot(root: string, cwd = process.cwd()): string {
  const absolute = isAbsolute(root) ? root : resolve(cwd, root);
  return normalize(absolute);
}

/**
 * Resolve a child path under root. Rejects traversal and absolute escapes.
 */
export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const normalizedRoot = normalizeRoot(root);
  const joined = resolve(normalizedRoot, ...segments);
  const rootWithSep = normalizedRoot.endsWith(sep)
    ? normalizedRoot
    : normalizedRoot + sep;

  if (joined !== normalizedRoot && !joined.startsWith(rootWithSep)) {
    throw new AppError(
      "PATH_OUTSIDE_ROOT",
      `Resolved path escapes root: ${joined}`,
      { details: { root: normalizedRoot, joined } },
    );
  }
  return joined;
}

export function assertInsideRoot(root: string, candidate: string): string {
  const normalizedRoot = normalizeRoot(root);
  const normalizedCandidate = normalizeRoot(candidate);
  const rootWithSep = normalizedRoot.endsWith(sep)
    ? normalizedRoot
    : normalizedRoot + sep;

  if (
    normalizedCandidate !== normalizedRoot &&
    !normalizedCandidate.startsWith(rootWithSep)
  ) {
    throw new AppError(
      "PATH_OUTSIDE_ROOT",
      `Path is outside configured root: ${normalizedCandidate}`,
      { details: { root: normalizedRoot, candidate: normalizedCandidate } },
    );
  }
  return normalizedCandidate;
}

export function isSafeSegment(segment: string): boolean {
  if (!segment || segment.trim() !== segment) return false;
  if (segment === "." || segment === "..") return false;
  if (segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
    return false;
  }
  return true;
}
