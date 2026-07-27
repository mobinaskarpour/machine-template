import { z } from "zod";
import { resolve } from "node:path";
import { AppError } from "../shared/errors.js";
import { normalizeRoot } from "../security/paths.js";

const LogLevelSchema = z.enum([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
]);

const ConfigSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  DATA_ROOT: z.string().min(1).default("./data"),
  PROJECTS_ROOT: z.string().min(1).default("./data/projects"),
  LOG_LEVEL: LogLevelSchema.default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DISCOVERY_SEARCH_PROVIDER: z.enum(["tavily", "serper", "none", ""]).default(""),
  TAVILY_API_KEY: z.string().default(""),
  SERPER_API_KEY: z.string().default(""),
  DISCOVERY_MAX_SEARCH_RESULTS: z.coerce.number().int().positive().default(8),
  DISCOVERY_MAX_PAGES: z.coerce.number().int().positive().default(10),
  DISCOVERY_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  DISCOVERY_MAX_PAGE_BYTES: z.coerce.number().int().positive().default(1_500_000),
  DISCOVERY_MAX_TOTAL_TEXT_CHARS: z.coerce.number().int().positive().default(120_000),
  DISCOVERY_MIN_READY_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.65),
  DISCOVERY_MIN_WEBSITE_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.75),
  CODEX_MODEL: z.string().default(""),
  CODEX_DISCOVERY_TIMEOUT_MS: z.coerce.number().int().positive().default(180_000),
  DISCOVERY_SYNTHESIS_PROVIDER: z
    .enum(["deterministic", "codex", "auto", ""])
    .default("auto"),
});

export type AppConfig = {
  telegramBotToken: string;
  dataRoot: string;
  projectsRoot: string;
  companiesDir: string;
  jobsDir: string;
  logsDir: string;
  memoryDir: string;
  logLevel: z.infer<typeof LogLevelSchema>;
  nodeEnv: "development" | "test" | "production";
  discovery: {
    searchProvider: "tavily" | "serper" | "none";
    tavilyApiKey: string;
    serperApiKey: string;
    maxSearchResults: number;
    maxPages: number;
    fetchTimeoutMs: number;
    maxPageBytes: number;
    maxTotalTextChars: number;
    minReadyConfidence: number;
    minWebsiteConfidence: number;
    synthesisProvider: "deterministic" | "codex" | "auto";
  };
  codex: {
    model: string | undefined;
    discoveryTimeoutMs: number;
  };
};

export type ConfigInput = Record<string, string | undefined>;

function resolveSearchProvider(
  configured: string,
  tavilyKey: string,
  serperKey: string,
): "tavily" | "serper" | "none" {
  const preferred = configured.trim().toLowerCase();
  if (preferred === "tavily" && tavilyKey) return "tavily";
  if (preferred === "serper" && serperKey) return "serper";
  if (preferred === "none") return "none";
  if (tavilyKey) return "tavily";
  if (serperKey) return "serper";
  return "none";
}

export function loadConfig(
  raw: ConfigInput = process.env,
  options?: { cwd?: string; requireTelegramToken?: boolean },
): AppConfig {
  const cwd = options?.cwd ?? process.cwd();
  const requireTelegramToken = options?.requireTelegramToken ?? true;

  const parsed = ConfigSchema.safeParse({
    TELEGRAM_BOT_TOKEN: raw.TELEGRAM_BOT_TOKEN ?? "",
    DATA_ROOT: raw.DATA_ROOT ?? "./data",
    PROJECTS_ROOT: raw.PROJECTS_ROOT ?? "./data/projects",
    LOG_LEVEL: raw.LOG_LEVEL ?? "info",
    NODE_ENV: raw.NODE_ENV ?? "development",
    DISCOVERY_SEARCH_PROVIDER: raw.DISCOVERY_SEARCH_PROVIDER ?? "",
    TAVILY_API_KEY: raw.TAVILY_API_KEY ?? "",
    SERPER_API_KEY: raw.SERPER_API_KEY ?? "",
    DISCOVERY_MAX_SEARCH_RESULTS: raw.DISCOVERY_MAX_SEARCH_RESULTS ?? "8",
    DISCOVERY_MAX_PAGES: raw.DISCOVERY_MAX_PAGES ?? "10",
    DISCOVERY_FETCH_TIMEOUT_MS: raw.DISCOVERY_FETCH_TIMEOUT_MS ?? "15000",
    DISCOVERY_MAX_PAGE_BYTES: raw.DISCOVERY_MAX_PAGE_BYTES ?? "1500000",
    DISCOVERY_MAX_TOTAL_TEXT_CHARS: raw.DISCOVERY_MAX_TOTAL_TEXT_CHARS ?? "120000",
    DISCOVERY_MIN_READY_CONFIDENCE: raw.DISCOVERY_MIN_READY_CONFIDENCE ?? "0.65",
    DISCOVERY_MIN_WEBSITE_CONFIDENCE: raw.DISCOVERY_MIN_WEBSITE_CONFIDENCE ?? "0.75",
    CODEX_MODEL: raw.CODEX_MODEL ?? "",
    CODEX_DISCOVERY_TIMEOUT_MS: raw.CODEX_DISCOVERY_TIMEOUT_MS ?? "180000",
    DISCOVERY_SYNTHESIS_PROVIDER: raw.DISCOVERY_SYNTHESIS_PROVIDER ?? "auto",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError(
      "CONFIGURATION_ERROR",
      issue?.message ?? "Invalid configuration",
      { details: { issues: parsed.error.issues } },
    );
  }

  if (requireTelegramToken && !parsed.data.TELEGRAM_BOT_TOKEN.trim()) {
    throw new AppError("CONFIGURATION_ERROR", "TELEGRAM_BOT_TOKEN is required");
  }
  if (
    requireTelegramToken &&
    !/^\d+:[A-Za-z0-9_-]+$/.test(parsed.data.TELEGRAM_BOT_TOKEN)
  ) {
    throw new AppError("CONFIGURATION_ERROR", "TELEGRAM_BOT_TOKEN format is invalid");
  }

  const dataRoot = normalizeRoot(parsed.data.DATA_ROOT, cwd);
  const projectsRoot = normalizeRoot(parsed.data.PROJECTS_ROOT, cwd);
  const searchProvider = resolveSearchProvider(
    parsed.data.DISCOVERY_SEARCH_PROVIDER,
    parsed.data.TAVILY_API_KEY,
    parsed.data.SERPER_API_KEY,
  );

  return {
    telegramBotToken: parsed.data.TELEGRAM_BOT_TOKEN,
    dataRoot,
    projectsRoot,
    companiesDir: resolve(dataRoot, "companies"),
    jobsDir: resolve(dataRoot, "jobs"),
    logsDir: resolve(dataRoot, "logs"),
    memoryDir: resolve(dataRoot, "memory", "companies"),
    logLevel: parsed.data.LOG_LEVEL,
    nodeEnv: parsed.data.NODE_ENV,
    discovery: {
      searchProvider,
      tavilyApiKey: parsed.data.TAVILY_API_KEY,
      serperApiKey: parsed.data.SERPER_API_KEY,
      maxSearchResults: parsed.data.DISCOVERY_MAX_SEARCH_RESULTS,
      maxPages: parsed.data.DISCOVERY_MAX_PAGES,
      fetchTimeoutMs: parsed.data.DISCOVERY_FETCH_TIMEOUT_MS,
      maxPageBytes: parsed.data.DISCOVERY_MAX_PAGE_BYTES,
      maxTotalTextChars: parsed.data.DISCOVERY_MAX_TOTAL_TEXT_CHARS,
      minReadyConfidence: parsed.data.DISCOVERY_MIN_READY_CONFIDENCE,
      minWebsiteConfidence: parsed.data.DISCOVERY_MIN_WEBSITE_CONFIDENCE,
      synthesisProvider:
        parsed.data.DISCOVERY_SYNTHESIS_PROVIDER === ""
          ? "auto"
          : (parsed.data.DISCOVERY_SYNTHESIS_PROVIDER as
              | "deterministic"
              | "codex"
              | "auto"),
    },
    codex: {
      model: parsed.data.CODEX_MODEL.trim() || undefined,
      discoveryTimeoutMs: parsed.data.CODEX_DISCOVERY_TIMEOUT_MS,
    },
  };
}

export function publicConfigView(config: AppConfig): Record<string, unknown> {
  return {
    dataRoot: config.dataRoot,
    projectsRoot: config.projectsRoot,
    companiesDir: config.companiesDir,
    jobsDir: config.jobsDir,
    logsDir: config.logsDir,
    memoryDir: config.memoryDir,
    logLevel: config.logLevel,
    nodeEnv: config.nodeEnv,
    telegramBotTokenConfigured: Boolean(config.telegramBotToken),
    discoverySearchProvider: config.discovery.searchProvider,
    discoverySynthesisProvider: config.discovery.synthesisProvider,
    tavilyConfigured: Boolean(config.discovery.tavilyApiKey),
    serperConfigured: Boolean(config.discovery.serperApiKey),
    codexModelConfigured: Boolean(config.codex.model),
  };
}
