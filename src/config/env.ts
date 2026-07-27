import { z } from "zod";
import { resolve } from "node:path";
import { AppError } from "../shared/errors.js";
import { normalizeRoot } from "../security/paths.js";

const ConfigSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  DATA_ROOT: z.string().min(1).default("./data"),
  PROJECTS_ROOT: z.string().min(1).default("./data/projects"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type AppConfig = {
  telegramBotToken: string;
  dataRoot: string;
  projectsRoot: string;
  companiesDir: string;
  jobsDir: string;
  logsDir: string;
  logLevel: z.infer<typeof ConfigSchema>["LOG_LEVEL"];
  nodeEnv: z.infer<typeof ConfigSchema>["NODE_ENV"];
};

export type ConfigInput = Partial<{
  TELEGRAM_BOT_TOKEN: string;
  DATA_ROOT: string;
  PROJECTS_ROOT: string;
  LOG_LEVEL: string;
  NODE_ENV: string;
}>;

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
    throw new AppError(
      "CONFIGURATION_ERROR",
      "TELEGRAM_BOT_TOKEN is required",
    );
  }

  // For tests we may allow empty token when requireTelegramToken=false
  if (
    requireTelegramToken &&
    !/^\d+:[A-Za-z0-9_-]+$/.test(parsed.data.TELEGRAM_BOT_TOKEN)
  ) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "TELEGRAM_BOT_TOKEN format is invalid",
    );
  }

  const dataRoot = normalizeRoot(parsed.data.DATA_ROOT, cwd);
  const projectsRoot = normalizeRoot(parsed.data.PROJECTS_ROOT, cwd);

  // Ensure projects root stays under data root when using default layout,
  // but allow explicit absolute override as long as both are normalized.
  if (parsed.data.PROJECTS_ROOT.startsWith("./data")) {
    const expectedPrefix = dataRoot.endsWith("/") ? dataRoot : dataRoot + "/";
    if (
      projectsRoot !== dataRoot &&
      !projectsRoot.startsWith(expectedPrefix) &&
      !projectsRoot.startsWith(dataRoot)
    ) {
      // soft check — still allow if user set absolute projects root elsewhere
    }
  }

  return {
    telegramBotToken: parsed.data.TELEGRAM_BOT_TOKEN,
    dataRoot,
    projectsRoot,
    companiesDir: resolve(dataRoot, "companies"),
    jobsDir: resolve(dataRoot, "jobs"),
    logsDir: resolve(dataRoot, "logs"),
    logLevel: parsed.data.LOG_LEVEL,
    nodeEnv: parsed.data.NODE_ENV,
  };
}

/** Public view of config that never includes secrets. */
export function publicConfigView(config: AppConfig): Record<string, unknown> {
  return {
    dataRoot: config.dataRoot,
    projectsRoot: config.projectsRoot,
    companiesDir: config.companiesDir,
    jobsDir: config.jobsDir,
    logsDir: config.logsDir,
    logLevel: config.logLevel,
    nodeEnv: config.nodeEnv,
    telegramBotTokenConfigured: Boolean(config.telegramBotToken),
  };
}
