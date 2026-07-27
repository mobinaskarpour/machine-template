/** Safety helpers for Master Prompt construction. Never ingest raw research. */

const SECRETISH =
  /(api[_-]?key|telegram|bot[_-]?token|github[_-]?token|Bearer\s+[A-Za-z0-9._-]{10,}|sk-[A-Za-z0-9]{10,})/i;

export function assertNoRawResearch(prompt: string): void {
  if (/<\s*html[\s>]/i.test(prompt) || /<\s*script[\s>]/i.test(prompt)) {
    throw new Error("Master Prompt must not contain raw HTML");
  }
  if (/searchResults|organic_results|"tavily"|"serper"/i.test(prompt)) {
    throw new Error("Master Prompt must not contain raw search payloads");
  }
}

export function assertNoSecrets(prompt: string): void {
  if (SECRETISH.test(prompt)) {
    throw new Error("Master Prompt must not contain secret-like values");
  }
}

export function assertNoAbsoluteServerPaths(prompt: string): void {
  if (/\/root\/|\/home\/[^/\s]+\/|\/var\/lib\//.test(prompt)) {
    throw new Error("Master Prompt must not expose absolute server paths");
  }
}

export function sanitizePromptText(value: string): string {
  return value.replace(/\u0000/g, "").trim();
}
