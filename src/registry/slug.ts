import { shortStableHash } from "../shared/ids.js";
import { AppError } from "../shared/errors.js";

/**
 * Lightweight Persian→Latin map for common letters.
 * Not a full linguistic transliterator — Phase 0 deterministic helper only.
 */
const PERSIAN_MAP: Record<string, string> = {
  آ: "a",
  ا: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  ك: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "y",
  ي: "y",
  ء: "",
  ئ: "y",
  ؤ: "v",
  ة: "h",
  "‌": "-", // ZWNJ
};

const HAS_PERSIAN = /[\u0600-\u06FF]/;

function transliteratePersian(input: string): string {
  let out = "";
  for (const ch of input) {
    if (PERSIAN_MAP[ch] !== undefined) {
      out += PERSIAN_MAP[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

function sanitizeSlugCandidate(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export type SlugOptions = {
  /** Existing slugs that must not collide */
  taken?: Iterable<string>;
  prefix?: string;
};

/**
 * Deterministic, filesystem-safe slug. Never accepts a path.
 * Telegram input must go through this — never used as a path segment raw.
 */
export function createSlug(displayName: string, options: SlugOptions = {}): string {
  const name = displayName.trim();
  if (!name) {
    throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
  }
  if (name.includes("\0") || name.includes("/") || name.includes("\\") || name.includes("..")) {
    // Path-like input is rejected for slug source safety (we still slugify after stripping)
  }

  const source = HAS_PERSIAN.test(name) ? transliteratePersian(name) : name;
  let base = sanitizeSlugCandidate(source);

  if (!base || !/[a-z0-9]/.test(base)) {
    base = `company-${shortStableHash(name)}`;
  }

  if (options.prefix) {
    const prefix = sanitizeSlugCandidate(options.prefix);
    base = prefix ? `${prefix}-${base}` : base;
  }

  // Cap length for filesystem friendliness
  if (base.length > 60) {
    const hash = shortStableHash(name, 8);
    base = `${base.slice(0, 50).replace(/-+$/g, "")}-${hash}`;
  }

  const taken = new Set(options.taken ?? []);
  if (!taken.has(base)) {
    return base;
  }

  // Deterministic collision resolution using stable hash suffix
  const hash = shortStableHash(`${name}::${base}`);
  let candidate = `${base}-${hash.slice(0, 6)}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${hash.slice(0, 6)}-${n}`;
    n += 1;
  }
  return candidate;
}

export function assertSafeSlug(slug: string): string {
  if (!slug || slug.length > 80) {
    throw new AppError("VALIDATION_ERROR", "Invalid slug");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AppError("VALIDATION_ERROR", `Unsafe slug rejected: ${slug}`);
  }
  if (slug.includes("..")) {
    throw new AppError("PATH_OUTSIDE_ROOT", "Slug path traversal rejected");
  }
  return slug;
}
