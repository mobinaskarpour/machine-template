import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../shared/errors.js";
import type { GenerationPlan } from "../generation-plan-schema.js";
import {
  ALLOWED_DEPENDENCIES,
  FORBIDDEN_DEPENDENCIES,
} from "../source-file-policy.js";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const DANGEROUS_SCRIPT_RE =
  /\b(curl|wget|Invoke-WebRequest|FetchContent|npm\s+install\s+-g|npx\s+.*--yes)\b/i;
const LIFECYCLE_SCRIPTS = [
  "preinstall",
  "install",
  "postinstall",
  "preuninstall",
  "postuninstall",
];

export type DependencyPolicyResult = {
  ok: true;
  dependencyNames: string[];
};

function dependencyNames(pkg: PackageJson): string[] {
  return [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ];
}

/**
 * Ensure package.json dependencies are a subset of allowed (plan + template originals)
 * and reject forbidden packages / dangerous lifecycle scripts.
 */
export async function validateDependencyPolicy(input: {
  stagingAppDir: string;
  plan: GenerationPlan;
  templatePackageJsonPath?: string;
}): Promise<DependencyPolicyResult> {
  const pkgPath = join(input.stagingAppDir, "package.json");
  let pkg: PackageJson;
  try {
    pkg = JSON.parse(await readFile(pkgPath, "utf8")) as PackageJson;
  } catch (error) {
    throw new AppError("GENERATION_POLICY_VIOLATION", "Missing or invalid package.json", {
      cause: error,
    });
  }

  const names = dependencyNames(pkg);
  const forbidden = new Set([
    ...FORBIDDEN_DEPENDENCIES,
    ...input.plan.policies.forbiddenDependencies,
  ]);
  const allowed = new Set([
    ...ALLOWED_DEPENDENCIES,
    ...input.plan.policies.allowedDependencies,
  ]);

  if (input.templatePackageJsonPath) {
    try {
      const templatePkg = JSON.parse(
        await readFile(input.templatePackageJsonPath, "utf8"),
      ) as PackageJson;
      for (const name of dependencyNames(templatePkg)) {
        allowed.add(name);
      }
    } catch {
      // Template package optional for callers that already baked allowed deps into the plan.
    }
  }

  const issues: string[] = [];
  for (const name of names) {
    if (forbidden.has(name)) {
      issues.push(`Forbidden dependency: ${name}`);
    } else if (!allowed.has(name)) {
      issues.push(`Dependency not in allowlist: ${name}`);
    }
  }

  const scripts = pkg.scripts ?? {};
  for (const scriptName of LIFECYCLE_SCRIPTS) {
    const body = scripts[scriptName];
    if (!body) continue;
    if (!input.plan.policies.allowPostinstallScripts) {
      issues.push(`Lifecycle script not allowed: ${scriptName}`);
      continue;
    }
    if (DANGEROUS_SCRIPT_RE.test(body)) {
      issues.push(`Dangerous lifecycle script: ${scriptName}`);
    }
  }

  for (const [scriptName, body] of Object.entries(scripts)) {
    if (LIFECYCLE_SCRIPTS.includes(scriptName)) continue;
    if (DANGEROUS_SCRIPT_RE.test(body) && /pre|post|install/i.test(scriptName)) {
      issues.push(`Suspicious install-related script: ${scriptName}`);
    }
  }

  if (issues.length > 0) {
    throw new AppError(
      "GENERATION_POLICY_VIOLATION",
      "Dependency policy validation failed",
      { details: { issues: issues.slice(0, 40) } },
    );
  }

  return { ok: true, dependencyNames: names };
}
