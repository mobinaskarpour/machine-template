import { AppError } from "../../shared/errors.js";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export function isValidDomainPattern(pattern: string): boolean {
  if (!pattern || pattern.length > 253) return false;
  if (!pattern.includes("{slug}")) return false;
  return /^[a-z0-9{}.-]+$/i.test(pattern);
}

export function assertSafeDomain(domain: string): string {
  if (!domain || domain.length > 253 || !DOMAIN_RE.test(domain)) {
    throw new AppError("VALIDATION_ERROR", `Unsafe or invalid domain: ${domain}`);
  }
  return domain;
}

/** Render `{slug}.apps.example.com`-style patterns into a concrete, validated domain. */
export function renderDomainForSlug(pattern: string, slug: string): string {
  if (!isValidDomainPattern(pattern)) {
    throw new AppError("VALIDATION_ERROR", `Invalid DEPLOYMENT_DOMAIN_PATTERN: ${pattern}`);
  }
  return assertSafeDomain(pattern.replace("{slug}", slug));
}
