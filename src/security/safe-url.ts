import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppError } from "../shared/errors.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return 0xffffffff;
  }
  return (
    (((parts[0]! << 24) >>> 0) +
      ((parts[1]! << 16) >>> 0) +
      ((parts[2]! << 8) >>> 0) +
      (parts[3]! >>> 0)) >>>
    0
  );
}

function isPrivateOrLocalIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const n = ipv4ToInt(ip) >>> 0;
    if (n === 0xffffffff) return true;
    // Compare with >>> 0 because JS bitwise ops are Int32.
    if (((n & 0xff000000) >>> 0) === 0x00000000) return true;
    if (((n & 0xff000000) >>> 0) === 0x0a000000) return true;
    if (((n & 0xff000000) >>> 0) === 0x7f000000) return true;
    if (((n & 0xffff0000) >>> 0) === 0xa9fe0000) return true;
    if (((n & 0xfff00000) >>> 0) === 0xac100000) return true;
    if (((n & 0xffff0000) >>> 0) === 0xc0a80000) return true;
    if (((n & 0xffc00000) >>> 0) === 0x64400000) return true;
    return false;
  }
  if (v === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isPrivateOrLocalIp(mapped);
    }
    return false;
  }
  return true;
}

export type SafeUrlOptions = {
  resolveDns?: boolean;
  allowHttp?: boolean;
};

export type ValidatedPublicUrl = {
  href: string;
  origin: string;
  hostname: string;
  protocol: "http:" | "https:";
};

/**
 * Validate a user/search URL for outbound fetch. Rejects SSRF targets and credentials.
 */
export async function assertSafePublicUrl(
  raw: string,
  options: SafeUrlOptions = {},
): Promise<ValidatedPublicUrl> {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch (error) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "Malformed URL", { cause: error });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError(
      "DISCOVERY_UNSAFE_URL",
      `Unsupported URL scheme: ${parsed.protocol}`,
    );
  }
  if (parsed.protocol === "http:" && options.allowHttp === false) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "HTTP URLs are not allowed");
  }
  if (parsed.username || parsed.password) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "URLs with credentials are not allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "URL hostname is empty");
  }
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new AppError("DISCOVERY_UNSAFE_URL", `Blocked hostname: ${hostname}`);
  }
  if (hostname === "169.254.169.254" || hostname === "metadata") {
    throw new AppError("DISCOVERY_UNSAFE_URL", "Cloud metadata endpoints are blocked");
  }

  if (isIP(hostname)) {
    if (isPrivateOrLocalIp(hostname)) {
      throw new AppError("DISCOVERY_UNSAFE_URL", `Private/local IP blocked: ${hostname}`);
    }
  } else if (options.resolveDns !== false) {
    try {
      const records = await lookup(hostname, { all: true, verbatim: true });
      if (!records.length) {
        throw new AppError("DISCOVERY_UNSAFE_URL", `DNS lookup returned no addresses for ${hostname}`);
      }
      for (const record of records) {
        if (isPrivateOrLocalIp(record.address)) {
          throw new AppError(
            "DISCOVERY_UNSAFE_URL",
            `Hostname resolves to private/local address: ${record.address}`,
          );
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("DISCOVERY_UNSAFE_URL", `DNS resolution failed for ${hostname}`, {
        cause: error,
      });
    }
  }

  return {
    href: parsed.href,
    origin: parsed.origin,
    hostname,
    protocol: parsed.protocol as "http:" | "https:",
  };
}

export function assertSafePublicUrlSync(raw: string): ValidatedPublicUrl {
  // Sync validation without DNS — used for schema checks / parser.
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch (error) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "Malformed URL", { cause: error });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError("DISCOVERY_UNSAFE_URL", `Unsupported URL scheme: ${parsed.protocol}`);
  }
  if (parsed.username || parsed.password) {
    throw new AppError("DISCOVERY_UNSAFE_URL", "URLs with credentials are not allowed");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname === "169.254.169.254"
  ) {
    throw new AppError("DISCOVERY_UNSAFE_URL", `Blocked hostname: ${hostname || "(empty)"}`);
  }
  if (isIP(hostname) && isPrivateOrLocalIp(hostname)) {
    throw new AppError("DISCOVERY_UNSAFE_URL", `Private/local IP blocked: ${hostname}`);
  }
  return {
    href: parsed.href,
    origin: parsed.origin,
    hostname,
    protocol: parsed.protocol as "http:" | "https:",
  };
}

export { isPrivateOrLocalIp };
