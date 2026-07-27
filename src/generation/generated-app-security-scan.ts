import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

export type SecurityFinding = {
  severity: "high" | "medium" | "low";
  path: string;
  snippet: string;
};

export type SecurityScanResult = {
  ok: boolean;
  findings: SecurityFinding[];
};

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
  ".yml",
  ".yaml",
  ".toml",
  ".env",
  ".txt",
  ".sh",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

type PatternRule = {
  severity: SecurityFinding["severity"];
  name: string;
  re: RegExp;
};

const RULES: PatternRule[] = [
  {
    severity: "high",
    name: "env-secret",
    re: /(?:^|\n)\s*(?:TELEGRAM_BOT_TOKEN|API_KEY|SECRET|PASSWORD|PRIVATE_KEY)\s*=\s*\S+/i,
  },
  { severity: "high", name: "child_process", re: /\bchild_process\b|\bspawnSync\b|\bexecSync\b/ },
  { severity: "high", name: "eval", re: /\beval\s*\(/ },
  { severity: "high", name: "new-function", re: /\bnew\s+Function\s*\(/ },
  {
    severity: "high",
    name: "dangerouslySetInnerHTML",
    re: /\bdangerouslySetInnerHTML\b/,
  },
  { severity: "high", name: "pm2-exec", re: /\bpm2\s+(?:start|restart|stop|delete|deploy)\b/i },
  { severity: "high", name: "docker-exec", re: /\bdocker(?:-compose)?\s+(?:build|run|up|push)\b/i },
  { severity: "high", name: "vercel-deploy", re: /\bvercel\s+deploy\b/i },
  { severity: "high", name: "curl-wget-pipe", re: /\b(?:curl|wget)\b[^;\n]{0,80}\|\s*(?:sh|bash)\b/i },
  {
    severity: "high",
    name: "cryptominer",
    re: /\b(?:coinhive|cryptonight|xmrig|minergate)\b/i,
  },
  {
    severity: "high",
    name: "reverse-shell",
    re: /\b(?:\/bin\/bash\s+-i|nc\s+-e|ncat\s+-e|reverse\s*shell)\b/i,
  },
  {
    severity: "high",
    name: "tunnel",
    re: /\b(?:ngrok|localtunnel|cloudflared\s+tunnel)\b/i,
  },
  {
    severity: "medium",
    name: "remote-script",
    re: /<script[^>]+src=["']https?:\/\//i,
  },
  {
    severity: "medium",
    name: "absolute-server-path",
    re: /(?:^|[^\w])\/(?:root|home|var|etc)\/[A-Za-z0-9._/-]+/,
  },
  {
    severity: "medium",
    name: "credential-url",
    re: /https?:\/\/[^/\s:]+:[^/\s]+@/i,
  },
];

async function listTextFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase();
      const base = entry.name;
      if (
        TEXT_EXTENSIONS.has(ext) ||
        base === "Dockerfile" ||
        base.startsWith(".env") ||
        base === "package.json"
      ) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

function snippetAround(text: string, index: number, length = 80): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + length);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

/**
 * Scan generated text files for high-risk patterns.
 * High severity findings make ok=false (blocks promotion).
 */
export async function scanGeneratedAppSecurity(
  stagingAppDir: string,
): Promise<SecurityScanResult> {
  const findings: SecurityFinding[] = [];
  let files: string[] = [];
  try {
    files = await listTextFiles(stagingAppDir);
  } catch (error) {
    return {
      ok: false,
      findings: [
        {
          severity: "high",
          path: ".",
          snippet: `Failed to list staging files: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  for (const file of files) {
    const rel = relative(stagingAppDir, file).replace(/\\/g, "/");
    const base = rel.split("/").pop() ?? rel;
    if (base === ".env" || base.startsWith(".env.")) {
      findings.push({
        severity: "high",
        path: rel,
        snippet: "Environment file must not be present in generated app",
      });
      continue;
    }
    if (base === "Dockerfile" || base === "docker-compose.yml") {
      findings.push({
        severity: "high",
        path: rel,
        snippet: "Container deployment files are forbidden in generated apps",
      });
      continue;
    }

    let text: string;
    try {
      const s = await stat(file);
      if (s.size > 1_500_000) continue;
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }

    // package.json scripts get extra curl/wget scrutiny
    for (const rule of RULES) {
      if (rel === "README.md" && (rule.name === "docker" || rule.name === "pm2")) {
        // Mentions in docs alone are medium unless instructing deploy.
        const match = rule.re.exec(text);
        if (match) {
          findings.push({
            severity: "low",
            path: rel,
            snippet: snippetAround(text, match.index),
          });
        }
        continue;
      }
      const match = rule.re.exec(text);
      if (match) {
        findings.push({
          severity: rule.severity,
          path: rel,
          snippet: snippetAround(text, match.index),
        });
      }
    }
  }

  const ok = !findings.some((f) => f.severity === "high");
  return { ok, findings };
}
