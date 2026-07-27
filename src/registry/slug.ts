import { shortStableHash } from "../shared/ids.js";
import { AppError } from "../shared/errors.js";

/**
 * Lightweight Persian→Latin map for common letters.
 * Company-agnostic — no brand-specific branches.
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
  // و is commonly a long vowel "o/u" in brand romanization (ماکارون → macaron)
  و: "o",
  ه: "h",
  ی: "i",
  ي: "i",
  ء: "",
  ئ: "i",
  ؤ: "o",
  ة: "h",
  "‌": "-", // ZWNJ
};

const HAS_PERSIAN = /[\u0600-\u06FF]/;

/** Normalize Arabic letter variants to Persian equivalents before transliteration. */
export function normalizePersianLetters(input: string): string {
  return input
    .normalize("NFC")
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/ة/g, "ه");
}

function transliteratePersian(input: string): string {
  const normalized = normalizePersianLetters(input);
  let out = "";
  for (const ch of normalized) {
    if (PERSIAN_MAP[ch] !== undefined) {
      out += PERSIAN_MAP[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Insert a short "a" only for the leading bare consonant pair in each word
 * (e.g. "zr" → "zar") without altering later syllables like "makaron".
 */
function insertShortVowels(latin: string): string {
  return latin
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      return part.replace(
        /^([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxz])/i,
        (match, a: string, b: string) => {
          const pair = `${a}${b}`.toLowerCase();
          if (["ch", "kh", "sh", "zh", "gh"].includes(pair)) return match;
          return `${a}a${b}`;
        },
      );
    })
    .join("");
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
 * Preferred readable slug for a display name (does not check collisions).
 * Existing workspaces are never renamed automatically — use migration CLI for that.
 */
export function suggestCanonicalSlug(displayName: string): string {
  const name = displayName.trim();
  if (!name) {
    throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
  }
  const source = HAS_PERSIAN.test(name)
    ? insertShortVowels(transliteratePersian(name))
    : name;
  let base = sanitizeSlugCandidate(source);
  if (!base || !/[a-z0-9]/.test(base)) {
    base = `company-${shortStableHash(name)}`;
  }
  if (base.length > 60) {
    const hash = shortStableHash(name, 8);
    base = `${base.slice(0, 50).replace(/-+$/g, "")}-${hash}`;
  }
  return base;
}

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

  let base = suggestCanonicalSlug(name);

  if (options.prefix) {
    const prefix = sanitizeSlugCandidate(options.prefix);
    base = prefix ? `${prefix}-${base}` : base;
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
