import type { SearchProvider, SearchResult } from "../../discovery/discovery-types.js";
import { AppError } from "../../shared/errors.js";
import { assertSafePublicUrl } from "../../security/safe-url.js";

/** Placeholder Serper adapter — implemented for interface completeness. */
export class SerperSearchProvider implements SearchProvider {
  readonly name = "serper";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async searchCompany(input: {
    companyName: string;
    countryHint?: string;
    websiteHint?: string;
    limit: number;
  }): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new AppError(
        "DISCOVERY_PROVIDER_NOT_CONFIGURED",
        "SERPER_API_KEY is not configured",
      );
    }
    const q = [input.companyName, "official website", input.countryHint]
      .filter(Boolean)
      .join(" ");
    let response: Response;
    try {
      response = await this.fetchImpl("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({ q, num: input.limit }),
      });
    } catch (error) {
      throw new AppError("DISCOVERY_SEARCH_FAILED", "Serper request failed", {
        cause: error,
      });
    }
    if (!response.ok) {
      throw new AppError(
        "DISCOVERY_SEARCH_FAILED",
        `Serper responded with HTTP ${response.status}`,
      );
    }
    const data = (await response.json()) as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
    };
    const results: SearchResult[] = [];
    for (const item of data.organic ?? []) {
      if (!item.link) continue;
      try {
        await assertSafePublicUrl(item.link, { resolveDns: false });
      } catch {
        continue;
      }
      results.push({
        title: item.title ?? item.link,
        url: item.link,
        snippet: item.snippet,
      });
    }
    return results;
  }
}
