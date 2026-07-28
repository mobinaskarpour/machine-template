export const TEMPLATE_ID = "generated-company-os-v2";
export const TEMPLATE_VERSION = "2.0.0";
export const TEMPLATE_RELATIVE_PATH = "templates/generated-company-os-v2";

export const ALLOWED_DEPENDENCIES = [
  "next",
  "react",
  "react-dom",
  "typescript",
  "tailwindcss",
  "postcss",
  "autoprefixer",
  "recharts",
  "zod",
  "clsx",
  "lucide-react",
  "vitest",
  "@types/node",
  "@types/react",
  "@types/react-dom",
];

export const FORBIDDEN_DEPENDENCIES = [
  "pm2",
  "dockerode",
  "puppeteer",
  "playwright",
  "ngrok",
  "localtunnel",
  "shelljs",
  "node-pty",
];

export const ALLOWED_GENERATED_PATH_PREFIXES = [
  "app/",
  "src/",
  "components/",
  "lib/",
  "data/",
  "public/",
  "tests/",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.mjs",
  "next.config.js",
  "next.config.ts",
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.mjs",
  "vitest.config.ts",
  "next-env.d.ts",
  "README.md",
];

export const FORBIDDEN_GENERATED_BASENAMES = [
  ".env",
  ".env.local",
  ".env.production",
  "Dockerfile",
  "docker-compose.yml",
  "ecosystem.config.js",
  "ecosystem.config.cjs",
];

export function isAllowedGeneratedPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normalized.includes("..") || normalized.startsWith("/")) return false;
  const base = normalized.split("/").pop() ?? normalized;
  if (FORBIDDEN_GENERATED_BASENAMES.includes(base)) return false;
  if (normalized.startsWith(".git/") || normalized === ".git") return false;
  return ALLOWED_GENERATED_PATH_PREFIXES.some(
    (p) => normalized === p.replace(/\/$/, "") || normalized.startsWith(p) || p.endsWith(normalized),
  );
}
