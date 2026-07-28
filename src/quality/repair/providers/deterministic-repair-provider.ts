import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CompanyOSBlueprint } from "../../../blueprints/company-os-blueprint-schema.js";
import { listFilesRecursive } from "../../../generation/generation-types.js";
import { nowIso } from "../../../shared/ids.js";
import { isAllowedRepairPath } from "../repair-file-policy.js";
import type {
  RepairProvider,
  RepairProviderInput,
  RepairProviderResult,
} from "./repair-provider.js";

const LOREM_RE = /lorem\s+ipsum/gi;

function emptyStateText(blueprint: CompanyOSBlueprint): string {
  const persian =
    blueprint.company.rtl ||
    blueprint.company.language.toLowerCase().startsWith("fa") ||
    /[\u0600-\u06FF]/.test(blueprint.company.displayName);
  return persian ? "موردی برای نمایش وجود ندارد." : "Nothing to display yet.";
}

async function readText(stagingAppDir: string, rel: string): Promise<string | null> {
  try {
    return await readFile(join(stagingAppDir, rel), "utf8");
  } catch {
    return null;
  }
}

async function writeText(
  stagingAppDir: string,
  rel: string,
  content: string,
): Promise<void> {
  if (!isAllowedRepairPath(rel)) return;
  await writeFile(join(stagingAppDir, rel), content, "utf8");
}

/**
 * Safe, scoped deterministic repairs only — no large rewrites.
 */
export class DeterministicRepairProvider implements RepairProvider {
  readonly providerId = "DETERMINISTIC";

  async repair(input: RepairProviderInput): Promise<RepairProviderResult> {
    const changed = new Set<string>();
    const notes: string[] = [];
    const { stagingAppDir, blueprint } = input;

    const layoutRelCandidates = ["src/app/layout.tsx", "src/app/layout.ts"];
    for (const rel of layoutRelCandidates) {
      const layout = await readText(stagingAppDir, rel);
      if (!layout) continue;
      let next = layout;
      const lang = blueprint.company.language.toLowerCase().startsWith("fa")
        ? "fa"
        : blueprint.company.language.slice(0, 2) || "en";
      const dir = blueprint.company.rtl ? "rtl" : "ltr";

      if (!/lang=/.test(next) || !/dir=/.test(next)) {
        if (/<html(\s[^>]*)?>/.test(next)) {
          next = next.replace(/<html(\s[^>]*)?>/, (full, attrs = "") => {
            let a = String(attrs);
            if (!/\blang=/.test(a)) a += ` lang="${lang}"`;
            if (!/\bdir=/.test(a)) a += ` dir="${dir}"`;
            return `<html${a}>`;
          });
        }
      }

      if (next !== layout) {
        await writeText(stagingAppDir, rel, next);
        changed.add(rel);
        notes.push(`Ensured lang/dir on ${rel}`);
      }
      break;
    }

    const shellRel = "src/components/AppShell.tsx";
    const shell = await readText(stagingAppDir, shellRel);
    if (shell && !/authLabel|Demo role|demo\.auth/.test(shell)) {
      // Ensure a visible demo auth label reference exists in the shell header area.
      let next = shell;
      if (/<\/header>/.test(next) && !/runtime\.demo\.authLabel/.test(next)) {
        next = next.replace(
          /<\/header>/,
          `  <p className="text-xs text-stone-500">{runtime.demo.authLabel}</p>\n        </header>`,
        );
        if (next !== shell) {
          await writeText(stagingAppDir, shellRel, next);
          changed.add(shellRel);
          notes.push("Added demo auth label reference to AppShell");
        }
      }
    }

    const runtimeRel = "src/data/blueprint-runtime.json";
    const runtimeRaw = await readText(stagingAppDir, runtimeRel);
    if (runtimeRaw) {
      try {
        const runtime = JSON.parse(runtimeRaw) as {
          demo?: Record<string, unknown>;
          company?: Record<string, unknown>;
        };
        let mutated = false;
        if (!runtime.demo || typeof runtime.demo !== "object") {
          runtime.demo = {};
          mutated = true;
        }
        if (!runtime.demo.authLabel || String(runtime.demo.authLabel).trim() === "") {
          runtime.demo.authLabel = blueprint.company.rtl
            ? "احراز هویت نمایشی — بدون ورود واقعی"
            : "Demo auth — no real login";
          mutated = true;
        }
        if (
          !runtime.demo.currencyAssumption ||
          String(runtime.demo.currencyAssumption).trim() === ""
        ) {
          runtime.demo.currencyAssumption = blueprint.company.rtl
            ? "مبالغ نمایشی و فرضی هستند"
            : "Amounts are synthetic demo values";
          mutated = true;
        }
        if (
          !runtime.demo.calendarAssumption ||
          String(runtime.demo.calendarAssumption).trim() === ""
        ) {
          runtime.demo.calendarAssumption = blueprint.company.rtl
            ? "تقویم نمایشی است"
            : "Calendar values are demo assumptions";
          mutated = true;
        }
        if (runtime.company && blueprint.company.rtl && runtime.company.rtl !== true) {
          runtime.company.rtl = true;
          mutated = true;
        }
        if (mutated) {
          await writeText(
            stagingAppDir,
            runtimeRel,
            `${JSON.stringify(runtime, null, 2)}\n`,
          );
          changed.add(runtimeRel);
          notes.push("Filled missing demo assumption labels in runtime");
        }
      } catch {
        // leave invalid JSON alone
      }
    }

    const settingsRel = "src/app/settings/page.tsx";
    const settings = await readText(stagingAppDir, settingsRel);
    if (settings && !/Demo assumptions|فرضیات دمو|demo\.authLabel/i.test(settings)) {
      const block = `
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-medium">Demo assumptions</h2>
        <ul className="mt-3 list-disc pe-5 text-sm text-stone-700">
          <li>{runtime.demo.currencyAssumption}</li>
          <li>{runtime.demo.calendarAssumption}</li>
          <li>{runtime.demo.authLabel}</li>
        </ul>
      </section>`;
      let next = settings;
      if (/<\/main>/.test(next)) {
        next = next.replace(/<\/main>/, `${block}\n    </main>`);
      } else {
        next = `${settings}\n${block}\n`;
      }
      if (next !== settings) {
        await writeText(stagingAppDir, settingsRel, next);
        changed.add(settingsRel);
        notes.push("Added demo assumptions section to settings");
      }
    }

    const replacement = emptyStateText(blueprint);
    const files = await listFilesRecursive(stagingAppDir);
    for (const file of files) {
      if (!file.path.startsWith("src/") || !/\.(tsx?|jsx?|md|json)$/.test(file.path)) {
        continue;
      }
      if (!isAllowedRepairPath(file.path)) continue;
      const text = await readText(stagingAppDir, file.path);
      if (!text || !LOREM_RE.test(text)) continue;
      const next = text.replace(LOREM_RE, replacement);
      if (next !== text) {
        await writeText(stagingAppDir, file.path, next);
        changed.add(file.path);
        notes.push(`Replaced Lorem Ipsum in ${file.path}`);
      }
    }

    void nowIso;
    return {
      filesChanged: [...changed].sort(),
      notes:
        notes.length > 0
          ? notes.join("; ")
          : "No deterministic repairs applied",
    };
  }
}
