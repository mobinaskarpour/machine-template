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
  DEMO_AUTO_DEPLOY: z.enum(["true", "false"]).default("false"),
  TELEGRAM_ADMIN_IDS: z.string().default(""),
  DEPLOYMENT_PORT_MIN: z.coerce.number().int().positive().default(3100),
  DEPLOYMENT_PORT_MAX: z.coerce.number().int().positive().default(3999),
  DEPLOYMENT_BIND_ADDRESS: z.string().default("127.0.0.1"),
  DEPLOYMENT_PUBLIC_ENABLED: z.enum(["true", "false"]).default("false"),
  DEPLOYMENT_BASE_DOMAIN: z.string().default(""),
  DEPLOYMENT_DOMAIN_PATTERN: z.string().default(""),
  NGINX_CONFIG_ROOT: z.string().default(""),
  SSL_PROVIDER: z.enum(["", "CERTBOT", "EXTERNAL"]).default(""),
  CERTBOT_EMAIL: z.string().default(""),
  DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK: z.enum(["true", "false"]).default("true"),
});

export type AppConfig = {
  telegramBotToken: string;
  cwd: string;
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
  demoAutoDeploy: boolean;
  telegramAdminIds: number[];
  deployment: {
    portMin: number;
    portMax: number;
    bindAddress: "127.0.0.1";
    publicEnabled: boolean;
    baseDomain: string;
    domainPattern: string;
    nginxConfigRoot: string;
    sslProvider: "" | "CERTBOT" | "EXTERNAL";
    certbotEmail: string;
    acceptNextHighLoopback: boolean;
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

/** Parse a comma-separated list of numeric Telegram user ids. Non-digit entries are ignored. */
export function parseTelegramAdminIds(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => Number(s))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
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
    DEMO_AUTO_DEPLOY: raw.DEMO_AUTO_DEPLOY ?? "false",
    TELEGRAM_ADMIN_IDS: raw.TELEGRAM_ADMIN_IDS ?? "",
    DEPLOYMENT_PORT_MIN: raw.DEPLOYMENT_PORT_MIN ?? "3100",
    DEPLOYMENT_PORT_MAX: raw.DEPLOYMENT_PORT_MAX ?? "3999",
    DEPLOYMENT_BIND_ADDRESS: raw.DEPLOYMENT_BIND_ADDRESS ?? "127.0.0.1",
    DEPLOYMENT_PUBLIC_ENABLED: raw.DEPLOYMENT_PUBLIC_ENABLED ?? "false",
    DEPLOYMENT_BASE_DOMAIN: raw.DEPLOYMENT_BASE_DOMAIN ?? "",
    DEPLOYMENT_DOMAIN_PATTERN: raw.DEPLOYMENT_DOMAIN_PATTERN ?? "",
    NGINX_CONFIG_ROOT: raw.NGINX_CONFIG_ROOT ?? "",
    SSL_PROVIDER: raw.SSL_PROVIDER ?? "",
    CERTBOT_EMAIL: raw.CERTBOT_EMAIL ?? "",
    DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK:
      raw.DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK ?? "true",
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

  if (parsed.data.DEPLOYMENT_BIND_ADDRESS !== "127.0.0.1") {
    throw new AppError(
      "CONFIGURATION_ERROR",
      'DEPLOYMENT_BIND_ADDRESS must be "127.0.0.1" — deployments never bind 0.0.0.0 or other interfaces',
    );
  }
  if (parsed.data.DEPLOYMENT_PORT_MIN >= parsed.data.DEPLOYMENT_PORT_MAX) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "DEPLOYMENT_PORT_MIN must be less than DEPLOYMENT_PORT_MAX",
    );
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
    cwd,
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
    demoAutoDeploy: parsed.data.DEMO_AUTO_DEPLOY === "true",
    telegramAdminIds: parseTelegramAdminIds(parsed.data.TELEGRAM_ADMIN_IDS),
    deployment: {
      portMin: parsed.data.DEPLOYMENT_PORT_MIN,
      portMax: parsed.data.DEPLOYMENT_PORT_MAX,
      bindAddress: "127.0.0.1",
      publicEnabled: parsed.data.DEPLOYMENT_PUBLIC_ENABLED === "true",
      baseDomain: parsed.data.DEPLOYMENT_BASE_DOMAIN,
      domainPattern: parsed.data.DEPLOYMENT_DOMAIN_PATTERN,
      nginxConfigRoot: parsed.data.NGINX_CONFIG_ROOT,
      sslProvider: parsed.data.SSL_PROVIDER,
      certbotEmail: parsed.data.CERTBOT_EMAIL,
      acceptNextHighLoopback:
        parsed.data.DEPLOYMENT_ACCEPT_NEXT_HIGH_LOOPBACK === "true",
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
    demoAutoDeploy: config.demoAutoDeploy,
    telegramAdminCount: config.telegramAdminIds.length,
    deployment: {
      portRange: `${config.deployment.portMin}-${config.deployment.portMax}`,
      bindAddress: config.deployment.bindAddress,
      publicEnabled: config.deployment.publicEnabled,
      baseDomainConfigured: Boolean(config.deployment.baseDomain),
      domainPatternConfigured: Boolean(config.deployment.domainPattern),
      nginxConfigRootConfigured: Boolean(config.deployment.nginxConfigRoot),
      sslProvider: config.deployment.sslProvider || "none",
      certbotEmailConfigured: Boolean(config.deployment.certbotEmail),
      acceptNextHighLoopback: config.deployment.acceptNextHighLoopback,
    },
  };
}
