const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "telegram_bot_token", regex: /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/g },
  { name: "github_pat", regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: "github_oauth", regex: /\bgho_[A-Za-z0-9]{20,}\b/g },
  { name: "github_fine_grained", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: "openai_key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "bearer", regex: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi },
  {
    name: "basic_auth_url",
    regex: /https?:\/\/[^/\s:@]+:[^/\s:@]+@/gi,
  },
  {
    name: "authorization_header",
    regex: /Authorization:\s*[^\r\n]+/gi,
  },
];

const SENSITIVE_ENV_KEYS = new Set([
  "TELEGRAM_BOT_TOKEN",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "OPENAI_API_KEY",
  "OPENAI_KEY",
  "CODEX_API_KEY",
  "ANTHROPIC_API_KEY",
  "AWS_SECRET_ACCESS_KEY",
  "DRAIN_SECRET",
]);

export function redactSecrets(input: string): string {
  let out = input;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern.regex, `[REDACTED:${pattern.name}]`);
  }
  return out;
}

export function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_ENV_KEYS.has(key.toUpperCase())) {
    return "[REDACTED]";
  }
  if (typeof value === "string") {
    return redactSecrets(value);
  }
  return value;
}

export function sanitizeErrorMessage(message: string): string {
  return redactSecrets(message);
}
