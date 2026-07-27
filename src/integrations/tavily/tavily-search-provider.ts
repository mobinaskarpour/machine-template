import type { SearchProvider, SearchResult } from "../../discovery/discovery-types.js";
import { AppError } from "../../shared/errors.js";
import { assertSafePublicUrl } from "../../security/safe-url.js";

export class TavilySearchProvider implements SearchProvider {
  readonly name = "tavily";

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
        "TAVILY_API_KEY is not configured",
      );
    }
    const query = [
      input.companyName,
      "official website",
      input.countryHint,
      input.websiteHint,
    ]
      .filter(Boolean)
      .join(" ");

    let response: Response;
    try {
      response = await this.fetchImpl("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: input.limit,
          include_answer: false,
          search_depth: "basic",
        }),
      });
    } catch (error) {
      throw new AppError("DISCOVERY_SEARCH_FAILED", "Tavily request failed", {
        cause: error,
      });
    }

    if (!response.ok) {
      throw new AppError(
        "DISCOVERY_SEARCH_FAILED",
        `Tavily responded with HTTP ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
    };
    const results: SearchResult[] = [];
    for (const item of data.results ?? []) {
      if (!item.url) continue;
      try {
        await assertSafePublicUrl(item.url, { resolveDns: false });
      } catch {
        continue;
      }
      results.push({
        title: item.title ?? item.url,
        url: item.url,
        snippet: item.content,
        score: item.score,
      });
    }
    return results;
  }
}
