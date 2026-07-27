import type { SearchResult, WebsiteCandidate } from "./discovery-types.js";

const DIRECTORY_HOST_RE =
  /(linkedin\.com|crunchbase\.com|bloomberg\.com|yellowpages|yelp\.com|wikipedia\.org|facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|glassdoor|indeed\.com)/i;
const MARKETPLACE_RE = /(godaddy|sedo|afternic|dan\.com|hugedomains|parked)/i;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (ch) => ch)
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim();
}

export function rankWebsiteCandidates(input: {
  companyName: string;
  results: SearchResult[];
}): WebsiteCandidate[] {
  const company = normalizeName(input.companyName);
  const tokens = company.split(/\s+/).filter((t) => t.length > 1);

  const ranked = input.results.map((result) => {
    const reasons: string[] = [];
    const penalties: string[] = [];
    let score = 0.2;
    let hostname = "";
    try {
      hostname = new URL(result.url).hostname.toLowerCase();
    } catch {
      return {
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        score: 0,
        reasons: [],
        penalties: ["invalid-url"],
      };
    }

    const hay = normalizeName(`${result.title ?? ""} ${result.snippet ?? ""} ${hostname}`);
    if (hay.includes(company)) {
      score += 0.45;
      reasons.push("exact-name-match");
    } else {
      const overlap = tokens.filter((t) => hay.includes(t)).length;
      if (tokens.length && overlap / tokens.length >= 0.6) {
        score += 0.25;
        reasons.push("partial-name-match");
      }
    }

    if (/official|شرکت|خانه|home|about/i.test(`${result.title} ${result.snippet}`)) {
      score += 0.1;
      reasons.push("official-signal");
    }

    if (DIRECTORY_HOST_RE.test(hostname)) {
      score -= 0.35;
      penalties.push("directory-or-social");
    }
    if (MARKETPLACE_RE.test(hostname) || MARKETPLACE_RE.test(result.title ?? "")) {
      score -= 0.5;
      penalties.push("parked-or-marketplace");
    }
    if (/news|article|blog/i.test(hostname)) {
      score -= 0.15;
      penalties.push("news-like");
    }
    if (result.score !== undefined) {
      score += Math.min(0.15, result.score * 0.15);
    }

    score = Math.max(0, Math.min(1, Number(score.toFixed(3))));
    return {
      url: result.url,
      title: result.title,
      snippet: result.snippet,
      score,
      reasons,
      penalties,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

export function selectTopWebsite(
  candidates: WebsiteCandidate[],
  minConfidence: number,
): { selected?: WebsiteCandidate; ambiguous: boolean } {
  const usable = candidates.filter((c) => c.score >= 0.35 && !c.penalties.includes("parked-or-marketplace"));
  if (usable.length === 0) return { ambiguous: true };
  const top = usable[0]!;
  const second = usable[1];
  if (top.score < minConfidence) return { selected: top, ambiguous: true };
  if (second && top.score - second.score < 0.12 && second.score >= 0.45) {
    return { selected: top, ambiguous: true };
  }
  return { selected: top, ambiguous: false };
}
