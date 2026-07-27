import type { FetchedPage, WebsiteFetcher } from "../discovery-types.js";
import { AppError } from "../../shared/errors.js";
import { assertSafePublicUrl, isPrivateOrLocalIp } from "../../security/safe-url.js";
import { lookup } from "node:dns/promises";
import { nowIso } from "../../shared/ids.js";

const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "application/json",
  "application/xml",
  "text/xml",
];

const MAX_REDIRECTS = 5;
const USER_AGENT = "THE-MACHINE-DiscoveryBot/1.0 (+phase1; safe-fetch)";

export class SafeWebsiteFetcher implements WebsiteFetcher {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async fetchPage(input: {
    url: string;
    timeoutMs: number;
    maxBytes: number;
  }): Promise<FetchedPage> {
    let current = await assertSafePublicUrl(input.url, { resolveDns: true });
    let redirectCount = 0;

    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), input.timeoutMs);
      try {
        const response = await this.fetchImpl(current.href, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent": USER_AGENT,
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
          },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get("location");
          if (!location) {
            throw new AppError("DISCOVERY_FETCH_FAILED", "Redirect without Location header");
          }
          redirectCount += 1;
          if (redirectCount > MAX_REDIRECTS) {
            throw new AppError("DISCOVERY_FETCH_FAILED", "Too many redirects");
          }
          const nextUrl = new URL(location, current.href).href;
          current = await assertSafePublicUrl(nextUrl, { resolveDns: true });
          // Extra DNS private check after redirect
          const records = await lookup(current.hostname, { all: true }).catch(() => []);
          for (const r of records) {
            if (isPrivateOrLocalIp(r.address)) {
              throw new AppError(
                "DISCOVERY_UNSAFE_URL",
                `Redirect target resolves to private address: ${r.address}`,
              );
            }
          }
          continue;
        }

        if (!response.ok) {
          throw new AppError(
            "DISCOVERY_FETCH_FAILED",
            `HTTP ${response.status} for ${current.href}`,
          );
        }

        const contentType = (response.headers.get("content-type") ?? "")
          .split(";")[0]
          ?.trim()
          .toLowerCase() ?? "";
        if (
          contentType &&
          !ALLOWED_CONTENT_TYPES.some((t) => contentType === t || contentType.endsWith("+json"))
        ) {
          throw new AppError(
            "DISCOVERY_FETCH_FAILED",
            `Unsupported content-type: ${contentType}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new AppError("DISCOVERY_FETCH_FAILED", "Empty response body");
        }
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          size += value.byteLength;
          if (size > input.maxBytes) {
            await reader.cancel().catch(() => undefined);
            throw new AppError(
              "DISCOVERY_CONTENT_TOO_LARGE",
              `Response exceeded ${input.maxBytes} bytes`,
            );
          }
          chunks.push(value);
        }
        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
        return {
          url: input.url,
          finalUrl: current.href,
          statusCode: response.status,
          contentType,
          bodyText: buffer.toString("utf8"),
          bytes: buffer.byteLength,
          fetchedAt: nowIso(),
        };
      } catch (error) {
        if (error instanceof AppError) throw error;
        if ((error as Error).name === "AbortError") {
          throw new AppError("COMMAND_TIMEOUT", `Fetch timed out for ${current.href}`, {
            cause: error,
          });
        }
        throw new AppError("DISCOVERY_FETCH_FAILED", `Failed fetching ${current.href}`, {
          cause: error,
        });
      } finally {
        clearTimeout(timer);
      }
    }
  }
}
